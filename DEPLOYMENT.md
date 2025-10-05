# PromoForge - Deployment Guide

## Prerequisites
- Shotstack API key (production)
- Vercel account with project deployed
- Git repository pushed to GitHub/GitLab

## Step 1: Update Vercel Environment Variables

### Option A: Via Vercel Dashboard (Recommended)

1. Go to your Vercel project dashboard: https://vercel.com/dashboard
2. Select your PromoForge project
3. Navigate to **Settings** → **Environment Variables**
4. Add the following variables for **Production**:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `SHOTSTACK_API_KEY` | Your production API key | Production |
| `SHOTSTACK_API_ENV` | `v1` | Production |

5. Click **Save** for each variable

### Option B: Via Vercel CLI

If your project is linked to Vercel:

```bash
# Navigate to project directory
cd /Users/ekodevapps/Desktop/app-studio/promoforge

# Add environment variables
vercel env add SHOTSTACK_API_ENV production
# Enter: v1

vercel env add SHOTSTACK_API_KEY production
# Enter: your_production_api_key
```

## Step 2: Verify Local Configuration

Check your local `.env.local` file has the correct settings:

```bash
# .env.local
SHOTSTACK_API_KEY=your_api_key_here
SHOTSTACK_API_ENV=v1
```

**DO NOT** commit `.env.local` to git (it should be in `.gitignore`)

## Step 3: Deploy Changes

### Option A: Git Push (Automatic Deployment)

```bash
# Commit the changes
git add .
git commit -m "fix: configure Shotstack production API host

- Add environment-based host configuration
- Support SHOTSTACK_API_ENV and SHOTSTACK_HOST variables
- Default to production (v1) API endpoint
- Update environment file examples"

# Push to main branch
git push origin main
```

Vercel will automatically deploy when you push to your main branch.

### Option B: Manual Deployment

```bash
# Deploy to production
vercel --prod
```

## Step 4: Verify Deployment

1. Wait for deployment to complete (check Vercel dashboard)
2. Check deployment logs for any errors
3. Visit your production URL
4. Open browser developer console (F12)
5. Check Network tab for API calls

### Expected Behavior After Fix:
- ✅ `/api/render` should return `{ ok: true, shotstack: { ... } }`
- ✅ No 502 Bad Gateway errors
- ✅ Render requests should succeed
- ✅ Status polling should work correctly

### If Still Failing:
1. Check Vercel deployment logs for errors
2. Verify environment variables are set correctly
3. Ensure `SHOTSTACK_API_KEY` is production key (not stage)
4. Check Shotstack API status: https://status.shotstack.io/

## Step 5: Test the Pipeline

### Test 1: No-Audio Video
1. Go to your production app
2. Enter a website URL
3. Disable voiceover and music
4. Click "Generate Video"
5. Wait for render to complete
6. Verify video plays correctly

### Test 2: Music-Only Video
1. Enable background music
2. Select a music track
3. Generate video
4. Verify music plays in output

### Test 3: Voiceover-Only Video
1. Enable voiceover
2. Enter a script (< 3000 characters)
3. Select a voice (e.g., Joanna)
4. Generate video
5. Verify narration is clear

### Test 4: Full Pipeline (Music + Voiceover)
1. Enable both music and voiceover
2. Configure settings
3. Generate video
4. Verify both audio tracks are mixed correctly
5. Check voiceover is audible over music

## Debugging Production Issues

### Check Environment Variables
```bash
# Via Vercel CLI
vercel env ls

# Or check in Vercel Dashboard
# Settings → Environment Variables
```

### View Deployment Logs
```bash
# Via Vercel CLI
vercel logs --follow

# Or view in Vercel Dashboard
# Deployments → [Latest] → View Logs
```

### Test API Endpoints Directly

**Test Render Endpoint:**
```bash
curl -X POST https://your-app.vercel.app/api/render \
  -H "Content-Type: application/json" \
  -d '{
    "timeline": {
      "tracks": [
        {
          "clips": [
            {
              "asset": {
                "type": "image",
                "src": "https://via.placeholder.com/1920x1080"
              },
              "start": 0,
              "length": 3
            }
          ]
        }
      ]
    },
    "output": {
      "format": "mp4",
      "resolution": "1080"
    }
  }'
```

**Expected Response:**
```json
{
  "ok": true,
  "shotstack": {
    "success": true,
    "message": "Created",
    "response": {
      "id": "abc123-xyz789",
      "message": "Created"
    }
  }
}
```

**Test Status Endpoint:**
```bash
curl https://your-app.vercel.app/api/status/abc123-xyz789
```

## Rollback Plan

If deployment fails or breaks production:

### Option 1: Revert via Vercel Dashboard
1. Go to Vercel Dashboard → Deployments
2. Find the last working deployment
3. Click "..." → **Promote to Production**

### Option 2: Revert via Git
```bash
# Find the last working commit
git log --oneline

# Revert to previous commit
git revert HEAD

# Or reset to specific commit (DANGEROUS)
git reset --hard <commit-hash>
git push --force origin main
```

### Option 3: Rollback Environment Variables
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Remove or modify the problematic variables
3. Redeploy: **Deployments** → **Redeploy** (keep existing build cache)

## Common Issues & Solutions

### Issue 1: 502 Bad Gateway
**Cause**: Wrong API host or invalid API key
**Solution**: Verify `SHOTSTACK_API_ENV=v1` and key is correct

### Issue 2: 401 Unauthorized
**Cause**: Invalid or missing API key
**Solution**: Check `SHOTSTACK_API_KEY` is set and valid

### Issue 3: Environment Variables Not Loading
**Cause**: Variables not set for correct environment
**Solution**: Ensure variables are set for **Production**, not just **Preview**

### Issue 4: Changes Not Reflected
**Cause**: Vercel caching or old build
**Solution**: Clear build cache and redeploy

```bash
# Redeploy without cache
vercel --prod --force
```

## Security Checklist

- ✅ API keys stored in environment variables (not hardcoded)
- ✅ `.env.local` in `.gitignore`
- ✅ Production keys only in production environment
- ✅ No sensitive data in git repository
- ✅ Environment variables scoped to correct environment

## Post-Deployment Monitoring

### Watch for These Metrics:
1. **Error Rate**: Should be < 1% after fix
2. **Response Time**: `/api/render` should respond in < 2s
3. **Success Rate**: Render jobs should succeed > 95%
4. **Status Polling**: Should complete without timeouts

### Monitoring Tools:
- Vercel Analytics (runtime logs)
- Vercel Speed Insights (performance)
- Browser DevTools (client-side errors)
- Shotstack Dashboard (render statistics)

## Next Steps After Successful Deployment

1. ✅ Verify all tests pass (no-audio → music → voiceover)
2. ⏳ Monitor error rates for 24 hours
3. ⏳ Plan ElevenLabs integration (future enhancement)
4. ⏳ Set up automated testing (e2e tests)
5. ⏳ Configure monitoring/alerting

---

**Need Help?**
- Shotstack API Docs: https://shotstack.io/docs/api/
- Vercel Docs: https://vercel.com/docs
- GitHub Issues: [Your Repository]

*Last Updated: 2025-01-XX*
