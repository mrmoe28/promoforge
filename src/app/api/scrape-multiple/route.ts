import { NextRequest, NextResponse } from 'next/server'
import type { ScrapedAsset } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { urls } = body

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'URLs array is required'
        },
        { status: 400 }
      )
    }

    if (urls.length > 10) {
      return NextResponse.json(
        {
          success: false,
          error: 'Maximum 10 URLs allowed'
        },
        { status: 400 }
      )
    }

    console.log(`🔍 Scraping ${urls.length} URLs...`)

    // Scrape all URLs in parallel
    const scrapePromises = urls.map(async (url: string) => {
      try {
        // Validate URL
        new URL(url)

        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; PromoForge/1.0; +https://promoforge.app)'
          }
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`)
        }

        const html = await response.text()

        // Extract metadata
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
          while ((match = imgRegex.exec(html)) !== null && screenshots.length < 5) {
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

          // If still no screenshots, try to find any images
          if (screenshots.length === 0) {
            const anyImgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi
            let anyMatch
            while ((anyMatch = anyImgRegex.exec(html)) !== null && screenshots.length < 3) {
              const imgSrc = anyMatch[1]
              if (imgSrc) {
                screenshots.push(makeAbsoluteUrl(imgSrc, url))
              }
            }
          }

          // Add placeholder if no screenshots found
          if (screenshots.length === 0) {
            screenshots.push(`https://via.placeholder.com/800x600/4F46E5/FFFFFF?text=App+Screenshot`)
          }

          return screenshots.slice(0, 5) // Limit to 5 screenshots per URL
        }

        const extractThemeColor = (): string => {
          const themeColor = extractMeta('theme-color')
          if (themeColor && /^#[0-9A-F]{6}$/i.test(themeColor)) {
            return themeColor
          }
          return '#000000'
        }

        const scrapedData: ScrapedAsset = {
          title: extractTitle(),
          description: extractDescription(),
          screenshots: extractScreenshots(),
          themeColor: extractThemeColor(),
          url
        }

        console.log(`✅ Scraped: ${scrapedData.title} (${scrapedData.screenshots.length} screenshots)`)

        return scrapedData

      } catch (error) {
        console.error(`❌ Failed to scrape ${url}:`, error)
        // Return a placeholder for failed URLs
        return {
          title: 'Failed to scrape',
          description: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          screenshots: [],
          themeColor: '#000000',
          url
        } as ScrapedAsset
      }
    })

    const results = await Promise.all(scrapePromises)

    // Filter out failed results with no screenshots
    const successfulResults = results.filter(result => result.screenshots.length > 0)

    if (successfulResults.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to scrape any URLs successfully'
        },
        { status: 400 }
      )
    }

    console.log(`✅ Successfully scraped ${successfulResults.length}/${urls.length} URLs`)

    return NextResponse.json({
      success: true,
      data: successfulResults
    })

  } catch (error) {
    console.error('💥 Scrape multiple error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to scrape URLs'
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
