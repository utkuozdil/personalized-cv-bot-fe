import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { DocumentArrowUpIcon } from '@heroicons/react/24/outline'

function PDFUpload({ onFileSelect }) {
  const [error, setError] = useState(null)
  const [isDragging, setIsDragging] = useState(false)

  const onDrop = useCallback((acceptedFiles) => {
    setError(null)
    const file = acceptedFiles[0]
    
    if (!file) {
      setError('Please select a file')
      return
    }

    if (file.type !== 'application/pdf') {
      setError('Only PDF files are accepted')
      return
    }

    onFileSelect(file)
  }, [onFileSelect])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    onDropAccepted: () => setIsDragging(false),
    onDropRejected: () => {
      setError('Only PDF files are accepted')
      setIsDragging(false)
    }
  })

  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={`
          relative overflow-hidden rounded-3xl border-2 border-dashed transition-all duration-300 ease-in-out
          ${isDragActive || isDragging
            ? 'border-blue-500 bg-blue-50 scale-[1.02] shadow-lg'
            : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50/80 hover:shadow-lg'
          }
        `}
      >
        <input {...getInputProps()} />
        
        {/* Upload Area Content */}
        <div className="px-8 py-12 text-center relative z-10">
          {/* Icon Container */}
          <div className="mb-6">
            <div className={`
              inline-flex items-center justify-center w-20 h-20 rounded-2xl
              transition-all duration-300
              ${isDragActive || isDragging
                ? 'bg-blue-100 scale-110'
                : 'bg-gray-50 group-hover:bg-gray-100'
              }
            `}>
              <DocumentArrowUpIcon 
                className={`h-10 w-10 transition-all duration-300 ${
                  isDragActive || isDragging ? 'text-blue-600' : 'text-gray-400'
                }`}
              />
            </div>
          </div>
          
          {/* Text Content */}
          <div className="space-y-3">
            <h3 className={`text-xl font-semibold transition-colors duration-300 ${
              isDragActive || isDragging ? 'text-blue-700' : 'text-gray-700'
            }`}>
              {isDragActive || isDragging
                ? 'Drop your PDF here'
                : 'Upload your CV'}
            </h3>
            
            <p className="text-base text-gray-500">
              Drag and drop your PDF here, or{' '}
              <span className="text-blue-500 hover:text-blue-600 cursor-pointer font-medium">
                browse to upload
              </span>
            </p>
            
            <p className="text-sm text-gray-400">
              Maximum file size: 10MB
            </p>
          </div>
        </div>

        {/* Decorative Background */}
        <div className="absolute inset-0 -z-10 opacity-[0.02] pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <DocumentArrowUpIcon className="w-96 h-96" />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-center animate-fadeIn">
          <div className="flex items-center justify-center space-x-2">
            <svg className="h-5 w-5 text-red-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-red-800">{error}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default PDFUpload 