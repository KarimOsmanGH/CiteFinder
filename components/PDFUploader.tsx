'use client'

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText } from 'lucide-react'

interface PDFUploaderProps {
  onFileUpload: (file: File) => void
}

export default function PDFUploader({ onFileUpload }: PDFUploaderProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      if (file.type === 'application/pdf') {
        onFileUpload(file)
      } else {
        alert('Please upload a PDF file')
      }
    }
  }, [onFileUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false
  })

  return (
    <section className="w-full" aria-label="PDF Upload Interface">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all duration-300 hover-lift ${
          isDragActive
            ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 shadow-glow'
            : 'border-gray-300 hover:border-blue-400 hover:bg-gradient-to-br from-gray-50 to-blue-50'
        }`}
        role="button"
        tabIndex={0}
        aria-label={isDragActive ? 'Drop your PDF here' : 'Upload your PDF'}
      >
        <input {...getInputProps()} aria-label="PDF file input" />
        
        <div className="flex flex-col items-center">
          <div className="mb-6">
            {isDragActive ? (
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-glow" aria-hidden="true">
                <Upload className="w-10 h-10 text-white" />
              </div>
            ) : (
              <div className="w-20 h-20 bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl flex items-center justify-center" aria-hidden="true">
                <FileText className="w-10 h-10 text-white" />
              </div>
            )}
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            {isDragActive ? 'Drop your PDF here' : 'Upload your PDF'}
          </h3>
          
          <p className="text-lg text-gray-600 mb-6 max-w-md">
            Drag and drop your PDF file here, or click to browse and select your research paper
          </p>
          
          <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 w-full max-w-lg border border-white/20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm" role="list" aria-label="Upload features">
              <div className="text-center" role="listitem">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2" aria-hidden="true">
                  <span className="text-blue-600 font-semibold">📄</span>
                </div>
                <p className="font-medium text-gray-900">PDF Format</p>
                <p className="text-gray-600">Only</p>
              </div>
              <div className="text-center" role="listitem">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2" aria-hidden="true">
                  <span className="text-green-600 font-semibold">💾</span>
                </div>
                <p className="font-medium text-gray-900">50MB Max</p>
                <p className="text-gray-600">File Size</p>
              </div>
              <div className="text-center" role="listitem">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2" aria-hidden="true">
                  <span className="text-purple-600 font-semibold">⚡</span>
                </div>
                <p className="font-medium text-gray-900">Instant</p>
                <p className="text-gray-600">Processing</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 