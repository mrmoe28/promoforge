'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import type { ScrapedAsset } from '@/types'

interface ScreenshotGalleryProps {
  scrapedData: ScrapedAsset[]
  onSelectionChange: (selectedScreenshots: string[]) => void
}

export function ScreenshotGallery({ scrapedData, onSelectionChange }: ScreenshotGalleryProps) {
  const [selectedScreenshots, setSelectedScreenshots] = useState<Set<string>>(() => {
    // Auto-select all screenshots initially
    const allScreenshots = scrapedData.flatMap(asset => asset.screenshots)
    return new Set(allScreenshots)
  })

  const handleToggleScreenshot = (screenshot: string) => {
    const newSelected = new Set(selectedScreenshots)
    if (newSelected.has(screenshot)) {
      newSelected.delete(screenshot)
    } else {
      newSelected.add(screenshot)
    }
    setSelectedScreenshots(newSelected)
    onSelectionChange(Array.from(newSelected))
  }

  const handleSelectAll = () => {
    const allScreenshots = scrapedData.flatMap(asset => asset.screenshots)
    const newSelected = new Set(allScreenshots)
    setSelectedScreenshots(newSelected)
    onSelectionChange(Array.from(newSelected))
  }

  const handleDeselectAll = () => {
    setSelectedScreenshots(new Set())
    onSelectionChange([])
  }

  const totalScreenshots = scrapedData.reduce((sum, asset) => sum + asset.screenshots.length, 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Screenshot Gallery</CardTitle>
            <CardDescription>
              Select up to 10 screenshots for your video ({selectedScreenshots.size} selected)
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              disabled={selectedScreenshots.size === totalScreenshots}
            >
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeselectAll}
              disabled={selectedScreenshots.size === 0}
            >
              Deselect All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {scrapedData.map((asset, assetIndex) => (
            <div key={assetIndex} className="space-y-3">
              <div className="border-l-4 border-blue-500 pl-3">
                <h3 className="font-semibold text-lg">{asset.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{asset.description}</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {asset.screenshots.map((screenshot, screenshotIndex) => {
                  const isSelected = selectedScreenshots.has(screenshot)
                  const globalIndex = scrapedData
                    .slice(0, assetIndex)
                    .reduce((sum, a) => sum + a.screenshots.length, 0) + screenshotIndex + 1

                  return (
                    <div
                      key={screenshot}
                      className={`relative group cursor-pointer rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-blue-500 shadow-lg'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'
                      }`}
                      onClick={() => handleToggleScreenshot(screenshot)}
                    >
                      <div className="relative aspect-video">
                        <Image
                          src={screenshot}
                          alt={`Screenshot ${globalIndex}`}
                          fill
                          className="rounded-md object-cover"
                        />
                        <div className="absolute top-2 left-2 z-10">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleToggleScreenshot(screenshot)}
                            className="bg-white dark:bg-gray-800 border-2"
                          />
                        </div>
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                          #{globalIndex}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
