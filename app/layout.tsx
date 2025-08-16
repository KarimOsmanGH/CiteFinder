import type { Metadata } from 'next'
import './globals.css'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'CiteFinder - Extract Citations & Find Related Papers | Free Academic Tool',
  description: 'Upload any PDF and instantly extract citations while discovering related papers from arXiv, OpenAlex, CrossRef, and PubMed. Free academic research tool with no signup required.',
  keywords: [
    'citation extractor',
    'PDF citation finder',
    'academic research tool',
    'citation analysis',
    'related papers finder',
    'academic database search',
    'research paper citations',
    'free citation tool',
    'academic PDF processor',
    'citation extraction software'
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
    title: 'CiteFinder - Extract Citations & Find Related Papers',
    description: 'Upload any PDF and instantly extract citations while discovering related papers from the world\'s largest academic databases. Free, no signup required.',
    url: 'https://citefinder.app',
    siteName: 'CiteFinder',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CiteFinder - Academic Citation Extractor',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CiteFinder - Extract Citations & Find Related Papers',
    description: 'Upload any PDF and instantly extract citations while discovering related papers from the world\'s largest academic databases.',
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
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
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
              "name": "CiteFinder",
              "description": "Upload any PDF and instantly extract citations while discovering related papers from the world's largest academic databases.",
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
                "name": "CiteFinder Team"
              },
              "featureList": [
                "PDF citation extraction",
                "Academic database search",
                "Related papers discovery",
                "Free to use",
                "No registration required"
              ]
            })
          }}
        />
      </head>
      <body className="font-sans">
        {children}
        <Footer />
      </body>
    </html>
  )
} 