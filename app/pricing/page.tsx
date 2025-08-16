'use client'

import { Check, Star, Zap, Users, Database, Shield } from 'lucide-react'
import Link from 'next/link'

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-pink-400/20 to-orange-400/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative container mx-auto px-4 py-12">
        {/* Header */}
        <header className="text-center mb-16 animate-fade-in-up">
          <h1 className="text-5xl font-bold gradient-text mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            CiteFinder is committed to keeping academic research accessible to everyone. 
            Our core features are completely free, with premium options for power users.
          </p>
        </header>

        {/* Pricing Cards */}
        <section className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 mb-16">
          {/* Free Plan */}
          <div className="glass rounded-2xl shadow-soft p-8 hover-lift animate-fade-in-up">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Free</h2>
              <div className="text-4xl font-bold text-gray-900 mb-2">$0</div>
              <p className="text-gray-600">Forever free for academic research</p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center">
                <Check className="w-5 h-5 text-green-500 mr-3" />
                <span>Unlimited PDF uploads</span>
              </div>
              <div className="flex items-center">
                <Check className="w-5 h-5 text-green-500 mr-3" />
                <span>Citation extraction from all formats</span>
              </div>
              <div className="flex items-center">
                <Check className="w-5 h-5 text-green-500 mr-3" />
                <span>Search across 4 academic databases</span>
              </div>
              <div className="flex items-center">
                <Check className="w-5 h-5 text-green-500 mr-3" />
                <span>Up to 15 related papers per search</span>
              </div>
              <div className="flex items-center">
                <Check className="w-5 h-5 text-green-500 mr-3" />
                <span>No registration required</span>
              </div>
              <div className="flex items-center">
                <Check className="w-5 h-5 text-green-500 mr-3" />
                <span>Basic confidence scoring</span>
              </div>
            </div>

            <Link 
              href="/"
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover-lift shadow-glow text-center block"
            >
              Start Using Free
            </Link>
          </div>

          {/* Premium Plan */}
          <div className="glass rounded-2xl shadow-soft p-8 hover-lift animate-fade-in-up relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Coming Soon
              </span>
            </div>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Premium</h2>
              <div className="text-4xl font-bold text-gray-900 mb-2">$9.99</div>
              <p className="text-gray-600">Per month for power users</p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center">
                <Check className="w-5 h-5 text-purple-500 mr-3" />
                <span>Everything in Free plan</span>
              </div>
              <div className="flex items-center">
                <Check className="w-5 h-5 text-purple-500 mr-3" />
                <span>Unlimited related papers</span>
              </div>
              <div className="flex items-center">
                <Check className="w-5 h-5 text-purple-500 mr-3" />
                <span>Advanced citation validation</span>
              </div>
              <div className="flex items-center">
                <Check className="w-5 h-5 text-purple-500 mr-3" />
                <span>Export to BibTeX, EndNote, Mendeley</span>
              </div>
              <div className="flex items-center">
                <Check className="w-5 h-5 text-purple-500 mr-3" />
                <span>Citation network visualization</span>
              </div>
              <div className="flex items-center">
                <Check className="w-5 h-5 text-purple-500 mr-3" />
                <span>Priority API access</span>
              </div>
              <div className="flex items-center">
                <Check className="w-5 h-5 text-purple-500 mr-3" />
                <span>Email support</span>
              </div>
            </div>

            <button 
              className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover-lift shadow-glow opacity-50 cursor-not-allowed"
              disabled
            >
              Coming Soon
            </button>
          </div>
        </section>

        {/* Features Comparison */}
        <section className="glass rounded-2xl shadow-soft p-8 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Feature Comparison
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Database className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Academic Databases</h3>
              <p className="text-gray-600">
                Access to arXiv, OpenAlex, CrossRef, and PubMed with real-time search capabilities.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Privacy First</h3>
              <p className="text-gray-600">
                Your PDFs are processed locally and never stored. Complete privacy protection.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Community Driven</h3>
              <p className="text-gray-600">
                Built for researchers, by researchers. Open source and community supported.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="glass rounded-2xl shadow-soft p-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6 max-w-3xl mx-auto">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Is CiteFinder really free?
              </h3>
              <p className="text-gray-600">
                Yes! Our core features are completely free and will remain free. We believe academic research tools should be accessible to everyone.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What's the difference between Free and Premium?
              </h3>
              <p className="text-gray-600">
                Free users get unlimited access to citation extraction and basic related paper search. Premium will offer advanced features like export options and citation networks.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Do you store my PDFs?
              </h3>
              <p className="text-gray-600">
                No, we never store your PDFs. All processing happens locally and files are deleted immediately after processing.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                When will Premium be available?
              </h3>
              <p className="text-gray-600">
                We're working on Premium features and will announce their availability soon. Sign up for our newsletter to stay updated.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center mt-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of researchers using CiteFinder for their academic work.
          </p>
          <Link 
            href="/"
            className="inline-flex items-center bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 hover-lift shadow-glow"
          >
            Start Using CiteFinder Free
          </Link>
        </section>
      </div>
    </main>
  )
} 