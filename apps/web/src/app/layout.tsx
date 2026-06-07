import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Metabolic Health',
  description: 'Clinical weight-loss and metabolic health platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  )
}
