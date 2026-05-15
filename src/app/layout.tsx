import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Snake Game',
  description: 'Classic Snake Game built with Next.js and Canvas HTML5'
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
