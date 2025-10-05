# PromoForge - Context & Configuration

## Current Project State

PromoForge is a video generation application that creates promotional videos from website screenshots using:
- **Shotstack API** for video rendering and mixing
- **Firecrawl** for website scraping and screenshot capture
- **Audio options**: Background music and voiceover narration
- **Next.js 15** with App Router and React 19

## Architecture Overview

### Video Generation Pipeline
1. **Screenshot Capture** → Firecrawl scrapes website and captures screenshots
2. **Audio Generation** → Optional voiceover (TTS) and background music
3. **Video Rendering** → Shotstack combines screenshots + audio into video
4. **Status Polling** → Check render status until completion

### Key Components
- **Frontend**: `src/app/page.tsx` - Main UI with form inputs and preview
- **API Routes**:
  - `src/app/api/render/route.ts` - Submit render jobs to Shotstack
  - `src/app/api/status/[id]/route.ts` - Poll render status
  - `src/app/api/scrape/route.ts` - Scrape single URLs
  - `src/app/api/scrape-multiple/route.ts` - Scrape multiple URLs
- **Components**:
  - `src/components/AudioControls.tsx` - Audio settings UI
  - `src/components/ScreenshotGallery.tsx` - Screenshot preview

## Critical Configuration: Shotstack API Host

### THE PROBLEM (FIXED)
- **Issue**: Sending production API key to staging URL caused 502 errors
- **Root Cause**: Hardcoded `https://api.shotstack.io/v1/render` in API routes
- **Solution**: Made host configurable via environment variables

### Current Implementation
Both API routes now support flexible host configuration:

```typescript
const SHOTSTACK_API_ENV = process.env.SHOTSTACK_API_ENV || 'v1' // 'v1' (production) or 'stage'
const SHOTSTACK_HOST = process.env.SHOTSTACK_HOST || `https://api.shotstack.io/${SHOTSTACK_API_ENV}`
const SHOTSTACK_API_URL = `${SHOTSTACK_HOST}/render`
```

### Environment Variables (Production)

**Required for Vercel Production:**
```bash
SHOTSTACK_API_KEY=<your_production_key>
SHOTSTACK_API_ENV=v1
# Optional: Set full host URL directly
# SHOTSTACK_HOST=https://api.shotstack.io/v1
```

**Development (.env.local):**
```bash
SHOTSTACK_API_KEY=<your_dev_or_prod_key>
SHOTSTACK_API_ENV=v1
```

### Deployment Checklist

1. ✅ Update API routes to use environment-based host (DONE)
2. ⏳ Set Vercel environment variables:
   - `SHOTSTACK_API_KEY` = production API key
   - `SHOTSTACK_API_ENV` = `v1`
3. ⏳ Redeploy application (triggers automatically on git push)
4. ⏳ Test pipeline: no-audio → music → voiceover

## Audio System Architecture

### Current TTS Implementation
- **Provider**: Shotstack built-in TTS (AWS Polly voices)
- **Voices Available**: Joanna, Matthew, Kendra, Joey, Ivy, Justin, Kimberly, Salli
- **Character Limit**: 3000 characters per TTS clip
- **Validation**: Voice name and text length validation in `/api/render/route.ts`

### ElevenLabs Integration ✅ IMPLEMENTED
**Why ElevenLabs?**
- Higher quality, more natural-sounding voices
- Better emotional expression and intonation
- Supports longer text (5000 chars vs Shotstack's 3000)
- Professional-grade narration

**Implementation:**
1. User selects ElevenLabs provider and voice in UI
2. Frontend calls `/api/generate-audio` with script and voice ID
3. Backend generates audio via ElevenLabs API (`eleven_turbo_v2_5` model)
4. Audio uploaded to Vercel Blob storage (public access)
5. Public URL returned to frontend
6. Frontend includes audio URL in Shotstack render payload
7. Shotstack mixes external audio into video

**Note**: Shotstack does NOT synthesize ElevenLabs voices directly. It only mixes pre-generated audio files.

**Available ElevenLabs Voices:**
- **Rachel**: Calm, clear, and professional (Female, US)
- **Domi**: Strong, confident, and authoritative (Female, US)
- **Bella**: Soft, gentle, and soothing (Female, US)
- **Antoni**: Well-rounded, warm, and friendly (Male, US)
- **Elli**: Energetic, young, and expressive (Female, US)
- **Josh**: Deep, authoritative, and confident (Male, US)
- **Arnold**: Crisp, clear, and professional (Male, US)
- **Adam**: Deep, resonant, and engaging (Male, US)
- **Sam**: Dynamic, raspy, and expressive (Male, US)

### Audio Workflow Options

**Option 1: Shotstack TTS (Current)**
```json
{
  "type": "text-to-speech",
  "text": "Your script here",
  "voice": "Joanna"
}
```

**Option 2: External Audio (ElevenLabs + Vercel Blob) ✅ IMPLEMENTED**
```json
{
  "type": "audio",
  "src": "https://your-blob-store.public.blob.vercel-storage.com/voiceover-123.mp3",
  "volume": 1.0
}
```

### Key Files Added

**Services:**
- `src/lib/elevenlabs.ts` - ElevenLabs TTS client and voice configurations
- `src/lib/blob-storage.ts` - Vercel Blob upload utilities

**API Routes:**
- `src/app/api/generate-audio/route.ts` - Audio generation endpoint
  - POST: Generate audio with ElevenLabs + upload to Blob
  - GET: List available ElevenLabs voices

**Updated Files:**
- `src/components/AudioControls.tsx` - Added TTS provider selection
- `src/app/api/render/route.ts` - Added validation for external audio URLs

## Known Issues & Solutions

### Issue 1: 502 Bad Gateway from Shotstack ✅ FIXED
- **Problem**: Production key sent to staging URL
- **Solution**: Set `SHOTSTACK_API_ENV=v1` in environment variables
- **Verification**: Check API logs for correct host URL

### Issue 2: ElevenLabs TTS Scope ✅ CONFIGURED
- **Requirement**: ElevenLabs API key must have TTS scope enabled
- **Check**: Verify API key permissions in ElevenLabs dashboard
- **Storage**: Ensure upload target (Vercel Blob) is publicly accessible

### Issue 3: Bad Request with Audio (TTS/Music) ✅ FIXED
- **Problem**: Video generation worked without audio but failed with "Bad Request" when adding voiceover or music
- **Root Cause**: Incorrect `length` parameter for TTS clips (was numeric, should be `'auto'`)
- **Solution**:
  - TTS clips: Use `length: 'auto'` to let Shotstack calculate duration
  - Voiceover audio: Omit `length` parameter to play full audio
  - Background music: Keep `length: videoDuration` to trim to video length
- **Also Fixed**:
  - Moved `volume` to asset level for cleaner structure
  - Added URL accessibility validation for external audio
  - Enhanced error logging for better debugging
- **See**: [AUDIO_FIX_SUMMARY.md](./AUDIO_FIX_SUMMARY.md) for complete details

## Testing Protocol

### No-Audio Test
1. Disable voiceover and music in UI
2. Submit render request
3. Verify video renders with screenshots only
4. Check status polling completes successfully

### Music-Only Test
1. Enable background music
2. Select music track or custom URL
3. Submit render request
4. Verify audio track mixed correctly

### Voiceover Test (Shotstack TTS)
1. Enable voiceover
2. Enter script (<3000 chars)
3. Select voice (e.g., Joanna)
4. Submit render request
5. Verify narration audio in final video

### Full Pipeline Test (Music + Voiceover)
1. Enable both music and voiceover
2. Configure settings
3. Submit render request
4. Verify both audio tracks mixed correctly
5. Check audio levels (voiceover should be clear over music)

## Next Steps

1. **Update Vercel Environment Variables** (Priority: HIGH)
   - Add `SHOTSTACK_API_ENV=v1` to production environment
   - Verify `SHOTSTACK_API_KEY` is set to production key

2. **Redeploy Application**
   - Push changes to trigger automatic Vercel deployment
   - Monitor deployment logs for errors

3. **Run Full Test Suite**
   - Execute no-audio → music → voiceover tests
   - Verify all render requests succeed
   - Check video output quality

4. **ElevenLabs Integration** (Future Enhancement)
   - Set up ElevenLabs API key with TTS scope
   - Implement audio generation endpoint
   - Add Vercel Blob upload for public storage
   - Update UI to support provider selection

## Recent Decisions

### 2025-01-XX: ElevenLabs TTS Integration
- **Decision**: Implement ElevenLabs as primary TTS provider with Shotstack fallback
- **Reasoning**: Higher quality voices, better emotional expression, longer text support
- **Implementation**:
  - ElevenLabs SDK for speech generation
  - Vercel Blob for public audio storage
  - `/api/generate-audio` endpoint for audio generation pipeline
  - UI provider selection in AudioControls component
- **Impact**: Professional-grade voiceovers, improved user experience

### 2025-01-XX: Shotstack Host Configuration
- **Decision**: Make Shotstack API host configurable via environment variables
- **Reasoning**: Avoid hardcoding production URLs, support staging/production switching
- **Implementation**: `SHOTSTACK_API_ENV` and `SHOTSTACK_HOST` environment variables
- **Impact**: Fixes 502 errors when using production API keys

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SHOTSTACK_API_KEY` | ✅ Yes | - | Shotstack API key (get from dashboard) |
| `SHOTSTACK_API_ENV` | No | `v1` | API version: `v1` (prod) or `stage` |
| `SHOTSTACK_HOST` | No | `https://api.shotstack.io/{env}` | Full API host URL (overrides `SHOTSTACK_API_ENV`) |
| `ELEVENLABS_API_KEY` | ✅ Yes* | - | ElevenLabs API key for TTS (*required for ElevenLabs voices) |
| `BLOB_READ_WRITE_TOKEN` | ✅ Yes* | - | Vercel Blob storage token (*required for audio uploads) |

## Architecture Notes

### Why Not Use ElevenLabs Directly in Shotstack?
Shotstack cannot synthesize ElevenLabs voices. It only supports:
1. Built-in TTS (AWS Polly voices)
2. External audio files (MP3, WAV, etc.)

To use ElevenLabs voices:
1. Generate audio with ElevenLabs API
2. Upload to public storage (Vercel Blob, S3, CDN)
3. Pass public URL to Shotstack as audio asset

### Video Rendering Flow
```
User Input
  ↓
Firecrawl Scraping → Screenshots
  ↓
Audio Generation (Optional)
  ├─ Shotstack TTS (current)
  └─ ElevenLabs + Upload (future)
  ↓
Shotstack Render Request
  ├─ Screenshots (images)
  ├─ Background Music (audio URL)
  └─ Voiceover (TTS or audio URL)
  ↓
Status Polling (every 3s)
  ↓
Video URL (MP4)
```

## Feature Status

- ✅ **Screenshot Scraping**: Complete (Firecrawl integration)
- ✅ **Video Rendering**: Complete (Shotstack API)
- ✅ **Background Music**: Complete (audio URL mixing)
- ✅ **Voiceover (Shotstack TTS)**: Complete (AWS Polly voices)
- ✅ **Voiceover (ElevenLabs)**: Complete (high-quality TTS)
- ✅ **Host Configuration**: Complete (environment-based)
- ✅ **ElevenLabs Integration**: Complete (9 premium voices)
- ✅ **Audio Upload Service**: Complete (Vercel Blob storage)
- ✅ **Provider Selection UI**: Complete (choose TTS provider)

## Lessons Learned

1. **API Environment Matters**: Production keys only work with production URLs
2. **Make Everything Configurable**: Hardcoded URLs cause deployment issues
3. **External Audio Workflow**: TTS providers require upload step before mixing
4. **Character Limits**: Shotstack TTS has 3000 char limit per clip
5. **Public Access Required**: Audio files must be publicly accessible for Shotstack

---

*Last Updated: 2025-01-XX*
*Project Status: Production configuration in progress*
