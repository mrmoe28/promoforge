import { NextRequest, NextResponse } from 'next/server'

const SHOTSTACK_API_KEY = process.env.SHOTSTACK_API_KEY
const SHOTSTACK_API_ENV = process.env.SHOTSTACK_API_ENV || 'v1' // 'v1' (production) or 'stage'
const SHOTSTACK_HOST = process.env.SHOTSTACK_HOST || `https://api.shotstack.io/${SHOTSTACK_API_ENV}`
const SHOTSTACK_API_URL = `${SHOTSTACK_HOST}/render`

// Shotstack TTS character limit
const MAX_TTS_LENGTH = 3000

// Valid Shotstack TTS voices
const VALID_VOICES = [
  'Joanna', 'Kendra', 'Kimberly', 'Ivy', 'Salli', // Female en-US
  'Matthew', 'Joey', 'Justin', // Male en-US
  'Amy', 'Emma', 'Brian', // en-GB
  'Nicole', 'Russell', // en-AU
]

interface TTSAsset {
  type: 'text-to-speech'
  text: string
  voice?: string
  language?: string
}

interface AudioAsset {
  type: 'audio'
  src: string
  volume?: number
}

interface ImageAsset {
  type: 'image'
  src: string
}

interface Clip {
  asset: TTSAsset | AudioAsset | ImageAsset
  start: number
  length?: number | 'auto'  // Optional: omit for audio, use 'auto' for TTS
  volume?: number
  fit?: string
  effect?: string
}

interface Track {
  clips: Clip[]
}

interface Timeline {
  background?: string
  tracks: Track[]
}

interface RenderPayload {
  timeline: Timeline
  output: {
    format: string
    resolution: string
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check for API key
    if (!SHOTSTACK_API_KEY) {
      console.error('SHOTSTACK_API_KEY is not configured')
      return NextResponse.json(
        {
          ok: false,
          error: 'Server configuration error: Missing Shotstack API key'
        },
        { status: 500 }
      )
    }

    const body: RenderPayload = await request.json()

    // Log the incoming request for debugging
    console.log('📥 Received render request:', {
      trackCount: body.timeline?.tracks?.length || 0,
      background: body.timeline?.background,
      output: body.output,
      tracks: body.timeline?.tracks?.map((track, idx) => ({
        trackIndex: idx,
        clipCount: track.clips.length,
        firstClipType: track.clips[0]?.asset?.type
      }))
    })

    // Validate audio clips (both TTS and external audio)
    if (body.timeline?.tracks) {
      for (const track of body.timeline.tracks) {
        for (const clip of track.clips) {
          const asset = clip.asset

          // Validate Shotstack TTS clips
          if (asset.type === 'text-to-speech') {
            const ttsAsset = asset as TTSAsset

            // Validate text exists
            if (!ttsAsset.text || ttsAsset.text.trim() === '') {
              return NextResponse.json(
                {
                  ok: false,
                  error: 'TTS text cannot be empty'
                },
                { status: 400 }
              )
            }

            // Validate text length
            if (ttsAsset.text.length > MAX_TTS_LENGTH) {
              return NextResponse.json(
                {
                  ok: false,
                  error: `TTS text exceeds ${MAX_TTS_LENGTH} character limit (current: ${ttsAsset.text.length} characters)`
                },
                { status: 400 }
              )
            }

            // Validate voice
            if (ttsAsset.voice && !VALID_VOICES.includes(ttsAsset.voice)) {
              return NextResponse.json(
                {
                  ok: false,
                  error: `Invalid voice "${ttsAsset.voice}". Valid voices: ${VALID_VOICES.join(', ')}`
                },
                { status: 400 }
              )
            }

            console.log('✅ Shotstack TTS validation passed:', {
              textLength: ttsAsset.text.length,
              voice: ttsAsset.voice,
              language: ttsAsset.language
            })
          }

          // Validate external audio clips (e.g., from ElevenLabs)
          if (asset.type === 'audio') {
            const audioAsset = asset as AudioAsset

            // Validate audio URL exists
            if (!audioAsset.src || audioAsset.src.trim() === '') {
              return NextResponse.json(
                {
                  ok: false,
                  error: 'Audio source URL cannot be empty'
                },
                { status: 400 }
              )
            }

            // Validate URL format
            try {
              new URL(audioAsset.src)
            } catch {
              return NextResponse.json(
                {
                  ok: false,
                  error: `Invalid audio URL: ${audioAsset.src}`
                },
                { status: 400 }
              )
            }

            // Test if URL is accessible (HEAD request)
            try {
              console.log('🔍 Testing audio URL accessibility:', audioAsset.src)
              const urlTest = await fetch(audioAsset.src, { method: 'HEAD' })
              if (!urlTest.ok) {
                return NextResponse.json(
                  {
                    ok: false,
                    error: `Audio URL is not accessible (${urlTest.status}): ${audioAsset.src}`
                  },
                  { status: 400 }
                )
              }
              console.log('✅ Audio URL is accessible')
            } catch (fetchError) {
              return NextResponse.json(
                {
                  ok: false,
                  error: `Cannot access audio URL: ${audioAsset.src}`,
                  details: fetchError instanceof Error ? fetchError.message : 'Unknown error'
                },
                { status: 400 }
              )
            }

            console.log('✅ External audio validation passed:', {
              url: audioAsset.src,
            })
          }
        }
      }
    }

    // Call Shotstack API
    console.log('🎬 Sending render request to Shotstack...')
    const response = await fetch(SHOTSTACK_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': SHOTSTACK_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Shotstack API error:', {
        status: response.status,
        statusText: response.statusText,
        responseData: data,
        requestPayload: body
      })

      // Extract the most detailed error message
      let detailedError = data.message || 'Shotstack API request failed'

      // Check for validation errors in the response
      if (data.data && Array.isArray(data.data)) {
        detailedError = data.data.map((err: { message: string }) => err.message).join(', ')
      } else if (data.error) {
        detailedError = data.error
      }

      return NextResponse.json(
        {
          ok: false,
          errorFromShotstack: data,
          error: detailedError,
          requestSummary: {
            trackCount: body.timeline.tracks.length,
            hasAudio: body.timeline.tracks.some(t =>
              t.clips.some(c => c.asset.type === 'audio' || c.asset.type === 'text-to-speech')
            )
          }
        },
        { status: response.status }
      )
    }

    console.log('✅ Shotstack render started:', data.response?.id)

    return NextResponse.json({
      ok: true,
      shotstack: data
    })

  } catch (error) {
    console.error('💥 Render API error:', error)

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}
