import { useState, useEffect, useRef, useCallback } from 'react'
import MessageList from './chat/MessageList'
import ChatInput from './chat/ChatInput'
import { convertToMessageFormat } from '../utils/format'

function ChatInterface({ socket, embeddingKey, email, onRestartChat }) {
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
  const [isWaitingForInitial, setIsWaitingForInitial] = useState(messages.length === 0)
  const messagesEndRef = useRef(null)
  const streamingMessageRef = useRef('')
  const formatTimeoutRef = useRef(null)
  const scrollTimeoutRef = useRef(null)
  const chatContainerRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const initialMessageSentRef = useRef(false)
  const retryTimeoutRef = useRef(null)
  const messageIdRef = useRef(null)
  const isProcessingRef = useRef(false)
  const lastStreamEndRef = useRef(null)
  const lastAssistantMessageRef = useRef('')
  const pollIntervalRef = useRef(null)
  const inputRef = useRef(null)
  const POLL_INTERVAL = 500

  const scrollToBottom = useCallback(() => {
    if (shouldScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [shouldScroll])

  // Handle scroll events to determine if user has scrolled up
  const handleScroll = useCallback(() => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current
      const atBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 100
      setShouldScroll(atBottom)
    }
  }, [])

  // Clean up scroll timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  // Add scroll event listener with throttling
  useEffect(() => {
    const container = chatContainerRef.current
    if (!container) return

    let ticking = false
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll()
          ticking = false
        })
        ticking = true
      }
    }

    container.addEventListener('scroll', throttledScroll, { passive: true })
    return () => container.removeEventListener('scroll', throttledScroll)
  }, [handleScroll])

  // Initial scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ block: 'end' })
    }
  }, [])

  // Optimized scroll effect for new messages
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
      }
    }

    if (messages.length > 0) {
      scrollToBottom()
    }
  }, [messages.length])

  // Scroll to bottom when streaming message updates (if user hasn't scrolled up)
  useEffect(() => {
    if (currentStreamingMessage && shouldScroll) {
      scrollToBottom();
    }
  }, [currentStreamingMessage, shouldScroll, scrollToBottom]);

  // Sync messages with localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('conversation', JSON.stringify(messages))
    }
  }, [messages])

  // Additional effect to check socket state periodically
  useEffect(() => {
    if (!socket) return
    
    // Check if socket is actually open but state doesn't reflect it
    const checkConnectionInterval = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN && !isConnected) {
        console.log('Connection check: Socket open but isConnected is false, fixing state')
        setIsConnected(true)
      }
    }, 1000)
    
    return () => clearInterval(checkConnectionInterval)
  }, [socket, isConnected])

  // Effect to handle initial message check and retry
  useEffect(() => {
    const checkForInitialMessage = async () => {
      if (messages.length === 0) {
        setIsTyping(true) 
        try {
          const response = await fetch(`/api/check-email?email=${encodeURIComponent(email)}`)
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json()
          
          if (data.hasPrevious && Array.isArray(data.resumes) && data.resumes.length > 0) {
            const latestCV = data.resumes[0]
            if (Array.isArray(latestCV.conversation) && latestCV.conversation.length > 0) {
              setMessages(latestCV.conversation.map(convertToMessageFormat))
              localStorage.setItem('conversation', JSON.stringify(latestCV.conversation.map(convertToMessageFormat)))
              setIsWaitingForInitial(false)
              setIsTyping(false)
              // Clear polling if we got messages
              if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current)
                pollIntervalRef.current = null
              }
              return 
            }
          }
        } catch (error) {
          console.error('Error checking for initial message:', error)
        } 
      } else {
        setIsWaitingForInitial(false)
        setIsTyping(false)
        // Clear polling if we have messages
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
          pollIntervalRef.current = null
        }
      }
    }

    // Initial check
    checkForInitialMessage()

    // Start polling only if no messages
    if (messages.length === 0 && !pollIntervalRef.current) {
      pollIntervalRef.current = setInterval(checkForInitialMessage, POLL_INTERVAL)
    }

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
    }
  }, [email, messages.length])

  const addMessage = useCallback((newMessage) => {
    setMessages(prev => {
      if (newMessage.isBot) {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.isBot && lastMessage.text === newMessage.text) {
          return prev;
        }
      }
      const newMessages = [...prev, newMessage];
      localStorage.setItem('conversation', JSON.stringify(newMessages));
      // Only update the ref after the message is actually added
      if (newMessage.isBot) {
        lastAssistantMessageRef.current = newMessage.text;
      }
      return newMessages;
    });
  }, []);

  // Initialize WebSocket handlers
  useEffect(() => {
    if (!socket) return

    const handleOpen = () => {
      console.log('Socket open, setting connected state')
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

    // Immediately set connection state based on socket's current state
    if (socket.readyState === WebSocket.OPEN) {
      console.log('Socket already open, setting connected state')
      setIsConnected(true)
    }

    const handleClose = () => {
      console.log('Socket closed, setting disconnected state')
      setIsConnected(false)
      initialMessageSentRef.current = false
      
      // Clear polling on disconnect
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
      
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
        const parsedData = JSON.parse(event.data);

        if (parsedData.type === 'initial_response') {
          setIsWaitingForInitial(false);
          setIsTyping(false);
        } else if (parsedData.type === 'typing') {
          setIsTyping(true);
          setCurrentStreamingMessage('');
          streamingMessageRef.current = '';
        } else if (parsedData.type === 'stream') {
          if (parsedData.token && typeof parsedData.token === 'string') {
            streamingMessageRef.current += parsedData.token;
            setCurrentStreamingMessage(streamingMessageRef.current);
            setIsTyping(true);
          }
        } else if (parsedData.type === 'stream_end') {
          const finalMessage = streamingMessageRef.current.trim();
          streamingMessageRef.current = '';
          setCurrentStreamingMessage('');
          setIsTyping(false);
          setIsStreaming(false); // Reset streaming state

          if (finalMessage) {
            const newMessage = convertToMessageFormat({
              content: finalMessage,
              role: 'assistant',
              timestamp: new Date().toISOString(),
            });
            addMessage(newMessage);
            
            // Focus the input field after receiving a message
            setTimeout(() => {
              if (inputRef.current) {
                inputRef.current.focus();
              }
            }, 100);
          }
        } else if (parsedData.type === 'error') {
          setIsTyping(false);
          setIsStreaming(false); // Also reset streaming state on error
          streamingMessageRef.current = '';
          setCurrentStreamingMessage('');
          if (parsedData.message) {
            const newMessage = convertToMessageFormat({
              content: parsedData.message,
              role: 'assistant',
              timestamp: new Date().toISOString(),
              error: true,
            });
            addMessage(newMessage);
          }
        }
      } catch (error) {
        setIsTyping(false);
        streamingMessageRef.current = '';
        setCurrentStreamingMessage('');
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
  }, [socket, embeddingKey, email, messages.length, addMessage, isStreaming])

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
    messageIdRef.current = Date.now().toString()
    isProcessingRef.current = true
    lastStreamEndRef.current = null

    setTimeout(() => {
      const messageData = {
        question: messageText,
        embeddingKey,
        email
      }
  
      socket.send(JSON.stringify(messageData))
    }, 100)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with restart button */}
      <div className="bg-white border-b border-gray-200 py-3 px-4 flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-800">Chat with CV Assistant</h2>
        <button 
          onClick={onRestartChat}
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center transition-colors"
        >
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Upload New CV
        </button>
      </div>

      {/* Chat messages */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto bg-gray-50/60 p-4 space-y-4"
      >
        <MessageList 
          messages={messages} 
          streamingMessage={isStreaming ? currentStreamingMessage : ''} 
          isTyping={isTyping}
          messagesEndRef={messagesEndRef}
        />
      </div>

      {/* Input area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <ChatInput 
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onSubmit={handleSubmit}
          disabled={!isConnected || isStreaming}
          placeholder={isConnected ? "Type your message..." : "Connecting..."}
          ref={inputRef}
        />
      </div>
    </div>
  )
}

export default ChatInterface 