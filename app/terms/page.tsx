'use client'

import Link from 'next/link'
import { ArrowLeft, Scale, FileText, AlertTriangle, Shield } from 'lucide-react'

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-blue-100">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-pink-400/20 to-orange-400/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative container mx-auto px-4 py-12">
        {/* Back Button */}
        <div className="mb-8">
          <Link 
            href="/"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>

        {/* Header */}
        <header className="text-center mb-16 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-glow mb-6" role="img" aria-label="Terms of Service">
            <Scale className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold gradient-text mb-6">
            Terms of Service
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Please read these terms carefully before using CiteFinder. By using our service, you agree to these terms.
          </p>
          <div className="text-sm text-gray-500 mt-4">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </header>

        {/* Content */}
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Acceptance of Terms */}
          <section className="glass rounded-2xl shadow-soft p-8 hover-lift">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Acceptance of Terms</h2>
            </div>
            
            <p className="text-gray-700 leading-relaxed">
              By accessing and using CiteFinder ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          {/* Description of Service */}
          <section className="glass rounded-2xl shadow-soft p-8 hover-lift">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Description of Service</h2>
            
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                CiteFinder is an academic research tool that provides the following services:
              </p>
              
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-gray-700">Automatic citation extraction from PDF documents</p>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-gray-700">Discovery of related academic papers from multiple databases</p>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-gray-700">Generation of formatted reference lists in various citation styles</p>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-gray-700">Secure storage and processing of uploaded documents</p>
                </div>
              </div>
            </div>
          </section>

          {/* User Responsibilities */}
          <section className="glass rounded-2xl shadow-soft p-8 hover-lift">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">User Responsibilities</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Acceptable Use</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree not to:
                </p>
                <div className="space-y-2">
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <p className="text-gray-700">Upload files that contain malicious code, viruses, or other harmful content</p>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <p className="text-gray-700">Use the Service to violate any applicable laws or regulations</p>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <p className="text-gray-700">Attempt to gain unauthorized access to our systems or other users' data</p>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <p className="text-gray-700">Use the Service for commercial purposes without proper licensing</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Content Ownership</h3>
                <p className="text-gray-700 leading-relaxed">
                  You retain ownership of any content you upload to the Service. By uploading content, you grant us a limited license to process and store your content solely for the purpose of providing the Service to you.
                </p>
              </div>
            </div>
          </section>

          {/* Intellectual Property */}
          <section className="glass rounded-2xl shadow-soft p-8 hover-lift">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Intellectual Property</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Our Rights</h3>
                <p className="text-gray-700 leading-relaxed">
                  CiteFinder and its original content, features, and functionality are owned by CiteFinder and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Third-Party Content</h3>
                <p className="text-gray-700 leading-relaxed">
                  The Service may display content from third-party academic databases and sources. This content is subject to the respective terms and conditions of those sources. We do not claim ownership of third-party content.
                </p>
              </div>
            </div>
          </section>

          {/* Privacy and Data Protection */}
          <section className="glass rounded-2xl shadow-soft p-8 hover-lift">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center mr-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Privacy and Data Protection</h2>
            </div>
            
            <p className="text-gray-700 leading-relaxed">
              Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference. By using the Service, you consent to the collection and use of information as detailed in our Privacy Policy.
            </p>
          </section>

          {/* Disclaimers */}
          <section className="glass rounded-2xl shadow-soft p-8 hover-lift">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center mr-4">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Disclaimers</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Service Availability</h3>
                <p className="text-gray-700 leading-relaxed">
                  We strive to maintain high availability of the Service, but we do not guarantee uninterrupted access. The Service may be temporarily unavailable due to maintenance, updates, or technical issues.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Accuracy of Results</h3>
                <p className="text-gray-700 leading-relaxed">
                  While we work to provide accurate citation extraction and paper discovery, we cannot guarantee the accuracy, completeness, or reliability of the results. Users should verify all extracted citations and related papers independently.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Third-Party Services</h3>
                <p className="text-gray-700 leading-relaxed">
                  Our Service relies on third-party academic databases and APIs. We are not responsible for the availability, accuracy, or content of these external services.
                </p>
              </div>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section className="glass rounded-2xl shadow-soft p-8 hover-lift">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Limitation of Liability</h2>
            
            <p className="text-gray-700 leading-relaxed">
              To the maximum extent permitted by law, CiteFinder shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the Service.
            </p>
          </section>

          {/* Termination */}
          <section className="glass rounded-2xl shadow-soft p-8 hover-lift">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Termination</h2>
            
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                We may terminate or suspend your access to the Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Upon termination, your right to use the Service will cease immediately. If you wish to terminate your account, you may simply discontinue using the Service.
              </p>
            </div>
          </section>

          {/* Changes to Terms */}
          <section className="glass rounded-2xl shadow-soft p-8 hover-lift">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Changes to Terms</h2>
            
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
            </p>
          </section>

          {/* Governing Law */}
          <section className="glass rounded-2xl shadow-soft p-8 hover-lift">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Governing Law</h2>
            
            <p className="text-gray-700 leading-relaxed">
              These Terms shall be interpreted and governed by the laws of the jurisdiction where CiteFinder is incorporated, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
            </p>
          </section>


        </div>
      </div>
    </main>
  )
} 