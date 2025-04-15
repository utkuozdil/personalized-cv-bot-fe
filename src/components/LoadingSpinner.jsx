import React from 'react'
import { DocumentTextIcon } from '@heroicons/react/24/outline'

function LoadingSpinner({ message = 'Processing your CV...' }) {
  const steps = [
    { label: 'Uploading', status: 'uploading' },
    { label: 'Extracting', status: 'extracting' },
    { label: 'Analyzing', status: 'processing' },
    { label: 'Finalizing', status: 'embedded' }
  ]

  const getCurrentStep = () => {
    if (message.toLowerCase().includes('upload')) return 0
    if (message.toLowerCase().includes('extract')) return 1
    if (message.toLowerCase().includes('analyz')) return 2
    if (message.toLowerCase().includes('final')) return 3
    return 0
  }

  const currentStep = getCurrentStep()

  return (
    <div className="flex flex-col items-center justify-center py-12">
      {/* Spinner with Icon */}
      <div className="relative mb-8">
        {/* Outer glow */}
        <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-xl"></div>
        
        {/* Spinner container */}
        <div className="relative w-24 h-24">
          {/* Background ring */}
          <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
          
          {/* Primary spinning ring */}
          <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
          
          {/* Secondary spinning ring */}
          <div className="absolute inset-1 border-4 border-blue-400/30 rounded-full border-b-transparent animate-spin-slow"></div>
          
          {/* Center icon container */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-2">
              <DocumentTextIcon className="h-8 w-8 text-blue-500 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Message */}
      <div className="text-center space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">{message}</h3>
        
        {/* Progress Steps */}
        <div className="flex items-center justify-center space-x-2 px-4">
          {steps.map((step, index) => (
            <React.Fragment key={step.status}>
              {/* Step Circle */}
              <div className={`
                flex items-center justify-center w-8 h-8 rounded-full 
                transition-all duration-300
                ${index <= currentStep 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-400'
                }
              `}>
                {index + 1}
              </div>
              
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className={`
                  flex-1 h-0.5 transition-all duration-300
                  ${index < currentStep ? 'bg-blue-500' : 'bg-gray-200'}
                `}></div>
              )}
            </React.Fragment>
          ))}
        </div>
        
        <p className="text-sm text-gray-500">
          Step {currentStep + 1} of {steps.length}
        </p>
      </div>
    </div>
  )
}

export default LoadingSpinner 