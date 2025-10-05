import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY

if (!ELEVENLABS_API_KEY) {
  console.warn('⚠️  ELEVENLABS_API_KEY not configured - ElevenLabs TTS unavailable')
}

// Initialize ElevenLabs client
export const elevenLabsClient = ELEVENLABS_API_KEY
  ? new ElevenLabsClient({
      apiKey: ELEVENLABS_API_KEY,
    })
  : null

// ElevenLabs voice configurations
export const ELEVENLABS_VOICES = {
  // Pre-made voices (free tier)
  rachel: {
    id: '21m00Tcm4TlvDq8ikWAM',
    name: 'Rachel',
    gender: 'female',
    accent: 'American',
    description: 'Calm, clear, and professional',
  },
  domi: {
    id: 'AZnzlk1XvdvUeBnXmlld',
    name: 'Domi',
    gender: 'female',
    accent: 'American',
    description: 'Strong, confident, and authoritative',
  },
  bella: {
    id: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Bella',
    gender: 'female',
    accent: 'American',
    description: 'Soft, gentle, and soothing',
  },
  antoni: {
    id: 'ErXwobaYiN019PkySvjV',
    name: 'Antoni',
    gender: 'male',
    accent: 'American',
    description: 'Well-rounded, warm, and friendly',
  },
  elli: {
    id: 'MF3mGyEYCl7XYWbV9V6O',
    name: 'Elli',
    gender: 'female',
    accent: 'American',
    description: 'Energetic, young, and expressive',
  },
  josh: {
    id: 'TxGEqnHWrfWFTfGW9XjX',
    name: 'Josh',
    gender: 'male',
    accent: 'American',
    description: 'Deep, authoritative, and confident',
  },
  arnold: {
    id: 'VR6AewLTigWG4xSOukaG',
    name: 'Arnold',
    gender: 'male',
    accent: 'American',
    description: 'Crisp, clear, and professional',
  },
  adam: {
    id: 'pNInz6obpgDQGcFmaJgB',
    name: 'Adam',
    gender: 'male',
    accent: 'American',
    description: 'Deep, resonant, and engaging',
  },
  sam: {
    id: 'yoZ06aMxZJJ28mfd3POQ',
    name: 'Sam',
    gender: 'male',
    accent: 'American',
    description: 'Dynamic, raspy, and expressive',
  },
} as const

export type ElevenLabsVoiceId = keyof typeof ELEVENLABS_VOICES

// TTS generation options
export interface TTSOptions {
  voiceId: string
  text: string
  modelId?: string
  stability?: number
  similarityBoost?: number
  style?: number
  useSpeakerBoost?: boolean
  optimizeStreamingLatency?: number
}

/**
 * Generate speech audio using ElevenLabs TTS
 * @param options TTS configuration options
 * @returns Audio buffer (MP3 format)
 */
export async function generateSpeech(
  options: TTSOptions
): Promise<Buffer> {
  if (!elevenLabsClient) {
    throw new Error('ElevenLabs API key not configured')
  }

  const {
    voiceId,
    text,
    modelId = 'eleven_turbo_v2_5', // Latest model (2025)
    stability = 0.5,
    similarityBoost = 0.75,
    style = 0,
    useSpeakerBoost = true,
    optimizeStreamingLatency = 0, // 0-4, higher = faster but lower quality
  } = options

  try {
    console.log('🎙️  Generating speech with ElevenLabs:', {
      voiceId,
      textLength: text.length,
      modelId,
    })

    // Generate audio using the SDK v2
    const audioStream = await elevenLabsClient.textToSpeech.convert(voiceId, {
      text,
      modelId,
      voiceSettings: {
        stability,
        similarityBoost,
        style,
        useSpeakerBoost,
      },
      optimizeStreamingLatency,
    })

    // Convert stream to buffer
    const chunks: Buffer[] = []
    const reader = audioStream.getReader()

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (value) chunks.push(Buffer.from(value))
      }
    } finally {
      reader.releaseLock()
    }

    const audioBuffer = Buffer.concat(chunks)

    console.log('✅ Speech generated:', {
      sizeKB: (audioBuffer.length / 1024).toFixed(2),
    })

    return audioBuffer
  } catch (error) {
    console.error('❌ ElevenLabs TTS error:', error)
    throw new Error(
      `Failed to generate speech: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Get available ElevenLabs voices
 * @returns Array of voice configurations
 */
export function getAvailableVoices() {
  return Object.entries(ELEVENLABS_VOICES).map(([key, voice]) => ({
    key,
    voiceId: voice.id,
    name: voice.name,
    gender: voice.gender,
    accent: voice.accent,
    description: voice.description,
  }))
}

/**
 * Validate text length for TTS
 * @param text Input text
 * @param maxLength Maximum character limit (default: 5000 for ElevenLabs)
 * @returns true if valid, throws error if invalid
 */
export function validateTextLength(
  text: string,
  maxLength: number = 5000
): boolean {
  if (!text || text.trim() === '') {
    throw new Error('TTS text cannot be empty')
  }

  if (text.length > maxLength) {
    throw new Error(
      `Text exceeds ${maxLength} character limit (current: ${text.length} characters)`
    )
  }

  return true
}
