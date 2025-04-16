import React, { useState, useEffect } from 'react'
import PDFUpload from '../components/PDFUpload'
import ChatInterface from '../components/ChatInterface'
import PreviousCVDialog from '../components/PreviousCVDialog'
import ErrorMessage from '../components/ErrorMessage'
import { validateEmail, checkPreviousCV, uploadCV, pollStatus } from '../utils/cv'
import { getStatusMessage, calculateProgress } from '../utils/status'
import HomeEmailInput from '../components/HomeEmailInput'
import HomeHeader from '../components/HomeHeader'
import ConfirmationMessage from '../components/ConfirmationMessage'

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
        <HomeHeader />

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden backdrop-blur-sm bg-white/80 border border-gray-100">
            <div className="p-8 sm:p-12">
              {/* Email Input */}
              {status === 'idle' && (
                <HomeEmailInput
                  email={email}
                  emailError={emailError}
                  handleEmailChange={handleEmailChange}
                  handleEmailBlur={handleEmailBlur}
                />
              )}

              {/* Upload Section */}
              {status === 'idle' && !showPreviousDialog && (
                <div className="max-w-2xl mx-auto">
                  <PDFUpload onFileSelect={handleFileUpload} />
                </div>
              )}

              {/* Loading States */}
              {status !== 'idle' && status !== 'error' && status !== 'embedded' && (
                <ConfirmationMessage status={status} getStatusMessage={getStatusMessage} />
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
                <ErrorMessage
                  message="An error occurred while processing your CV. Please try again."
                  onTryAgain={handleStartNew}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Previous CV Dialog */}
      <PreviousCVDialog
        open={showPreviousDialog}
        onClose={() => setShowPreviousDialog(false)}
        previousCV={previousCV}
        onStartNew={handleStartNew}
        onResumePrevious={handleResumePrevious}
      />
    </div>
  )
} 