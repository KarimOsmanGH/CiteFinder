'use client'

import Link from 'next/link'



export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">


        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Copyright */}
                      <div className="flex items-center space-x-2">
              <span className="text-gray-400">
                © {currentYear} CiteFinder. All rights reserved.
              </span>
            </div>

          {/* Legal Links */}
          <div className="flex items-center space-x-4">
            <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
} 