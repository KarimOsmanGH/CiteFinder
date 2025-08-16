'use client'

import { ExternalLink, Star, Search } from 'lucide-react'

interface RelatedPaper {
  id: string
  title: string
  authors: string[]
  year: string
  abstract: string
  url: string
  similarity: number
}

interface RelatedPapersProps {
  papers: RelatedPaper[]
}

export default function RelatedPapers({ papers }: RelatedPapersProps) {
  if (papers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Search className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Related Papers Found</h3>
        <p className="text-gray-600">No related papers were found in the academic databases</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {papers.map((paper, index) => {
        console.log(`Rendering paper: ${paper.title}, URL: ${paper.url}`);
        return (
        <div
          key={paper.id}
          className="bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl p-6 hover-lift transition-all duration-300 animate-slide-in-right"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-3 leading-tight">
                {paper.title}
              </h3>
              <div className="flex items-center text-sm text-gray-600 mb-3">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  <span className="font-medium">{paper.authors.join(', ')}</span>
                </div>
                <span className="mx-2">•</span>
                <span className="font-semibold">{paper.year}</span>
              </div>
            </div>
            <div className="flex items-center ml-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                paper.similarity >= 80 ? 'bg-gradient-to-br from-green-400 to-green-600' :
                paper.similarity >= 60 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                'bg-gradient-to-br from-red-400 to-red-600'
              }`}>
                <Star className="w-5 h-5 text-white" />
              </div>
              <div className="ml-3 text-right">
                <span className={`text-lg font-bold ${
                  paper.similarity >= 80 ? 'text-green-700' :
                  paper.similarity >= 60 ? 'text-orange-700' :
                  'text-red-700'
                }`}>
                  {Math.round(paper.similarity)}%
                </span>
                <p className="text-xs text-gray-500">match</p>
              </div>
            </div>
          </div>
          
          <p className="text-gray-700 mb-6 leading-relaxed line-clamp-3">
            {paper.abstract}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  paper.similarity >= 80 ? 'bg-green-500' :
                  paper.similarity >= 60 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}></div>
                <span className={`text-sm font-medium ${
                  paper.similarity >= 80 ? 'text-green-700' :
                  paper.similarity >= 60 ? 'text-orange-700' :
                  'text-red-700'
                }`}>
                  Similarity: {Math.round(paper.similarity)}%
                </span>
              </div>
              <div className="w-px h-4 bg-gray-300"></div>
              <span className="text-sm text-gray-500">
                {paper.id.startsWith('arxiv') ? 'arXiv' : 
                 paper.id.startsWith('openalex') ? 'OpenAlex' :
                 paper.id.startsWith('crossref') ? 'CrossRef' :
                 paper.id.startsWith('pubmed') ? 'PubMed' : 'Academic DB'}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Primary link */}
              {paper.url && paper.url !== '#' && (
                <a
                  href={paper.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 hover-lift"
                  title={`Open: ${paper.url}`}
                >
                  {paper.url.includes('doi.org') ? 'DOI Link' :
                   paper.url.includes('arxiv.org') ? 'arXiv Abstract' :
                   paper.url.includes('pubmed') ? 'PubMed' :
                   'View Paper'}
                  <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              )}
              
              {/* Additional source links based on paper type */}
              {paper.url && paper.url !== '#' && paper.url.includes('doi.org') && (
                <>
                  <a
                    href={paper.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center bg-green-100 text-green-700 font-medium px-3 py-2 rounded-lg hover:bg-green-200 transition-all duration-300 text-sm"
                    title="Open DOI Link"
                  >
                    DOI
                  </a>
                  <a
                    href={paper.url.replace('https://doi.org/', 'https://scholar.google.com/scholar?q=')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center bg-gray-100 text-gray-700 font-medium px-3 py-2 rounded-lg hover:bg-gray-200 transition-all duration-300 text-sm"
                    title="Search on Google Scholar"
                  >
                    Scholar
                  </a>
                </>
              )}
              
              {paper.url && paper.url !== '#' && paper.url.includes('arxiv.org') && (
                <a
                  href={paper.url.replace('/abs/', '/pdf/')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center bg-gray-100 text-gray-700 font-medium px-3 py-2 rounded-lg hover:bg-gray-200 transition-all duration-300 text-sm"
                  title="Download PDF"
                >
                  PDF
                </a>
              )}
            </div>
          </div>
        </div>
      )})}
    </div>
  )
} 