'use client'

import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative border-t border-ink/10 bg-ink text-mist-soft">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brass/60 to-transparent" aria-hidden="true" />
      <div className="container mx-auto px-4 py-10 sm:py-12">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="brand-mark text-2xl text-white">CiteFinder</p>
            <p className="mt-2 text-sm text-mist-deep/80">
              © {currentYear} CiteFinder. All rights reserved.
            </p>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-sm text-mist-deep/80 transition-colors duration-200 hover:text-white">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-sm text-mist-deep/80 transition-colors duration-200 hover:text-white">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
