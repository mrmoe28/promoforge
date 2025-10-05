# Shotstack Text-to-Speech Voices

## Available Voices (en-US)

### Female Voices
- **Joanna** - Clear, professional female voice (Default)
- **Kendra** - Neutral, pleasant female voice  
- **Kimberly** - Warm, friendly female voice
- **Ivy** - Young, casual female voice
- **Salli** - Confident, articulate female voice

### Male Voices
- **Matthew** - Deep, authoritative male voice
- **Joey** - Young, energetic male voice
- **Justin** - Mature, professional male voice

## How to Change Voice

In `page.tsx`, update the `selectedVoice` field:

```typescript
const [audioSettings, setAudioSettings] = useState<AudioSettings>({
  // ...
  selectedVoice: 'Matthew', // Change to any voice name above
  // ...
})
```

## Supported Languages

Shotstack TTS supports multiple languages. For non-English voices:

- **en-GB**: Amy, Emma, Brian (British English)
- **en-AU**: Nicole, Russell (Australian English)  
- **es-ES**: Lucia, Enrique (Spanish)
- **fr-FR**: Celine, Mathieu (French)
- **de-DE**: Marlene, Hans (German)

## Usage in Code

```typescript
{
  asset: {
    type: 'text-to-speech',
    text: 'Your voiceover script here',
    voice: 'Joanna',      // Voice name
    language: 'en-US'     // Language code
  },
  start: 0,
  length: videoDuration,
  volume: 0.8
}
```

## Benefits Over External TTS

✅ **No External API Calls** - Direct integration with Shotstack
✅ **No File Storage** - Audio generated on-the-fly  
✅ **Reliable** - No upload/download failures
✅ **Cost Effective** - Included in Shotstack pricing
✅ **Simpler Code** - Fewer dependencies and error points

## Testing Different Voices

To test different voices, update the `selectedVoice` in the AudioControls component or directly in page.tsx.

For more details, see: https://shotstack.io/docs/api/

