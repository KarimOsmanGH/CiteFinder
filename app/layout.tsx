import type { Metadata } from 'next'
import './globals.css'
import Footer from '@/components/Footer'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Academic Source Finder | AI for Statements, Sources, and Citations',
  description: "Automatically extract statements from your paper, find sources from the world's largest academic databases, and generate citations.",
  keywords: [
    'academic source finder',
    'AI citation tool',
    'statement extraction',
    'research paper sources',
    'academic reference generator',
    'citation finder',
    'academic database search',
    'research paper citations',
    'academic PDF processor',
    'academic writing support',
    'source discovery',
    'evidence finder'
  ],
  authors: [{ name: 'CiteFinder Team' }],
  creator: 'CiteFinder',
  publisher: 'CiteFinder',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://citefinder.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Academic Source Finder',
    description: "Automatically extract statements from your paper, find sources from the world's largest academic databases, and generate citations.",
    url: 'https://citefinder.app',
    siteName: 'Academic Source Finder',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Academic Source Finder - Statements, Sources, Citations',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Academic Source Finder',
    description: "Automatically extract statements from your paper, find sources from the world's largest academic databases, and generate citations.",
    images: ['/twitter-image.png'],
    creator: '@citefinder',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' }
    ],
    apple: '/apple-touch-icon.png',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#667eea" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Academic Source Finder",
              "description": "Automatically extract statements from your paper, find sources from the world's largest academic databases, and generate citations.",
              "url": "https://citefinder.app",
              "applicationCategory": "EducationalApplication",
              "operatingSystem": "Web Browser",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "author": {
                "@type": "Organization",
                "name": "CiteFinder"
              }
            })
          }}
        />
      </head>
      <body className="antialiased">
        <Providers>
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  )
} 