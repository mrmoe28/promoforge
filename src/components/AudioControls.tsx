'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Music, Mic } from 'lucide-react'

export interface AudioSettings {
  enableVoiceover: boolean
  voiceoverScript: string
  selectedVoice: string
  voiceoverVolume: number
  enableMusic: boolean
  selectedMusic: string
  musicVolume: number
  customMusicUrl?: string
  customMusicName?: string
  ttsProvider?: 'shotstack' | 'elevenlabs' // TTS provider selection
}

interface AudioControlsProps {
  settings: AudioSettings
  onSettingsChange: (settings: Partial<AudioSettings>) => void
}

export function AudioControls({ settings, onSettingsChange }: AudioControlsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="w-5 h-5" />
          Audio Settings
        </CardTitle>
        <CardDescription>
          Add voiceover and background music to your video
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Voiceover Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="voiceover-toggle" className="text-base font-semibold">
              Voiceover
            </Label>
            <Switch
              id="voiceover-toggle"
              checked={settings.enableVoiceover}
              onCheckedChange={(checked) => onSettingsChange({ enableVoiceover: checked })}
            />
          </div>

          {settings.enableVoiceover && (
            <div className="space-y-4 pl-4 border-l-2 border-blue-500">
              <div>
                <Label htmlFor="voiceover-script">Script</Label>
                <Textarea
                  id="voiceover-script"
                  placeholder="Enter your voiceover script here..."
                  value={settings.voiceoverScript}
                  onChange={(e) => onSettingsChange({ voiceoverScript: e.target.value })}
                  className="mt-2 min-h-[100px]"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {settings.voiceoverScript.length}/
                  {settings.ttsProvider === 'elevenlabs' ? '5000' : '3000'} characters
                </p>
              </div>

              <div>
                <Label htmlFor="tts-provider">TTS Provider</Label>
                <Select
                  value={settings.ttsProvider || 'elevenlabs'}
                  onValueChange={(value: 'shotstack' | 'elevenlabs') =>
                    onSettingsChange({ ttsProvider: value })
                  }
                >
                  <SelectTrigger id="tts-provider" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="elevenlabs">ElevenLabs (High Quality)</SelectItem>
                    <SelectItem value="shotstack">Shotstack (AWS Polly)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="voice-select">Voice</Label>
                <Select
                  value={settings.selectedVoice}
                  onValueChange={(value) => onSettingsChange({ selectedVoice: value })}
                >
                  <SelectTrigger id="voice-select" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {settings.ttsProvider === 'elevenlabs' ? (
                      <>
                        <SelectItem value="21m00Tcm4TlvDq8ikWAM">Rachel (Female, US) - Calm & Professional</SelectItem>
                        <SelectItem value="AZnzlk1XvdvUeBnXmlld">Domi (Female, US) - Strong & Confident</SelectItem>
                        <SelectItem value="EXAVITQu4vr4xnSDxMaL">Bella (Female, US) - Soft & Soothing</SelectItem>
                        <SelectItem value="ErXwobaYiN019PkySvjV">Antoni (Male, US) - Warm & Friendly</SelectItem>
                        <SelectItem value="MF3mGyEYCl7XYWbV9V6O">Elli (Female, US) - Energetic & Young</SelectItem>
                        <SelectItem value="TxGEqnHWrfWFTfGW9XjX">Josh (Male, US) - Deep & Authoritative</SelectItem>
                        <SelectItem value="VR6AewLTigWG4xSOukaG">Arnold (Male, US) - Crisp & Professional</SelectItem>
                        <SelectItem value="pNInz6obpgDQGcFmaJgB">Adam (Male, US) - Deep & Engaging</SelectItem>
                        <SelectItem value="yoZ06aMxZJJ28mfd3POQ">Sam (Male, US) - Dynamic & Raspy</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="Joanna">Joanna (Female, US)</SelectItem>
                        <SelectItem value="Matthew">Matthew (Male, US)</SelectItem>
                        <SelectItem value="Kendra">Kendra (Female, US)</SelectItem>
                        <SelectItem value="Joey">Joey (Male, US)</SelectItem>
                        <SelectItem value="Ivy">Ivy (Female, US)</SelectItem>
                        <SelectItem value="Justin">Justin (Male, US)</SelectItem>
                        <SelectItem value="Kimberly">Kimberly (Female, US)</SelectItem>
                        <SelectItem value="Salli">Salli (Female, US)</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="voiceover-volume">Volume: {settings.voiceoverVolume}%</Label>
                <Slider
                  id="voiceover-volume"
                  min={0}
                  max={100}
                  step={5}
                  value={[settings.voiceoverVolume]}
                  onValueChange={(value) => onSettingsChange({ voiceoverVolume: value[0] })}
                  className="mt-2"
                />
              </div>
            </div>
          )}
        </div>

        {/* Music Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="music-toggle" className="text-base font-semibold flex items-center gap-2">
              <Music className="w-4 h-4" />
              Background Music
            </Label>
            <Switch
              id="music-toggle"
              checked={settings.enableMusic}
              onCheckedChange={(checked) => onSettingsChange({ enableMusic: checked })}
            />
          </div>

          {settings.enableMusic && (
            <div className="space-y-4 pl-4 border-l-2 border-purple-500">
              <div>
                <Label htmlFor="music-select">Music Track</Label>
                <Select
                  value={settings.selectedMusic}
                  onValueChange={(value) => onSettingsChange({ selectedMusic: value })}
                >
                  <SelectTrigger id="music-select" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upbeat-1">Upbeat Energy</SelectItem>
                    <SelectItem value="calm-1">Calm & Peaceful</SelectItem>
                    <SelectItem value="energetic-1">High Energy</SelectItem>
                    <SelectItem value="custom">Custom URL</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {settings.selectedMusic === 'custom' && (
                <div>
                  <Label htmlFor="custom-music-url">Custom Music URL</Label>
                  <Input
                    id="custom-music-url"
                    type="url"
                    placeholder="https://example.com/music.mp3"
                    value={settings.customMusicUrl || ''}
                    onChange={(e) => onSettingsChange({ customMusicUrl: e.target.value })}
                    className="mt-2"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="music-volume">Volume: {settings.musicVolume}%</Label>
                <Slider
                  id="music-volume"
                  min={0}
                  max={100}
                  step={5}
                  value={[settings.musicVolume]}
                  onValueChange={(value) => onSettingsChange({ musicVolume: value[0] })}
                  className="mt-2"
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
