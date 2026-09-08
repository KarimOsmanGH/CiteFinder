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
        className={`cursor-pointer rounded-2xl border border-dashed p-8 text-center transition-all duration-300 sm:p-10 ${
          isDragActive
            ? 'border-teal bg-teal/5'
            : 'border-ink/20 hover:border-teal/50 hover:bg-mist-soft/60'
        }`}
        role="button"
        tabIndex={0}
        aria-label={isDragActive ? 'Drop your PDF here' : 'Upload your PDF'}
      >
        <input {...getInputProps()} aria-label="PDF file input" />
        
        <div className="flex flex-col items-center">
          <div className="mb-5" aria-hidden="true">
            {isDragActive ? (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal text-white">
                <Upload className="h-7 w-7" />
              </div>
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink text-white">
                <FileText className="h-7 w-7" />
              </div>
            )}
          </div>
          
          <h3 className="mb-2 font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            {isDragActive ? 'Drop your PDF here' : 'Upload your PDF'}
          </h3>
          
          <p className="max-w-md text-sm leading-relaxed text-ink-muted sm:text-base">
            Drag and drop a research paper (max 50MB), or click to browse.
          </p>
        </div>
      </div>
    </section>
  )
}
