import { NextRequest, NextResponse } from 'next/server'
import type { ScrapedAsset } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url } = body

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'URL is required'
        },
        { status: 400 }
      )
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid URL format'
        },
        { status: 400 }
      )
    }

    console.log('🔍 Scraping URL:', url)

    // Fetch the webpage
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PromoForge/1.0; +https://promoforge.app)'
      }
    })

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to fetch URL: ${response.status} ${response.statusText}`
        },
        { status: response.status }
      )
    }

    const html = await response.text()

    // Extract metadata using regex and basic parsing
    const extractMeta = (property: string): string => {
      const regex = new RegExp(`<meta[^>]*(?:property|name)="${property}"[^>]*content="([^"]*)"`, 'i')
      const match = html.match(regex)
      return match?.[1] || ''
    }

    const extractTitle = (): string => {
      const ogTitle = extractMeta('og:title')
      if (ogTitle) return ogTitle

      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
      return titleMatch?.[1] || 'Untitled'
    }

    const extractDescription = (): string => {
      const ogDescription = extractMeta('og:description')
      if (ogDescription) return ogDescription

      const description = extractMeta('description')
      return description || 'No description available'
    }

    const extractScreenshots = (): string[] => {
      const screenshots: string[] = []

      // Extract og:image first (usually the best quality)
      const ogImage = extractMeta('og:image')
      if (ogImage) {
        screenshots.push(makeAbsoluteUrl(ogImage, url))
      }

      // Extract twitter:image as backup
      const twitterImage = extractMeta('twitter:image')
      if (twitterImage && !screenshots.includes(twitterImage)) {
        screenshots.push(makeAbsoluteUrl(twitterImage, url))
      }

      // Extract images from img tags with better filtering
      const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi
      let match
      while ((match = imgRegex.exec(html)) !== null && screenshots.length < 10) {
        const imgSrc = match[1]
        
        // Skip common unwanted images
        if (imgSrc && 
            !imgSrc.includes('favicon') && 
            !imgSrc.includes('icon') && 
            !imgSrc.includes('logo.svg') &&
            !imgSrc.includes('pixel') &&
            !imgSrc.includes('tracking') &&
            !imgSrc.endsWith('.svg') &&
            imgSrc.length > 10) {
          
          const absoluteUrl = makeAbsoluteUrl(imgSrc, url)
          if (!screenshots.includes(absoluteUrl)) {
            screenshots.push(absoluteUrl)
          }
        }
      }

      // If still no screenshots, try to find any images in the content
      if (screenshots.length === 0) {
        const anyImgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi
        let anyMatch
        while ((anyMatch = anyImgRegex.exec(html)) !== null && screenshots.length < 5) {
          const imgSrc = anyMatch[1]
          if (imgSrc) {
            screenshots.push(makeAbsoluteUrl(imgSrc, url))
          }
        }
      }

      // Add placeholder screenshots if none found
      if (screenshots.length === 0) {
        // Generate placeholder screenshots using a service
        const placeholders = [
          `https://via.placeholder.com/800x600/4F46E5/FFFFFF?text=Screenshot+1`,
          `https://via.placeholder.com/800x600/7C3AED/FFFFFF?text=Screenshot+2`,
          `https://via.placeholder.com/800x600/DC2626/FFFFFF?text=Screenshot+3`
        ]
        screenshots.push(...placeholders)
      }

      return screenshots.slice(0, 10)
    }

    const extractThemeColor = (): string => {
      const themeColor = extractMeta('theme-color')
      if (themeColor && /^#[0-9A-F]{6}$/i.test(themeColor)) {
        return themeColor
      }
      return '#000000' // Default black
    }

    const scrapedData: ScrapedAsset = {
      title: extractTitle(),
      description: extractDescription(),
      screenshots: extractScreenshots(),
      themeColor: extractThemeColor(),
      url
    }

    console.log('✅ Scraped successfully:', {
      title: scrapedData.title,
      screenshotCount: scrapedData.screenshots.length
    })

    return NextResponse.json({
      success: true,
      data: scrapedData
    })

  } catch (error) {
    console.error('💥 Scrape error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to scrape URL'
      },
      { status: 500 }
    )
  }
}

// Helper function to convert relative URLs to absolute
function makeAbsoluteUrl(urlString: string, baseUrl: string): string {
  try {
    if (urlString.startsWith('http://') || urlString.startsWith('https://')) {
      return urlString
    }

    const base = new URL(baseUrl)

    if (urlString.startsWith('//')) {
      return `${base.protocol}${urlString}`
    }

    if (urlString.startsWith('/')) {
      return `${base.protocol}//${base.host}${urlString}`
    }

    return new URL(urlString, baseUrl).href
  } catch {
    return urlString
  }
}
