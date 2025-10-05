import { NextRequest, NextResponse } from 'next/server'

const SHOTSTACK_API_KEY = process.env.SHOTSTACK_API_KEY
const SHOTSTACK_API_ENV = process.env.SHOTSTACK_API_ENV || 'v1' // 'v1' (production) or 'stage'
const SHOTSTACK_HOST = process.env.SHOTSTACK_HOST || `https://api.shotstack.io/${SHOTSTACK_API_ENV}`
const SHOTSTACK_API_URL = `${SHOTSTACK_HOST}/render`

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check for API key
    if (!SHOTSTACK_API_KEY) {
      console.error('SHOTSTACK_API_KEY is not configured')
      return NextResponse.json(
        {
          ok: false,
          error: 'Server configuration error: Missing Shotstack API key'
        },
        { status: 500 }
      )
    }

    if (!id) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Render ID is required'
        },
        { status: 400 }
      )
    }

    // Call Shotstack status API
    const response = await fetch(`${SHOTSTACK_API_URL}/${id}`, {
      method: 'GET',
      headers: {
        'x-api-key': SHOTSTACK_API_KEY,
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Shotstack status check failed:', {
        id,
        status: response.status,
        data
      })

      return NextResponse.json(
        {
          ok: false,
          errorFromShotstack: data,
          error: data.message || 'Failed to check render status'
        },
        { status: response.status }
      )
    }

    const status = data.response?.status
    const url = data.response?.url

    if (status === 'done') {
      console.log('✅ Render complete:', { id, url })
    } else if (status === 'failed') {
      console.error('❌ Render failed:', { id, error: data.response?.error })
    } else {
      console.log('⏳ Render in progress:', { id, status })
    }

    return NextResponse.json({
      ok: true,
      shotstack: data
    })

  } catch (error) {
    console.error('💥 Status API error:', error)

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}
