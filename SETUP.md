# PromoForge Setup Guide

## TTS/Voiceover Configuration

Your TTS implementation has been fixed! Here's what was wrong and how to complete the setup:

### What Was Broken

1. **Missing API Routes** - All API endpoints (`/api/render`, `/api/status`, `/api/scrape`) didn't exist
2. **No TTS Validation** - Text length, voice IDs, and parameters weren't validated
3. **CORS Issues** - Client-side API calls would fail due to browser restrictions
4. **No Error Handling** - Failed requests had no proper error messages

### What's Been Fixed

✅ Created `/api/render` with full TTS validation
✅ Created `/api/status/[id]` for render polling
✅ Created `/api/scrape` for single URL scraping
✅ Created `/api/scrape-multiple` for batch scraping
✅ Added proper error handling and logging
✅ Implemented TTS character limits (3000 chars)
✅ Validated Shotstack voice IDs
✅ Created missing components (AudioControls, ScreenshotGallery)

## Setup Instructions

### 1. Get Your Shotstack API Key

1. Go to https://dashboard.shotstack.io/
2. Sign up or log in
3. Navigate to API Keys section
4. Copy your API key

### 2. Configure Environment Variables

Open `.env.local` and add your API key:

```bash
SHOTSTACK_API_KEY=your_actual_api_key_here
```

### 3. Install Dependencies (if needed)

Ensure you have the required packages:

```bash
npm install zod
```

### 4. Test the TTS Feature

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open http://localhost:3000

3. Enter a URL to scrape

4. Enable voiceover in Audio Settings

5. Enter a script (max 3000 characters)

6. Select a voice (Joanna is default)

7. Click "Generate Promo Video"

## Supported TTS Voices

### English (US)
- **Joanna** - Clear, professional female (default)
- **Matthew** - Deep, authoritative male
- **Kendra** - Neutral, pleasant female
- **Joey** - Young, energetic male
- **Ivy** - Young, casual female
- **Justin** - Mature, professional male
- **Kimberly** - Warm, friendly female
- **Salli** - Confident, articulate female

### Other Languages
- **Amy, Emma, Brian** (British English)
- **Nicole, Russell** (Australian English)

## TTS Best Practices

### Character Limits
- Maximum: 3000 characters per voiceover
- Optimal: 500-1000 characters for 30-60 second videos
- The API will reject scripts exceeding the limit

### Script Writing Tips
1. Write conversationally - how you'd speak, not write
2. Use short sentences for better pacing
3. Avoid special characters that might confuse TTS
4. Test different voices to find the best fit

### Error Handling

The system now validates:
- ✅ TTS text is not empty
- ✅ Text doesn't exceed 3000 characters
- ✅ Voice ID is valid for Shotstack
- ✅ API key is configured
- ✅ Network connectivity

Common errors and solutions:

**"Missing Shotstack API key"**
- Add `SHOTSTACK_API_KEY` to `.env.local`

**"TTS text exceeds character limit"**
- Reduce script to under 3000 characters

**"Invalid voice"**
- Use one of the supported voices listed above

**"Failed to check render status"**
- Check your internet connection
- Verify API key is correct

## How TTS Works

1. **Client sends voiceover script** → `/api/render`
2. **API validates parameters** (text length, voice ID)
3. **Shotstack generates audio** (no file upload needed!)
4. **Audio is mixed with video** in the cloud
5. **Client polls** `/api/status/[id]` until done
6. **Download final video** with embedded voiceover

## Troubleshooting

### TTS Not Working

1. Check browser console for errors
2. Verify `.env.local` has valid API key
3. Restart dev server after adding env vars
4. Check Shotstack dashboard for API quota/limits

### Voice Sounds Wrong

- Try different voices from the list above
- Adjust voiceover volume (0-100%)
- Ensure script is grammatically correct

### Video Rendering Fails

- Check render status logs in terminal
- Verify Shotstack account is active
- Ensure images are accessible (not localhost URLs)

## API Reference

### POST /api/render
Creates a new video render with optional TTS

**Request Body:**
```json
{
  "timeline": {
    "tracks": [
      {
        "clips": [{
          "asset": {
            "type": "text-to-speech",
            "text": "Your script here",
            "voice": "Joanna",
            "language": "en-US"
          },
          "start": 0,
          "length": 30,
          "volume": 0.8
        }]
      }
    ]
  },
  "output": {
    "format": "mp4",
    "resolution": "hd"
  }
}
```

**Response:**
```json
{
  "ok": true,
  "shotstack": {
    "response": {
      "id": "render-id-here"
    }
  }
}
```

### GET /api/status/[id]
Checks render status

**Response:**
```json
{
  "ok": true,
  "shotstack": {
    "response": {
      "status": "done",
      "url": "https://cdn.shotstack.io/video.mp4"
    }
  }
}
```

## Next Steps

1. Add your Shotstack API key to `.env.local`
2. Restart the dev server
3. Test the voiceover feature
4. Adjust voice settings in `AudioControls.tsx` if needed

Need help? Check:
- Shotstack docs: https://shotstack.io/docs/
- TTS guide: https://shotstack.io/docs/api/#tts-assets
