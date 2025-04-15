import React from 'react'
import LoadingSpinner from './LoadingSpinner'

function ProcessingStatus({ statusMessage, currentStatus, progress }) {
  return (
    <div className="bg-white shadow-lg rounded-2xl p-8 transition-all duration-300">
      <LoadingSpinner message={statusMessage || "Processing your CV..."} />
      <div className="mt-4">
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-2 text-sm text-gray-600">
          <span>{currentStatus}</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>
    </div>
  )
}

export default ProcessingStatus 