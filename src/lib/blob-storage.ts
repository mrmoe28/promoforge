import { put } from '@vercel/blob'

/**
 * Upload audio file to Vercel Blob storage
 * @param audioBuffer Audio data buffer
 * @param filename Base filename (without extension)
 * @returns Public URL of uploaded file
 */
export async function uploadAudioToBlob(
  audioBuffer: Buffer,
  filename: string = 'voiceover'
): Promise<string> {
  try {
    console.log('📤 Uploading audio to Vercel Blob:', {
      filename,
      sizeKB: (audioBuffer.length / 1024).toFixed(2),
    })

    // Upload to Vercel Blob with public access
    const blob = await put(`${filename}.mp3`, audioBuffer, {
      access: 'public',
      addRandomSuffix: true, // Adds unique suffix to prevent caching issues
      contentType: 'audio/mpeg',
    })

    console.log('✅ Audio uploaded successfully:', {
      url: blob.url,
      downloadUrl: blob.downloadUrl,
    })

    return blob.url
  } catch (error) {
    console.error('❌ Blob upload error:', error)
    throw new Error(
      `Failed to upload audio: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Generate unique filename with timestamp
 * @param prefix Filename prefix
 * @returns Unique filename
 */
export function generateUniqueFilename(prefix: string = 'audio'): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `${prefix}-${timestamp}-${random}`
}
