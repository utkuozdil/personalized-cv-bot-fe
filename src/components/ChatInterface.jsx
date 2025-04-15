import { useState, useEffect, useRef, useCallback } from 'react'
import MessageList from './chat/MessageList'
import ChatInput from './chat/ChatInput'

// Convert conversation format to message format
const convertToMessageFormat = (conversationItem) => {
  if ('text' in conversationItem) {
    // Already in message format
    return conversationItem
  }
  return {
    text: conversationItem.content,
    isBot: conversationItem.role === 'assistant',
    error: false,
    timestamp: conversationItem.timestamp
  }
}

function ChatInterface({ socket, embeddingKey, email }) {
  
  // Load initial conversation from localStorage
  const [messages, setMessages] = useState(() => {
    try {
      const savedConversation = localStorage.getItem('conversation')
      if (savedConversation) {
        const parsed = JSON.parse(savedConversation)
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Convert each message to the correct format
          return parsed.map(convertToMessageFormat)
        }
      }
    } catch (error) {
      console.error('Error loading saved conversation:', error)
    }
    return []
  })

  const [inputMessage, setInputMessage] = useState('')
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [shouldScroll, setShouldScroll] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [isWaitingForInitial, setIsWaitingForInitial] = useState(messages.length === 0)  // Only wait if no messages
  const messagesEndRef = useRef(null)
  const streamingMessageRef = useRef('')
  const formatTimeoutRef = useRef(null)
  const scrollTimeoutRef = useRef(null)
  const chatContainerRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const initialMessageSentRef = useRef(false)
  const retryTimeoutRef = useRef(null)

  const isNearBottom = useCallback(() => {
    if (chatContainerRef.current) {
      const container = chatContainerRef.current
      const threshold = 100 // pixels from bottom
      return container.scrollHeight - container.scrollTop - container.clientHeight <= threshold
    }
    return true
  }, [])

  const scrollToBottom = useCallback(() => {
    if (shouldScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [shouldScroll])

  // Handle scroll events to determine if user has scrolled up
  const handleScroll = useCallback(() => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current
      const atBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 50
      setShouldScroll(atBottom)
    }
  }, [])

  // Debounced scroll to bottom
  const debouncedScrollToBottom = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }
    scrollTimeoutRef.current = setTimeout(() => {
      if (shouldScroll) {
        scrollToBottom()
      }
    }, 100) // Debounce scroll updates
  }, [shouldScroll, scrollToBottom])

  // Clean up scroll timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  // Add scroll event listener
  useEffect(() => {
    const container = chatContainerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true })
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  // Initial scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ block: 'end' })
    }
  }, [])

  // Optimized scroll effect
  useEffect(() => {
    if (messages.length > 0 || currentStreamingMessage) {
      requestAnimationFrame(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({
            behavior: shouldScroll ? 'smooth' : 'auto',
            block: 'end'
          })
        }
      })
    }
  }, [messages.length, currentStreamingMessage, shouldScroll])

  // Sync messages with localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('conversation', JSON.stringify(messages))
    }
  }, [messages])

  // Debounced format and update
  const updateStreamingMessage = useCallback((newContent) => {
    if (formatTimeoutRef.current) {
      clearTimeout(formatTimeoutRef.current)
    }
    formatTimeoutRef.current = setTimeout(() => {
      setCurrentStreamingMessage(newContent)
    }, 16) // Reduced debounce time for smoother updates
  }, [])

  // Effect to handle initial message check and retry
  useEffect(() => {
    const checkForInitialMessage = async () => {
      if (messages.length === 0) {
        setIsTyping(true) // Show typing indicator
        try {
          const response = await fetch(`/api/check-email?email=${encodeURIComponent(email)}`)
          const data = await response.json()
          
          if (data.hasPrevious && Array.isArray(data.resumes) && data.resumes.length > 0) {
            const latestCV = data.resumes[0]
            if (Array.isArray(latestCV.conversation) && latestCV.conversation.length > 0) {
              setMessages(latestCV.conversation.map(convertToMessageFormat))
              localStorage.setItem('conversation', JSON.stringify(latestCV.conversation.map(convertToMessageFormat)))
              setIsWaitingForInitial(false)
              setIsTyping(false)
              return
            }
          }
          
          // If we didn't find a conversation, retry after 500ms
          retryTimeoutRef.current = setTimeout(checkForInitialMessage, 500)
        } catch (error) {
          console.error('Error checking for initial message:', error)
          retryTimeoutRef.current = setTimeout(checkForInitialMessage, 500)
        }
      } else {
        setIsWaitingForInitial(false)
        setIsTyping(false)
      }
    }

    checkForInitialMessage()

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [email, messages.length])

  const addMessage = useCallback((newMessage) => {
    setMessages(prev => {
      // Check if this message is already in the array
      const isDuplicate = prev.some(msg => 
        msg.text === newMessage.text && 
        msg.isBot === newMessage.isBot &&
        Math.abs(new Date(msg.timestamp) - new Date(newMessage.timestamp)) < 1000
      )
      
      if (isDuplicate) {
        return prev
      }

      const newMessages = [...prev, newMessage]
      localStorage.setItem('conversation', JSON.stringify(newMessages))
      return newMessages
    })
  }, [])

  // Initialize WebSocket handlers
  useEffect(() => {
    if (!socket) return

    const handleOpen = () => {
      setIsConnected(true)
      
      // Only send initial message if we don't have any messages
      if (!initialMessageSentRef.current && messages.length === 0) {
        const initialMessage = {
          type: 'initial',
          embeddingKey,
          email
        }
        socket.send(JSON.stringify(initialMessage))
        initialMessageSentRef.current = true
        setIsTyping(true)
      }
    }

    const handleClose = () => {
      setIsConnected(false)
      initialMessageSentRef.current = false
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      
      reconnectTimeoutRef.current = setTimeout(() => {
        if (socket && socket.readyState === WebSocket.CLOSED) {
          socket.close()
          const errorMessage = convertToMessageFormat({
            content: 'Connection lost. Attempting to reconnect...',
            role: 'assistant',
            timestamp: new Date().toISOString(),
            error: true
          })
          addMessage(errorMessage)
        }
      }, 3000)
    }

    const handleMessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data)
        
        if (parsedData.type === 'initial_response') {
          setIsWaitingForInitial(false)
          setIsTyping(false)
        } else if (parsedData.type === 'typing') {
          setIsTyping(true)
          setIsStreaming(true)
          streamingMessageRef.current = ''
          setCurrentStreamingMessage('')
        } else if (parsedData.type === 'stream') {
          if (parsedData.token && typeof parsedData.token === 'string') {
            streamingMessageRef.current += parsedData.token
            updateStreamingMessage(streamingMessageRef.current)
          }
        } else if (parsedData.type === 'stream_end') {
          // Get the final message before clearing the ref
          const finalMessage = streamingMessageRef.current.trim()
          
          // Clear streaming states first
          streamingMessageRef.current = ''
          setCurrentStreamingMessage('')
          setIsStreaming(false)
          setIsTyping(false)

          // Then add the message if we have content
          if (finalMessage) {
            const newMessage = convertToMessageFormat({
              content: finalMessage,
              role: 'assistant',
              timestamp: new Date().toISOString()
            })
            
            // Use a timeout to ensure state updates are complete
            setTimeout(() => {
              addMessage(newMessage)
            }, 0)
          }
        } else if (parsedData.type === 'error') {
          setIsWaitingForInitial(false)
          
          // Clear states first
          streamingMessageRef.current = ''
          setCurrentStreamingMessage('')
          setIsStreaming(false)
          setIsTyping(false)

          if (parsedData.message) {
            const newMessage = convertToMessageFormat({
              content: parsedData.message,
              role: 'assistant',
              timestamp: new Date().toISOString(),
              error: true
            })
            addMessage(newMessage)
          }
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error)
        setIsWaitingForInitial(false)
        streamingMessageRef.current = ''
        setCurrentStreamingMessage('')
        setIsStreaming(false)
        setIsTyping(false)
      }
    }
    
    socket.onopen = handleOpen
    socket.onclose = handleClose
    socket.onmessage = handleMessage

    return () => {
      socket.onopen = null
      socket.onclose = null
      socket.onmessage = null
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [socket, embeddingKey, email, messages.length, addMessage])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!inputMessage.trim() || !socket || socket.readyState !== WebSocket.OPEN) return

    const messageText = inputMessage.trim()
    const newMessage = convertToMessageFormat({
      content: messageText,
      role: 'user',
      timestamp: new Date().toISOString()
    })
    addMessage(newMessage)
    
    setInputMessage('')
    setIsStreaming(true)
    setIsTyping(true)
    streamingMessageRef.current = ''

    const messageData = {
      question: messageText,
      embeddingKey,
      email
    }

    socket.send(JSON.stringify(messageData))
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto"
        style={{
          height: 'calc(100vh - 280px)',
          minHeight: '400px',
          scrollbarWidth: 'thin',
          scrollbarColor: '#CBD5E0 #F1F5F9'
        }}
      >
        <div className="flex flex-col p-6 space-y-4">
          <MessageList 
            messages={messages} 
            currentStreamingMessage={currentStreamingMessage}
            isTyping={isTyping}
          />
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>
      <div className="border-t border-gray-200 bg-white p-4 sticky bottom-0">
        <ChatInput
          value={inputMessage}
          onChange={setInputMessage}
          onSubmit={handleSubmit}
          disabled={isTyping || isStreaming}
        />
      </div>
    </div>
  )
}

export default ChatInterface 