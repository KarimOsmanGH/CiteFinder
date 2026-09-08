import type { Metadata } from 'next'
import { Fraunces, Outfit } from 'next/font/google'
import './globals.css'
import Footer from '@/components/Footer'
import { Providers } from './providers'

const display = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['500', '600', '700'],
})

const sans = Outfit({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://citefinder.app'

export const metadata: Metadata = {
  title: 'CiteFinder | Academic Source Finder',
  description: "Automatically extract statements from your paper, find sources from the world's largest academic databases, and generate citations.",
  keywords: [
    'academic source finder',
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
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'CiteFinder | Academic Source Finder',
    description: "Automatically extract statements from your paper, find sources from the world's largest academic databases, and generate citations.",
    url: '/',
    siteName: 'CiteFinder',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CiteFinder - Statements, Sources, Citations',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CiteFinder | Academic Source Finder',
    description: "Automatically extract statements from your paper, find sources from the world's largest academic databases, and generate citations.",
    images: ['/og-image.png'],
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
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' }
    ],
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#0B2420" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "CiteFinder",
              "description": "Automatically extract statements from your paper, find sources from the world's largest academic databases, and generate citations.",
              "url": siteUrl,
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
      <body className="font-sans antialiased">
        <Providers>
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
