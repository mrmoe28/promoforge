'use client'

import { useState } from 'react'
import Image from 'next/image'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { urlSchema, type UrlInput } from '@/lib/schemas'
import type { ScrapedAsset } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Loader2, Video, Sparkles, Plus, Trash2 } from 'lucide-react'
import { AudioControls, type AudioSettings } from '@/components/AudioControls'
import { ScreenshotGallery } from '@/components/ScreenshotGallery'

export default function Home() {
  const [isLoading, setIsLoading] = useState(false)
  const [scrapedData, setScrapedData] = useState<ScrapedAsset | null>(null)
  const [multipleScrapedData, setMultipleScrapedData] = useState<ScrapedAsset[]>([])
  const [selectedScreenshots, setSelectedScreenshots] = useState<string[]>([])
  const [inputMode, setInputMode] = useState<'single' | 'multiple'>('single')
  const [multipleUrls, setMultipleUrls] = useState<string[]>([''])
  const [isGenerating, setIsGenerating] = useState(false)
  const [renderId, setRenderId] = useState<string | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)

  const [audioSettings, setAudioSettings] = useState<AudioSettings>({
    enableVoiceover: false,
    voiceoverScript: '',
    selectedVoice: 'Joanna', // Shotstack TTS voice (female, en-US)
    voiceoverVolume: 80,
    enableMusic: false,
    selectedMusic: 'upbeat-1',
    musicVolume: 30,
    customMusicUrl: undefined,
    customMusicName: undefined
  })

  const form = useForm<UrlInput>({
    resolver: zodResolver(urlSchema),
    defaultValues: {
      url: '',
    },
  })

  const addUrlInput = () => {
    if (multipleUrls.length < 10) {
      setMultipleUrls([...multipleUrls, ''])
    }
  }

  const removeUrlInput = (index: number) => {
    const newUrls = multipleUrls.filter((_, i) => i !== index)
    setMultipleUrls(newUrls.length > 0 ? newUrls : [''])
  }

  const updateUrlInput = (index: number, value: string) => {
    const newUrls = [...multipleUrls]
    newUrls[index] = value
    setMultipleUrls(newUrls)
  }

  async function scrapeMultiple() {
    const validUrls = multipleUrls.filter(url => url.trim() !== '')
    if (validUrls.length === 0) {
      alert('Please enter at least one URL')
      return
    }

    setIsLoading(true)
    setMultipleScrapedData([])
    setSelectedScreenshots([])
    setRenderId(null)
    setVideoUrl(null)

    try {
      const response = await fetch('/api/scrape-multiple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: validUrls }),
      })

      const data = await response.json()

      if (data.success) {
        setMultipleScrapedData(data.data)
        // Auto-select all screenshots
        const allScreenshots = data.data.flatMap((asset: ScrapedAsset) => asset.screenshots)
        setSelectedScreenshots(allScreenshots)
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      alert(`Failed to scrape URLs: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  async function onSubmit(values: UrlInput) {
    setIsLoading(true)
    setScrapedData(null)
    setRenderId(null)
    setVideoUrl(null)

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      const data = await response.json()

      if (data.success) {
        setScrapedData(data.data)
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      alert(`Failed to scrape URL: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  async function generateVideo() {
    // Get screenshots from either single or multiple mode
    const screenshots = inputMode === 'single'
      ? (scrapedData?.screenshots.slice(0, 10) || [])
      : selectedScreenshots.slice(0, 10)

    if (screenshots.length === 0) {
      alert('No screenshots available. Please scrape a URL first.')
      return
    }

    setIsGenerating(true)
    setRenderId(null)
    setVideoUrl(null)

    try {
      console.log('Starting video generation...')
      console.log('Screenshots to use:', screenshots)
      
      // Build Shotstack timeline payload
      const clips = screenshots.map((img, idx) => ({
        asset: { type: 'image', src: img },
        start: idx * 3,
        length: 3,
        fit: 'cover',
        effect: 'zoomIn'
      }))

      const tracks: Array<{ clips: unknown[] }> = [{ clips }]
      const videoDuration = clips.length * 3
      
      console.log('Video duration:', videoDuration, 'seconds')
      console.log('Number of image clips:', clips.length)

      // Add voiceover track if enabled
      if (audioSettings.enableVoiceover && audioSettings.voiceoverScript.trim()) {
        console.log('Adding voiceover using Shotstack TTS...')
        console.log('Voiceover text:', audioSettings.voiceoverScript)
        console.log('Selected voice:', audioSettings.selectedVoice)
        
        // Use Shotstack's built-in text-to-speech (no external API needed!)
        tracks.push({
          clips: [{
            asset: {
              type: 'text-to-speech',
              text: audioSettings.voiceoverScript,
              voice: audioSettings.selectedVoice,
              language: 'en-US'
            },
            start: 0,
            length: videoDuration,
            volume: audioSettings.voiceoverVolume / 100
          }]
        })
      }

      // Add background music track if enabled
      if (audioSettings.enableMusic && audioSettings.selectedMusic) {
        console.log('Adding background music...')
        
        const musicUrls: Record<string, string> = {
          'upbeat-1': 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3',
          'calm-1': 'https://cdn.pixabay.com/audio/2022/03/10/audio_5c2e788c03.mp3',
          'energetic-1': 'https://cdn.pixabay.com/audio/2022/08/02/audio_2dde668d05.mp3'
        }

        // Use custom music URL if selected, otherwise use preset
        const musicUrl = audioSettings.selectedMusic === 'custom' && audioSettings.customMusicUrl
          ? audioSettings.customMusicUrl
          : musicUrls[audioSettings.selectedMusic]

        if (musicUrl) {
          console.log('Music URL:', musicUrl)
          tracks.push({
            clips: [{
              asset: {
                type: 'audio',
                src: musicUrl
              },
              start: 0,
              length: videoDuration,
              volume: audioSettings.musicVolume / 100
            }]
          })
        } else {
          console.warn('No valid music URL found')
        }
      }

      // Get theme color from appropriate source
      const themeColor = inputMode === 'single'
        ? (scrapedData?.themeColor || '#000000')
        : (multipleScrapedData[0]?.themeColor || '#000000')

      const payload = {
        timeline: {
          background: themeColor,
          tracks
        },
        output: {
          format: 'mp4',
          resolution: 'hd'
          // Note: aspectRatio is omitted for 16:9 as it's the default
        }
      }

      // Log the payload for debugging
      console.log('Sending payload to Shotstack:', JSON.stringify(payload, null, 2))

      const response = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (data.ok && data.shotstack?.response?.id) {
        const id = data.shotstack.response.id
        setRenderId(id)
        pollRenderStatus(id)
      } else {
        // Enhanced error logging to see full error details
        console.error('Full error response:', data)
        
        // Try to extract the most detailed error message
        let errorMsg = 'Unknown error'
        
        if (data.errorFromShotstack) {
          // If Shotstack returned an error object, try to extract meaningful info
          if (typeof data.errorFromShotstack === 'string') {
            errorMsg = data.errorFromShotstack
          } else if (data.errorFromShotstack.message) {
            errorMsg = data.errorFromShotstack.message
          } else if (data.errorFromShotstack.error) {
            errorMsg = data.errorFromShotstack.error
          } else {
            // If it's an object, stringify it
            errorMsg = JSON.stringify(data.errorFromShotstack)
          }
        } else if (data.error) {
          errorMsg = typeof data.error === 'string' ? data.error : data.error.message || JSON.stringify(data.error)
        }
        
        alert(`Error: ${errorMsg}`)
        setIsGenerating(false)
      }
    } catch (error) {
      alert(`Failed to generate video: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setIsGenerating(false)
    }
  }

  async function pollRenderStatus(id: string) {
    const maxAttempts = 60 // Poll for up to 5 minutes (60 attempts * 5 seconds)
    let attempts = 0

    const interval = setInterval(async () => {
      attempts++

      try {
        const response = await fetch(`/api/status/${id}`)
        const data = await response.json()

        // Check for errors first
        if (!data.ok) {
          const errorMsg = data.errorFromShotstack?.message || data.error?.message || 'Unknown error'
          alert(`Video generation failed: ${errorMsg}`)
          setIsGenerating(false)
          clearInterval(interval)
          return
        }

        // Check Shotstack response status
        const status = data.shotstack?.response?.status
        if (status === 'done') {
          const url = data.shotstack?.response?.url
          if (url) {
            setVideoUrl(url)
            setIsGenerating(false)
            clearInterval(interval)
          }
        } else if (status === 'failed') {
          const errorMsg = data.shotstack?.response?.error || 'Render failed'
          alert(`Video generation failed: ${errorMsg}`)
          setIsGenerating(false)
          clearInterval(interval)
        }

        if (attempts >= maxAttempts) {
          alert('Video generation is taking longer than expected. Please check back later.')
          setIsGenerating(false)
          clearInterval(interval)
        }
      } catch (error) {
        console.error('Status polling error:', error)
        alert(`Polling error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        setIsGenerating(false)
        clearInterval(interval)
      }
    }, 5000) // Poll every 5 seconds
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Video className="w-12 h-12 text-blue-600" />
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                PromoForge
              </h1>
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Generate stunning promotional videos for your apps in seconds
            </p>
          </div>

          {/* URL Input Form */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Enter App URL(s)</CardTitle>
              <CardDescription>
                Scrape one or multiple pages to extract content for your promo video
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Mode Toggle */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={inputMode === 'single' ? 'default' : 'outline'}
                  onClick={() => setInputMode('single')}
                  className="flex-1"
                >
                  Single URL
                </Button>
                <Button
                  type="button"
                  variant={inputMode === 'multiple' ? 'default' : 'outline'}
                  onClick={() => setInputMode('multiple')}
                  className="flex-1"
                >
                  Multiple URLs
                </Button>
              </div>

              {/* Single URL Input */}
              {inputMode === 'single' && (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>App URL</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://example.com"
                              {...field}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormDescription>
                            Enter the full URL including https://
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={isLoading} className="w-full">
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing URL...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Analyze & Extract
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              )}

              {/* Multiple URL Inputs */}
              {inputMode === 'multiple' && (
                <div className="space-y-4">
                  {multipleUrls.map((url, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder={`https://example${index + 1}.com`}
                        value={url}
                        onChange={(e) => updateUrlInput(index, e.target.value)}
                        disabled={isLoading}
                        className="flex-1"
                      />
                      {multipleUrls.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeUrlInput(index)}
                          disabled={isLoading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addUrlInput}
                      disabled={isLoading || multipleUrls.length >= 10}
                      className="flex-1"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add URL ({multipleUrls.length}/10)
                    </Button>
                    <Button
                      type="button"
                      onClick={scrapeMultiple}
                      disabled={isLoading}
                      className="flex-1"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Scraping...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Scrape All
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Scraped Data Preview - Single Mode */}
          {scrapedData && inputMode === 'single' && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Extracted Content</CardTitle>
                <CardDescription>
                  Review the content we found from your app
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Title</h3>
                  <p className="text-gray-700 dark:text-gray-300">{scrapedData.title}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-gray-700 dark:text-gray-300">{scrapedData.description}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Screenshots ({scrapedData.screenshots.length})</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {scrapedData.screenshots.map((screenshot, index) => (
                      <div key={index} className="relative aspect-video">
                        <Image
                          src={screenshot}
                          alt={`Screenshot ${index + 1}`}
                          fill
                          className="rounded-lg border shadow-sm object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Screenshot Gallery - Multiple Mode */}
          {multipleScrapedData.length > 0 && inputMode === 'multiple' && (
            <div className="mb-8">
              <ScreenshotGallery
                scrapedData={multipleScrapedData}
                onSelectionChange={setSelectedScreenshots}
              />
            </div>
          )}

          {/* Audio Controls */}
          {(scrapedData || multipleScrapedData.length > 0) && (
            <div className="mb-8">
              <AudioControls
                settings={audioSettings}
                onSettingsChange={(newSettings) =>
                  setAudioSettings({ ...audioSettings, ...newSettings })
                }
              />
            </div>
          )}

          {/* Generate Button */}
          {(scrapedData || multipleScrapedData.length > 0) && (
            <Card className="mb-8">
              <CardContent className="pt-6">
                <Button
                  onClick={generateVideo}
                  disabled={isGenerating}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Video...
                    </>
                  ) : (
                    <>
                      <Video className="mr-2 h-4 w-4" />
                      Generate Promo Video
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Render Status */}
          {renderId && !videoUrl && (
            <Card className="mb-8">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <p className="text-gray-700 dark:text-gray-300">
                    Your video is being rendered... (Render ID: {renderId})
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Video Result */}
          {videoUrl && (
            <Card>
              <CardHeader>
                <CardTitle>Your Promo Video is Ready! 🎉</CardTitle>
                <CardDescription>
                  Download your video or share it on social media
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <video
                  src={videoUrl}
                  controls
                  className="w-full rounded-lg shadow-lg"
                />
                <div className="flex gap-4">
                  <Button asChild className="flex-1">
                    <a href={videoUrl} download>
                      Download Video
                    </a>
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
