import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Content Calendar | Web3 • AI • Thought Leadership',
  description: 'Team content calendar for X, LinkedIn, and Paragraph',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
        {children}
      </body>
    </html>
  )
}
