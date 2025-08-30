'use client'

import Link from 'next/link'
import { FileText } from 'lucide-react'



export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="flex justify-center mb-8">
          {/* Company Info */}
          <div className="space-y-4 text-center">
            <div className="flex items-center justify-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-3">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold">CiteFinder</h3>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Extract statements, find sources, generate citations.
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 pt-8">
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
      </div>
    </footer>
  )
} 