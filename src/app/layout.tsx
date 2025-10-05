import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PromoForge - AI Video Generator',
  description: 'Create promotional videos from websites with AI-powered voiceovers',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
