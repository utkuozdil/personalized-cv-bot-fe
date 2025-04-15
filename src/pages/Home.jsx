import React, { useState, useEffect } from 'react'
import PDFUpload from '../components/PDFUpload'
import LoadingSpinner from '../components/LoadingSpinner'
import ChatInterface from '../components/ChatInterface'
import { validateEmail, checkPreviousCV, uploadCV, pollStatus } from '../utils/cv'
import { getStatusMessage, calculateProgress } from '../utils/status'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material'
import { ChatBubbleLeftRightIcon, EnvelopeIcon } from '@heroicons/react/24/outline'

const STATUS_ORDER = ['created', 'uploaded', 'extracted', 'processing', 'embedded']

export default function Home() {
  // Core state
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('idle')
  const [uuid, setUuid] = useState(null)
  const [embeddingKey, setEmbeddingKey] = useState(null)
  const [socket, setSocket] = useState(null)

  // UI state
  const [progress, setProgress] = useState(0)
  const [highestProgress, setHighestProgress] = useState(0)
  const [previousCV, setPreviousCV] = useState(null)
  const [showPreviousDialog, setShowPreviousDialog] = useState(false)

  // Initialize session from localStorage
  useEffect(() => {
    const storedStatus = localStorage.getItem('status')
    const storedUuid = localStorage.getItem('uuid')
    const storedEmbeddingKey = localStorage.getItem('embeddingKey')
    const storedEmail = localStorage.getItem('email')
    
    if (storedEmail) {
      setEmail(storedEmail)
    }
    
    if (storedStatus && storedUuid) {
      setStatus(storedStatus)
      setUuid(storedUuid)
      if (storedStatus === 'embedded' && storedEmbeddingKey) {
        setEmbeddingKey(storedEmbeddingKey)
      }
    }
  }, [])

  // Handle WebSocket initialization and cleanup
  useEffect(() => {
    if (status === 'embedded' && embeddingKey && !socket) {
      console.log('Initializing WebSocket with:', { status, embeddingKey })
      
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${wsProtocol}//${window.location.host}/ws`
      
      try {
        const newSocket = new WebSocket(wsUrl)
        
        newSocket.onopen = () => {
          console.log('WebSocket connected')
          setSocket(newSocket)
        }
        
        newSocket.onerror = (error) => {
          console.error('WebSocket error:', error)
          setStatus('error')
          setSocket(null)
        }
        
        newSocket.onclose = () => {
          console.log('WebSocket closed')
          setSocket(null)
        }
      } catch (error) {
        console.error('Error creating WebSocket:', error)
        setStatus('error')
      }
    }

    return () => {
      if (socket && status !== 'embedded') {
        console.log('Cleaning up WebSocket')
        socket.close()
        setSocket(null)
      }
    }
  }, [status, embeddingKey, socket])

  // Update progress based on status
  useEffect(() => {
    if (status !== 'idle' && status !== 'error') {
      const newProgress = calculateProgress(status, progress, highestProgress)
      setProgress(newProgress)
      setHighestProgress(Math.max(newProgress, highestProgress))
    }
  }, [status, progress, highestProgress])

  const handleEmailChange = async (e) => {
    const newEmail = e.target.value.trim()
    setEmail(newEmail)
    setEmailError('')

    if (!newEmail) {
      setEmailError('Email is required')
      localStorage.removeItem('email')
      return
    }

    if (!validateEmail(newEmail)) {
      setEmailError('Please enter a valid email address')
      return
    }

    // Store valid email in localStorage
    localStorage.setItem('email', newEmail)
  }

  // Remove separate blur handler since we're checking on change
  const handleEmailBlur = () => {
    if (!email) {
      setEmailError('Email is required')
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address')
    }
  }

  const handleFileUpload = async (uploadedFile) => {
    if (!email) {
      setEmailError('Please enter your email first')
      return
    }

    // Check for previous CVs before uploading
    try {
      const previousData = await checkPreviousCV(email)
      if (previousData) {
        setPreviousCV(previousData)
        setShowPreviousDialog(true)
        return
      }
    } catch (error) {
      console.error('Error checking previous CV:', error)
      // Continue with upload even if check fails
    }

    setFile(uploadedFile)
    setStatus('uploading')
    setProgress(0)
    setHighestProgress(0)

    try {
      const newUuid = await uploadCV(uploadedFile, email)
      setUuid(newUuid)
      setStatus('created')
      localStorage.setItem('uuid', newUuid)
      localStorage.setItem('status', 'created')
      await checkInitialStatus(newUuid)
    } catch (error) {
      console.error('Error uploading file:', error)
      setStatus('error')
      clearState()
    }
  }

  const checkInitialStatus = async (currentUuid) => {
    try {
      console.log('Checking initial status for UUID:', currentUuid)
      const data = await pollStatus(currentUuid)
      const newStatus = data.status
      console.log('Status check complete:', {
        currentStatus: status,
        newStatus,
        currentUuid,
        fullResponse: data
      })

      const currentIndex = STATUS_ORDER.indexOf(status)
      const newIndex = STATUS_ORDER.indexOf(newStatus)

      if (newIndex > currentIndex) {
        console.log('Status progressed:', { from: status, to: newStatus })
        setStatus(newStatus)
        localStorage.setItem('status', newStatus)
      }

      if (newStatus === 'embedded') {
        console.log('Embedding complete, setting up chat...')
        const newEmbeddingKey = `embeddings/${currentUuid}.json`
        setEmbeddingKey(newEmbeddingKey)
        localStorage.setItem('embeddingKey', newEmbeddingKey)
        localStorage.setItem('status', 'embedded')
        localStorage.setItem('uuid', currentUuid)
      } else if (STATUS_ORDER.includes(newStatus)) {
        console.log('Status not complete, polling again in 2s...')
        setTimeout(() => checkInitialStatus(currentUuid), 2000)
      } else {
        console.error('Unexpected status:', newStatus)
        setStatus('error')
        clearState()
      }
    } catch (error) {
      console.error('Error checking status:', error)
      setStatus('error')
      clearState()
    }
  }

  const clearState = () => {
    if (socket) {
      socket.close()
    }
    localStorage.removeItem('status')
    localStorage.removeItem('uuid')
    localStorage.removeItem('embeddingKey')
    localStorage.removeItem('conversation')
    localStorage.removeItem('currentEmbeddingKey')
    setEmail('')
    setUuid(null)
    setEmbeddingKey(null)
    setSocket(null)
    setProgress(0)
    setHighestProgress(0)
    setStatus('idle')
  }

  const handleStartNew = () => {
    setShowPreviousDialog(false)
    setPreviousCV(null)
    clearState()
  }

  const handleResumePrevious = async () => {
    if (!previousCV?.uuid) return
    
    setShowPreviousDialog(false)
    setStatus('checking')
    setUuid(previousCV.uuid)

    try {
      // Store all CV information from the API response
      localStorage.setItem('uuid', previousCV.uuid)
      localStorage.setItem('conversation', JSON.stringify(previousCV.conversation || []))
      localStorage.setItem('cv_summary', previousCV.summary || '')
      localStorage.setItem('cv_score_feedback', JSON.stringify(previousCV.score_feedback || {}))
      localStorage.setItem('cv_filename', previousCV.filename || '')
      localStorage.setItem('cv_created_at', previousCV.created_at || '')
      
      // Check if CV is still valid and embedded
      const data = await pollStatus(previousCV.uuid)
      if (data.status === 'embedded') {
        const newEmbeddingKey = `embeddings/${previousCV.uuid}.json`
        setEmbeddingKey(newEmbeddingKey)
        setStatus('embedded')
        localStorage.setItem('status', 'embedded')
        localStorage.setItem('embeddingKey', newEmbeddingKey)
        localStorage.setItem('currentEmbeddingKey', newEmbeddingKey)
      } else {
        setStatus('error')
        clearState()
      }
    } catch (error) {
      console.error('Error checking previous CV:', error)
      setStatus('error')
      clearState()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="max-w-6xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-blue-50 p-4 rounded-2xl">
              <ChatBubbleLeftRightIcon className="h-12 w-12 text-blue-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
            CV Chat Assistant
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Upload your CV and let AI help you explore your professional journey
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden backdrop-blur-sm bg-white/80 border border-gray-100">
            <div className="p-8 sm:p-12">
              {/* Email Input */}
              {status === 'idle' && (
                <div className="max-w-md mx-auto mb-10">
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={handleEmailChange}
                      onBlur={handleEmailBlur}
                      placeholder="Enter your email"
                      className={`w-full px-4 py-3 border-2 rounded-xl bg-gray-50/50 
                        ${emailError ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'}
                        focus:outline-none focus:ring-2 ${emailError ? 'focus:ring-red-200' : 'focus:ring-blue-200'}
                        transition-all duration-200`}
                    />
                    {emailError && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {emailError}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Upload Section */}
              {status === 'idle' && !showPreviousDialog && (
                <div className="max-w-2xl mx-auto">
                  <PDFUpload onFileSelect={handleFileUpload} />
                </div>
              )}

              {/* Loading States */}
              {status !== 'idle' && status !== 'error' && status !== 'embedded' && (
                <div className="max-w-md mx-auto">
                  {status === 'created' ? (
                    <div className="text-center space-y-4">
                      <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                        <div className="flex justify-center mb-4">
                          <div className="bg-blue-100 rounded-xl p-3">
                            <EnvelopeIcon className="h-8 w-8 text-blue-600" />
                          </div>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Confirmation Required
                        </h3>
                        <p className="text-gray-600">
                          Please check your email and click the confirmation link to continue.
                        </p>
                      </div>
                      <div className="flex justify-center">
                        <LoadingSpinner message={getStatusMessage(status)} />
                      </div>
                    </div>
                  ) : (
                    <LoadingSpinner message={getStatusMessage(status)} />
                  )}
                </div>
              )}

              {/* Chat Interface */}
              {status === 'embedded' && embeddingKey && socket && (
                <div className="h-[700px] flex flex-col bg-gray-50/50 rounded-2xl overflow-hidden border border-gray-100">
                  <div className="flex-1 overflow-hidden">
                    <ChatInterface
                      key={`chat-${uuid}-${embeddingKey}`}
                      socket={socket}
                      embeddingKey={embeddingKey}
                      email={email}
                    />
                  </div>
                </div>
              )}

              {/* Error State */}
              {status === 'error' && (
                <div className="max-w-md mx-auto">
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
                    <svg className="h-12 w-12 text-red-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-red-800 mb-2">Error Processing CV</h3>
                    <p className="text-red-600">An error occurred while processing your CV. Please try again.</p>
                    <button
                      onClick={handleStartNew}
                      className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Previous CV Dialog */}
      <Dialog 
        open={showPreviousDialog} 
        onClose={() => setShowPreviousDialog(false)}
        PaperProps={{
          className: 'rounded-2xl shadow-xl'
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Previous CV Found</h2>
          </div>
        </DialogTitle>
        <DialogContent className="px-6 py-6">
          <p className="text-gray-600 mb-4">
            We found your previously analyzed CV. Would you like to resume your previous conversation or start a new one?
          </p>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center space-x-3 text-sm">
              <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <span className="font-medium text-gray-900">{previousCV?.filename}</span>
            </div>
            {previousCV?.created_at && (
              <div className="flex items-center space-x-3 mt-2 text-sm text-gray-500">
                <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>
                  Analyzed on {new Date(previousCV.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            )}
          </div>
        </DialogContent>
        <DialogActions className="px-6 py-4 border-t bg-gray-50">
          <Button 
            onClick={handleStartNew}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
          >
            Start New
          </Button>
          <Button 
            onClick={handleResumePrevious}
            variant="contained"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm"
          >
            Resume Previous
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
} 