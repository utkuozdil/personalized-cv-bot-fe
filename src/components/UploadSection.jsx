import React from 'react'
import { PaperClipIcon } from '@heroicons/react/24/outline'
import PDFUpload from './PDFUpload'
import EmailInput from './EmailInput'

function UploadSection({ email, onEmailChange, onFileUpload }) {
  return (
    <div className="bg-white shadow-lg rounded-2xl p-8 transition-all duration-300">
      <EmailInput email={email} onChange={onEmailChange} />
      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center mb-4">
          <PaperClipIcon className="h-6 w-6 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Upload your CV</h3>
        </div>
        <PDFUpload onFileUpload={onFileUpload} />
      </div>
    </div>
  )
}

export default UploadSection 