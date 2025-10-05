# Audio Features Fix Summary

## Problem
Video generation worked fine WITHOUT audio, but failed with **Error: Bad Request** when adding:
- Voice over (TTS or ElevenLabs)
- Background music

## Root Causes Identified

### 1. TTS Clip Length Parameter (CRITICAL)
**Issue**: Using numeric `length` value for text-to-speech clips
```typescript
// ❌ WRONG - Causes Bad Request error
{
  asset: { type: 'text-to-speech', text: '...', voice: 'Joanna' },
  start: 0,
  length: 30,  // This breaks TTS!
  volume: 0.8
}
```

**Fix**: Use `length: 'auto'` for TTS clips
```typescript
// ✅ CORRECT
{
  asset: { type: 'text-to-speech', text: '...', voice: 'Joanna' },
  start: 0,
  length: 'auto',  // Shotstack auto-calculates TTS duration
  volume: 0.8
}
```

### 2. Volume Parameter Location
**Issue**: Volume was on clip level for some audio types

**Fix**: Volume belongs on the **asset** for external audio:
```typescript
// ✅ CORRECT - Volume on asset
{
  asset: {
    type: 'audio',
    src: 'https://example.com/audio.mp3',
    volume: 0.3  // Volume here for audio assets
  },
  start: 0,
  length: 30  // OK to specify length for music trimming
}
```

**Note**: For clips, volume can also be on the clip level:
```typescript
// ✅ ALSO CORRECT - Volume on clip
{
  asset: { type: 'text-to-speech', text: '...', voice: 'Joanna' },
  start: 0,
  length: 'auto',
  volume: 0.8  // Volume on clip works too
}
```

### 3. Audio Clip Length for External Audio
**Issue**: Setting `length` on voiceover audio could cause issues if audio is shorter

**Fix**: Omit `length` for voiceover, keep it for background music:
```typescript
// Voiceover - let it play full duration
{
  asset: { type: 'audio', src: 'voiceover.mp3', volume: 0.8 },
  start: 0
  // No length - plays full audio
}

// Background music - trim to video length
{
  asset: { type: 'audio', src: 'music.mp3', volume: 0.3 },
  start: 0,
  length: videoDuration  // Trim music to match video
}
```

## Files Changed

### 1. `/src/app/page.tsx`
- **TTS clips**: Changed `length: videoDuration` → `length: 'auto'`
- **Voiceover audio**: Moved volume to asset, removed length parameter
- **Background music**: Kept length parameter for trimming, moved volume to asset
- **Added detailed logging** for debugging payloads

### 2. `/src/app/api/render/route.ts`
- **Enhanced error logging** to show full Shotstack error details
- **Added URL accessibility check** for external audio (HEAD request)
- **Improved validation error messages** with detailed breakdown
- **Updated TypeScript types** to allow `length: 'auto'`

### 3. Type Definitions Updated
```typescript
interface Clip {
  asset: TTSAsset | AudioAsset | ImageAsset
  start: number
  length?: number | 'auto'  // Allow 'auto' for TTS
  volume?: number
  fit?: string
  effect?: string
}
```

## Testing Recommendations

### Test 1: TTS Voice Over Only
```typescript
audioSettings = {
  enableVoiceover: true,
  voiceoverScript: "Your promotional script here",
  selectedVoice: "Joanna",  // Shotstack voice
  voiceoverVolume: 80,
  ttsProvider: "shotstack",
  enableMusic: false
}
```

**Expected**: Video with TTS narration, no background music

### Test 2: ElevenLabs Voice Over Only
```typescript
audioSettings = {
  enableVoiceover: true,
  voiceoverScript: "Your promotional script here",
  selectedVoice: "21m00Tcm4TlvDq8ikWAM",  // ElevenLabs Rachel
  voiceoverVolume: 80,
  ttsProvider: "elevenlabs",
  enableMusic: false
}
```

**Expected**: Video with high-quality ElevenLabs narration

### Test 3: Background Music Only
```typescript
audioSettings = {
  enableVoiceover: false,
  enableMusic: true,
  selectedMusic: "upbeat-1",
  musicVolume: 30
}
```

**Expected**: Video with background music trimmed to video length

### Test 4: Combined Audio (Full Test)
```typescript
audioSettings = {
  enableVoiceover: true,
  voiceoverScript: "Your promotional script here",
  selectedVoice: "21m00Tcm4TlvDq8ikWAM",
  voiceoverVolume: 80,
  ttsProvider: "elevenlabs",
  enableMusic: true,
  selectedMusic: "calm-1",
  musicVolume: 20  // Lower volume so voiceover is clear
}
```

**Expected**: Video with both ElevenLabs voiceover and background music

## Debugging Tips

### Check Browser Console
The frontend now logs detailed payload information:
```javascript
console.log('Payload validation:', {
  totalTracks: 2,  // Images + audio
  trackDetails: [...]
})
```

### Check Server Logs (Vercel/Local)
The API route logs:
```
📥 Received render request: { trackCount: 2, ... }
🔍 Testing audio URL accessibility: https://...
✅ Audio URL is accessible
✅ External audio validation passed
```

### Common Errors and Solutions

**Error**: `TTS text exceeds 3000 character limit`
- **Solution**: Split long scripts into multiple TTS clips or use ElevenLabs (5000 char limit)

**Error**: `Invalid voice "Rachel"`
- **Solution**: "Rachel" is an ElevenLabs voice, not Shotstack. Use voice IDs for ElevenLabs.

**Error**: `Audio URL is not accessible`
- **Solution**: Ensure Vercel Blob URLs are public, check BLOB_READ_WRITE_TOKEN

**Error**: `Bad Request` (generic)
- **Solution**: Check console logs for detailed Shotstack error message

## Key Learnings

1. **Shotstack TTS uses `length: 'auto'`** - critical for proper TTS rendering
2. **Volume can be on asset OR clip** - both work, asset-level is cleaner
3. **Omit length for voiceover** - let audio play full duration
4. **Keep length for music** - trim background music to match video
5. **Always test URL accessibility** - external audio must be publicly accessible
6. **Detailed logging is essential** - helps diagnose Shotstack API errors quickly

## Environment Variables Required

```bash
# Shotstack (required)
SHOTSTACK_API_KEY=your_production_key
SHOTSTACK_API_ENV=v1

# ElevenLabs (optional, for high-quality TTS)
ELEVENLABS_API_KEY=your_elevenlabs_key

# Vercel Blob (required if using ElevenLabs)
BLOB_READ_WRITE_TOKEN=your_blob_token
```

## Next Steps

1. ✅ Deploy fixes to production
2. ⏳ Test all four scenarios above
3. ⏳ Monitor Shotstack render success rate
4. ⏳ Gather user feedback on audio quality

---

*Last Updated: 2025-01-XX*
*Status: Ready for deployment*
