'use client'

import Link from 'next/link'
import { Github, Twitter, Linkedin, Mail, Heart, ExternalLink } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-3">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <h3 className="text-xl font-bold">CiteFinder</h3>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Transform your research workflow with AI-powered citation extraction and academic paper discovery.
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://github.com/KarimOsmanGH/CiteFinder" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
              <a 
                href="https://twitter.com/citefinder" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a 
                href="https://linkedin.com/company/citefinder" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a 
                href="mailto:support@citefinder.app" 
                className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Product</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="inline-block px-3 py-1.5 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white rounded-md transition-all duration-200 text-sm">
                  Home
                </Link>
              </li>
              <li>
                <button 
                  onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                  className="inline-block px-3 py-1.5 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white rounded-md transition-all duration-200 text-sm"
                >
                  Pricing
                </button>
              </li>
              <li>
                <button 
                  onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })}
                  className="inline-block px-3 py-1.5 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white rounded-md transition-all duration-200 text-sm"
                >
                  FAQ
                </button>
              </li>
              <li>
                <a 
                  href="https://github.com/KarimOsmanGH/CiteFinder" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block px-3 py-1.5 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white rounded-md transition-all duration-200 text-sm flex items-center"
                >
                  GitHub
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Support</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/contact" className="inline-block px-3 py-1.5 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white rounded-md transition-all duration-200 text-sm">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/faq" className="inline-block px-3 py-1.5 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white rounded-md transition-all duration-200 text-sm">
                  Help Center
                </Link>
              </li>
              <li>
                <a 
                  href="mailto:support@citefinder.app" 
                  className="inline-block px-3 py-1.5 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white rounded-md transition-all duration-200 text-sm"
                >
                  Email Support
                </a>
              </li>
              <li>
                <a 
                  href="https://github.com/KarimOsmanGH/CiteFinder/issues" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block px-3 py-1.5 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white rounded-md transition-all duration-200 text-sm flex items-center"
                >
                  Report Issues
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </li>
            </ul>
          </div>

          {/* Academic Databases */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Academic Databases</h4>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://arxiv.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block px-3 py-1.5 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white rounded-md transition-all duration-200 text-sm flex items-center"
                >
                  arXiv
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </li>
              <li>
                <a 
                  href="https://openalex.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block px-3 py-1.5 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white rounded-md transition-all duration-200 text-sm flex items-center"
                >
                  OpenAlex
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </li>
              <li>
                <a 
                  href="https://crossref.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block px-3 py-1.5 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white rounded-md transition-all duration-200 text-sm flex items-center"
                >
                  CrossRef
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </li>
              <li>
                <a 
                  href="https://pubmed.ncbi.nlm.nih.gov" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block px-3 py-1.5 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white rounded-md transition-all duration-200 text-sm flex items-center"
                >
                  PubMed
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </li>
            </ul>
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
              <Link href="/privacy" className="px-3 py-1.5 bg-gray-800/30 hover:bg-gray-700/30 text-gray-400 hover:text-white transition-all duration-200 text-sm rounded-md">
                Privacy Policy
              </Link>
              <Link href="/terms" className="px-3 py-1.5 bg-gray-800/30 hover:bg-gray-700/30 text-gray-400 hover:text-white transition-all duration-200 text-sm rounded-md">
                Terms of Service
              </Link>
              <Link href="/cookies" className="px-3 py-1.5 bg-gray-800/30 hover:bg-gray-700/30 text-gray-400 hover:text-white transition-all duration-200 text-sm rounded-md">
                Cookie Policy
              </Link>
            </div>
          </div>

          {/* Made with Love */}
          <div className="text-center mt-6 pt-6 border-t border-gray-700">
            <p className="text-gray-400 text-sm flex items-center justify-center">
              Made with <Heart className="w-4 h-4 mx-1 text-red-500" /> for researchers worldwide
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
} 