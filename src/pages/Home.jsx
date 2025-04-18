import React, { useState, useEffect } from 'react'
import PDFUpload from '../components/PDFUpload'
import ChatInterface from '../components/ChatInterface'
import PreviousCVDialog from '../components/PreviousCVDialog'
import RestartChatDialog from '../components/RestartChatDialog'
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
  const [errorMessageText, setErrorMessageText] = useState('')

  // UI state
  const [progress, setProgress] = useState(0)
  const [highestProgress, setHighestProgress] = useState(0)
  const [previousCV, setPreviousCV] = useState(null)
  const [showPreviousDialog, setShowPreviousDialog] = useState(false)
  const [showRestartDialog, setShowRestartDialog] = useState(false)

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
          setErrorMessageText('WebSocket connection error. Please try again.')
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

  const handleEmailBlur = async (e) => {
    const currentEmailValue = e.target.value.trim();
    console.log('[Home] handleEmailBlur triggered for value:', currentEmailValue);
    
    if (!currentEmailValue) {
      console.log('[Home] Email blur: Email is empty.');
      setEmailError('Email is required');
      return; // Don't check if empty
    } 
    
    if (!validateEmail(currentEmailValue)) {
      console.log('[Home] Email blur: Email is invalid.');
      setEmailError('Please enter a valid email address');
      return; // Don't check if invalid
    }
    
    // Email is valid, clear error and check for previous CV
    console.log('[Home] Email blur: Email is valid, checking previous CV...');
    setEmailError(''); // Clear error if valid
    
    try {
      const previousData = await checkPreviousCV(currentEmailValue);
      console.log('[Home] Email blur: checkPreviousCV response:', previousData);
      if (previousData) {
        console.log('[Home] Email blur: Previous CV found, showing dialog.');
        setPreviousCV(previousData);
        setShowPreviousDialog(true);
      } else {
        console.log('[Home] Email blur: No previous CV found.');
      }
    } catch (error) {
      console.error('[Home] Email blur: Error checking previous CV:', error);
    }
  };

  const handleFileUpload = async (uploadedFile) => {
    console.log('[Home] handleFileUpload triggered with file:', uploadedFile?.name);
    if (!email || !validateEmail(email)) { // Also re-validate email here just in case
      console.log('[Home] File upload: Email is missing or invalid.');
      setEmailError('Please enter a valid email first');
      return;
    }
    
    console.log('[Home] File upload: Proceeding with new upload for:', email);
    setFile(uploadedFile);
    setStatus('uploading');
    setProgress(0);
    setHighestProgress(0);

    try {
      const newUuid = await uploadCV(uploadedFile, email)
      setUuid(newUuid)
      setStatus('created')
      localStorage.setItem('uuid', newUuid)
      localStorage.setItem('status', 'created')
      await checkInitialStatus(newUuid)
    } catch (error) {
      console.error('Error uploading file:', error)
      setErrorMessageText('Error uploading your CV. Please try again.')
      setStatus('error')
      clearProcessingState()
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
      } else if (newStatus === 'extraction_failed') {
        console.error('Extraction failed:', newStatus)
        setErrorMessageText('CV extraction failed. The document might be corrupted or unreadable. Please check the file and try again.')
        setStatus('error')
        clearProcessingState()
      } else if (newStatus === 'extraction_insufficient') {
        console.error('Extraction insufficient:', newStatus)
        setErrorMessageText('CV extraction insufficient. We could not gather enough information from the document. Please ensure it contains relevant details.')
        setStatus('error')
        clearProcessingState()
      } else if (STATUS_ORDER.includes(newStatus)) {
        console.log('Status not complete, polling again in 500ms...')
        setTimeout(() => checkInitialStatus(currentUuid), 500)
      } else {
        console.error('Unexpected status:', newStatus)
        setErrorMessageText('An unexpected error occurred during processing. Please try again.')
        setStatus('error')
        clearProcessingState()
      }
    } catch (error) {
      console.error('Error checking status:', error)
      setErrorMessageText('Error checking the processing status. Please try again.')
      setStatus('error')
      clearProcessingState()
    }
  }

  const clearProcessingState = () => {
    if (socket) {
      socket.close()
    }
    localStorage.removeItem('status')
    localStorage.removeItem('uuid')
    localStorage.removeItem('embeddingKey')
    localStorage.removeItem('conversation')
    localStorage.removeItem('currentEmbeddingKey')
    setUuid(null)
    setEmbeddingKey(null)
    setSocket(null)
    setProgress(0)
    setHighestProgress(0)
    // Don't clear email, error message, or set status to idle
  }

  // Add back the full clearState function for complete resets
  const clearState = () => {
    if (socket) {
      socket.close()
    }
    localStorage.removeItem('status')
    localStorage.removeItem('uuid')
    localStorage.removeItem('embeddingKey')
    localStorage.removeItem('conversation')
    localStorage.removeItem('currentEmbeddingKey')

    setUuid(null)
    setEmbeddingKey(null)
    setSocket(null)
    setProgress(0)
    setHighestProgress(0)
    setStatus('idle')
    setErrorMessageText('')
  }

  const handleStartForExistingEmail = () => {
    setShowPreviousDialog(false)
    setShowRestartDialog(false)
    setPreviousCV(null)
    clearState()
  }

  const handleStartFromScratch = () => {
    setShowPreviousDialog(false)
    setShowRestartDialog(false)
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
        setErrorMessageText('The previous CV session seems to be incomplete or invalid. Please start a new session.')
        setStatus('error')
        clearProcessingState()
      }
    } catch (error) {
      console.error('Error checking previous CV:', error)
      setErrorMessageText('Error retrieving your previous CV session. Please try again or start a new session.')
      setStatus('error')
      clearProcessingState()
    }
  }

  const handleRestartChat = () => {
    setShowRestartDialog(true)
  }

  const handleCancelRestart = () => {
    setShowRestartDialog(false)
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
                      onRestartChat={handleRestartChat}
                    />
                  </div>
                </div>
              )}

              {/* Error State */}
              {status === 'error' && (
                <ErrorMessage
                  data-testid="error-message-component"
                  message={errorMessageText || "An error occurred. Please try again."}
                  onTryAgain={handleStartForExistingEmail}
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
        onStartNew={handleStartForExistingEmail}
        onResumePrevious={handleResumePrevious}
      />

      {/* Restart Chat Dialog */}
      <RestartChatDialog
        open={showRestartDialog}
        onClose={() => setShowRestartDialog(false)}
        onCancel={handleCancelRestart}
        onRestart={handleStartFromScratch}
      />
    </div>
  )
} 