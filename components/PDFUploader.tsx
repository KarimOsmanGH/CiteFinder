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
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 hover-lift ${
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
          <div className="mb-4">
            {isDragActive ? (
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-glow" aria-hidden="true">
                <Upload className="w-8 h-8 text-white" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-500 rounded-xl flex items-center justify-center" aria-hidden="true">
                <FileText className="w-8 h-8 text-white" />
              </div>
            )}
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {isDragActive ? 'Drop your PDF here' : 'Upload your PDF'}
          </h3>
          
          <p className="text-base text-gray-600 mb-4 max-w-md">
            Drag and drop your PDF file (max 50MB) here, or click to browse and select your research paper
          </p>
          
          {/* Removed informational box (PDF Format / 50MB Max / Instant Processing) as requested */}
          
        </div>
      </div>
    </section>
  )
} 