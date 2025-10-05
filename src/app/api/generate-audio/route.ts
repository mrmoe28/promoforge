import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateSpeech, ELEVENLABS_VOICES, validateTextLength } from '@/lib/elevenlabs'
import { uploadAudioToBlob, generateUniqueFilename } from '@/lib/blob-storage'

// Request validation schema
const audioGenerationSchema = z.object({
  text: z.string().min(1, 'Text is required'),
  voiceId: z.string().min(1, 'Voice ID is required'),
  modelId: z.string().optional().default('eleven_turbo_v2_5'),
  stability: z.number().min(0).max(1).optional().default(0.5),
  similarityBoost: z.number().min(0).max(1).optional().default(0.75),
  style: z.number().min(0).max(1).optional().default(0),
  useSpeakerBoost: z.boolean().optional().default(true),
  optimizeStreamingLatency: z.number().min(0).max(4).optional().default(0),
})

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validatedData = audioGenerationSchema.parse(body)

    // Validate text length (ElevenLabs limit: 5000 characters)
    validateTextLength(validatedData.text, 5000)

    // Validate voice ID exists
    const voiceConfig = Object.values(ELEVENLABS_VOICES).find(
      (v) => v.id === validatedData.voiceId
    )

    if (!voiceConfig) {
      return NextResponse.json(
        {
          ok: false,
          error: `Invalid voice ID: ${validatedData.voiceId}`,
        },
        { status: 400 }
      )
    }

    console.log('🎙️  Audio generation request:', {
      voice: voiceConfig.name,
      textLength: validatedData.text.length,
      modelId: validatedData.modelId,
    })

    // Step 1: Generate audio with ElevenLabs
    const audioBuffer = await generateSpeech({
      voiceId: validatedData.voiceId,
      text: validatedData.text,
      modelId: validatedData.modelId,
      stability: validatedData.stability,
      similarityBoost: validatedData.similarityBoost,
      style: validatedData.style,
      useSpeakerBoost: validatedData.useSpeakerBoost,
      optimizeStreamingLatency: validatedData.optimizeStreamingLatency,
    })

    // Step 2: Upload to Vercel Blob storage
    const filename = generateUniqueFilename('voiceover')
    const publicUrl = await uploadAudioToBlob(audioBuffer, filename)

    console.log('✅ Audio generation complete:', {
      url: publicUrl,
      sizeKB: (audioBuffer.length / 1024).toFixed(2),
    })

    return NextResponse.json({
      ok: true,
      audioUrl: publicUrl,
      metadata: {
        voice: voiceConfig.name,
        textLength: validatedData.text.length,
        sizeBytes: audioBuffer.length,
        modelId: validatedData.modelId,
      },
    })

  } catch (error) {
    console.error('❌ Audio generation error:', error)

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    // Handle other errors
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve available voices
export async function GET() {
  try {
    const voices = Object.entries(ELEVENLABS_VOICES).map(([key, voice]) => ({
      id: voice.id,
      key,
      name: voice.name,
      gender: voice.gender,
      accent: voice.accent,
      description: voice.description,
    }))

    return NextResponse.json({
      ok: true,
      voices,
    })
  } catch (error) {
    console.error('❌ Error fetching voices:', error)

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
