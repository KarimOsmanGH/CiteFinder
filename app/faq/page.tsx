'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, HelpCircle, FileText, Search, Shield, Zap, Users } from 'lucide-react'
import Link from 'next/link'

interface FAQItem {
  question: string
  answer: string
}

interface FAQCategory {
  title: string
  icon: React.ReactNode
  items: FAQItem[]
}

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())

  const toggleItem = (itemKey: string) => {
    const newOpenItems = new Set(openItems)
    if (newOpenItems.has(itemKey)) {
      newOpenItems.delete(itemKey)
    } else {
      newOpenItems.add(itemKey)
    }
    setOpenItems(newOpenItems)
  }

  const faqCategories: FAQCategory[] = [
    {
      title: "Getting Started",
      icon: <Zap className="w-6 h-6" />,
      items: [
        {
          question: "How do I use CiteFinder?",
          answer: "Simply upload a PDF file using our drag-and-drop interface. CiteFinder will automatically extract citations from your document and search for related papers across multiple academic databases. No registration or signup required!"
        },
        {
          question: "What file formats are supported?",
          answer: "Currently, CiteFinder supports PDF files only. We recommend using text-based PDFs for best results, though we can also process scanned documents with varying success rates."
        },
        {
          question: "Is there a file size limit?",
          answer: "Yes, the maximum file size is 50MB. This should be sufficient for most academic papers and research documents. If you have larger files, consider splitting them into smaller sections."
        },
        {
          question: "Do I need to create an account?",
          answer: "No! CiteFinder is completely free to use and requires no registration or account creation. You can start using it immediately by uploading your PDF."
        },
        {
          question: "What can I do with the extracted citations?",
          answer: "You can view the extracted citations with confidence scores, search for related papers, and generate formatted reference lists in multiple citation styles (APA, MLA, Chicago, Harvard, BibTeX) using our References Generator."
        }
      ]
    },
    {
      title: "Citation Extraction",
      icon: <FileText className="w-6 h-6" />,
      items: [
        {
          question: "What citation formats does CiteFinder recognize?",
          answer: "CiteFinder recognizes multiple citation formats including APA, MLA, Chicago, Harvard, and simple author-year formats. We also detect citations with 'et al.' and various punctuation styles."
        },
        {
          question: "How accurate is the citation extraction?",
          answer: "Our citation extraction uses advanced pattern matching and confidence scoring. While we achieve high accuracy with well-formatted citations, results may vary depending on the document's formatting and citation style."
        },
        {
          question: "What does the confidence score mean?",
          answer: "The confidence score indicates how certain our system is that the extracted text is a valid citation. Higher scores (80%+) typically indicate well-formatted, standard citations, while lower scores may need manual verification."
        },
        {
          question: "Can I edit or correct extracted citations?",
          answer: "Currently, the extracted citations are read-only. However, you can copy the citation text and use it in your reference management software for further editing."
        },
        {
          question: "Can I generate a references page from the extracted citations?",
          answer: "Yes! CiteFinder includes a References Generator that can format your extracted citations into properly formatted reference lists in APA, MLA, Chicago, Harvard, or BibTeX formats. You can copy or download the formatted references."
        }
      ]
    },
    {
      title: "Related Papers Search",
      icon: <Search className="w-6 h-6" />,
      items: [
        {
          question: "Which academic databases does CiteFinder search?",
          answer: "CiteFinder searches across major academic databases including arXiv (computer science, physics, math), OpenAlex (comprehensive academic database), CrossRef (journal articles and DOIs), and PubMed (biomedical papers)."
        },
        {
          question: "How does CiteFinder find related papers?",
          answer: "We use the extracted citations to search for similar papers based on titles, authors, and keywords. Our algorithm analyzes the content and finds papers with similar themes, methodologies, or subject matter."
        },
        {
          question: "How many related papers are shown?",
          answer: "Free users can see up to 15 related papers per search. Premium users (coming soon) will have access to unlimited results and more advanced filtering options."
        },
        {
          question: "Can I filter or sort the related papers?",
          answer: "Currently, papers are sorted by relevance score. We're working on adding filtering options by year, database, and other criteria in future updates."
        }
      ]
    },
    {
      title: "Privacy & Security",
      icon: <Shield className="w-6 h-6" />,
      items: [
        {
          question: "Do you store my PDF files?",
          answer: "No, we never store your PDF files. All processing happens locally and files are deleted immediately after processing. Your documents remain completely private and secure."
        },
        {
          question: "What data do you collect?",
          answer: "We collect minimal data for service improvement, including usage statistics and error reports. We do not collect personal information or document content. See our Privacy Policy for full details."
        },
        {
          question: "Is my research data secure?",
          answer: "Yes, your research data is secure. We use industry-standard encryption for data transmission, and all processing is done in secure, isolated environments. Your documents are never shared with third parties."
        },
        {
          question: "Can I use CiteFinder for confidential research?",
          answer: "Yes, CiteFinder is safe for confidential research. Since we don't store your files and all processing is temporary, your confidential documents remain private and secure."
        }
      ]
    },
    {
      title: "Technical Support",
      icon: <HelpCircle className="w-6 h-6" />,
      items: [
        {
          question: "What browsers are supported?",
          answer: "CiteFinder works on all modern browsers including Chrome, Firefox, Safari, and Edge. We recommend using the latest version of your browser for the best experience."
        },
        {
          question: "Why isn't my PDF processing?",
          answer: "Common issues include: file size over 50MB, corrupted PDF files, or scanned documents with poor image quality. Try using a different PDF or ensure the file is not corrupted."
        },
        {
          question: "How long does processing take?",
          answer: "Processing time depends on file size and complexity. Most documents process within 30-60 seconds. Larger files or documents with many citations may take longer."
        },
        {
          question: "I'm getting an error message. What should I do?",
          answer: "First, try refreshing the page and uploading your file again. If the problem persists, check that your file is a valid PDF under 50MB. For persistent issues, please contact our support team."
        }
      ]
    },
    {
      title: "Pricing & Features",
      icon: <Users className="w-6 h-6" />,
      items: [
        {
          question: "Is CiteFinder really free?",
          answer: "Yes! Our core features are completely free and will remain free. We believe academic research tools should be accessible to everyone. Premium features will be optional add-ons."
        },
        {
          question: "What's the difference between Free and Premium?",
          answer: "Free users get unlimited PDF uploads, citation extraction, and basic related paper search. Premium (coming soon) will include unlimited results, export options, citation networks, and priority support."
        },
        {
          question: "When will Premium features be available?",
          answer: "We're actively developing Premium features and will announce their availability soon. Sign up for our newsletter or follow us on social media to stay updated."
        },
        {
          question: "Can I use CiteFinder for commercial research?",
          answer: "Yes, CiteFinder can be used for both academic and commercial research. However, please review our Terms of Service for any specific usage restrictions."
        }
      ]
    }
  ]

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
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-glow mb-6">
            <HelpCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold gradient-text mb-6">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Find answers to common questions about CiteFinder. Can't find what you're looking for? 
            <Link href="/contact" className="text-blue-600 hover:text-blue-700 font-medium ml-1">
              Contact our support team
            </Link>.
          </p>
        </header>

        {/* Quick Navigation */}
        <section className="mb-12">
          <div className="glass rounded-2xl shadow-soft p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Navigation</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {faqCategories.map((category, index) => (
                <button
                  key={index}
                  onClick={() => {
                    const element = document.getElementById(`category-${index}`)
                    element?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="text-left p-3 bg-white/50 rounded-lg hover:bg-white/70 transition-colors"
                >
                  <div className="flex items-center text-blue-600 mb-1">
                    {category.icon}
                  </div>
                  <span className="text-sm font-medium text-gray-900">{category.title}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Categories */}
        <section className="space-y-8">
          {faqCategories.map((category, categoryIndex) => (
            <div key={categoryIndex} id={`category-${categoryIndex}`} className="glass rounded-2xl shadow-soft p-8 hover-lift">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                  <div className="text-white">
                    {category.icon}
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{category.title}</h2>
              </div>

              <div className="space-y-4">
                {category.items.map((item, itemIndex) => {
                  const itemKey = `${categoryIndex}-${itemIndex}`
                  const isOpen = openItems.has(itemKey)

                  return (
                    <div key={itemIndex} className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleItem(itemKey)}
                        className="w-full px-6 py-4 text-left bg-white/50 hover:bg-white/70 transition-colors flex items-center justify-between"
                      >
                        <span className="font-semibold text-gray-900 pr-4">{item.question}</span>
                        <div className="text-gray-500">
                          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                      </button>
                      
                      {isOpen && (
                        <div className="px-6 py-4 bg-white/30 border-t border-gray-200">
                          <p className="text-gray-700 leading-relaxed">{item.answer}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </section>

        {/* Still Need Help Section */}
        <section className="mt-16 text-center">
          <div className="glass rounded-2xl shadow-soft p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Still Need Help?
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Can't find the answer you're looking for? Our support team is here to help with any questions or issues you might have.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/contact"
                className="inline-flex items-center bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover-lift shadow-glow"
              >
                Contact Support
              </Link>
              
              <Link 
                href="/"
                className="inline-flex items-center bg-white/50 hover:bg-white/70 text-gray-900 font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover-lift border border-gray-200"
              >
                Try CiteFinder
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
} 