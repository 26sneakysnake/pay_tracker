import type { Metadata } from 'next'
import './globals.css'
import { Sidebar } from '@/components/layout/Sidebar'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'PayTrack — Suivi de bulletins de paie',
  description: 'Plateforme personnelle de suivi et analyse de bulletins de paie pour stagiaires et alternants',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="flex h-screen overflow-hidden bg-background">
          <Sidebar />
          <main className="flex-1 overflow-y-auto min-w-0">
            {children}
          </main>
        </div>
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#12121A',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#F1F5F9',
              fontFamily: 'system-ui, sans-serif',
            },
          }}
        />
      </body>
    </html>
  )
}
