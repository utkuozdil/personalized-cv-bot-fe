import { useState, useEffect, useRef, useCallback } from 'react'
import MessageList from './chat/MessageList'
import ChatInput from './chat/ChatInput'
import { convertToMessageFormat } from '../utils/format'
function ChatInterface({ socket, embeddingKey, email }) {
  // console.log('[ChatInterface] Props received:', { socket, embeddingKey, email }); // <-- REMOVED
  
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

  // console.log('[ChatInterface] Initial messages state:', messages); // <-- REMOVED

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

  // Effect to handle initial message check and retry
  useEffect(() => {
    const checkForInitialMessage = async () => {
      if (messages.length === 0) {
        // console.log('[ChatInterface] Checking for initial message for email:', email); // <-- REMOVED
        setIsTyping(true) 
        try {
          const response = await fetch(`/api/check-email?email=${encodeURIComponent(email)}`)
          // console.log('[ChatInterface] API Response Status:', response.status); // <-- REMOVED
          // console.log('[ChatInterface] API Response OK?:', response.ok); // <-- REMOVED

          if (!response.ok) {
            // console.error('[ChatInterface] API Error Response:', await response.text()); // <-- REMOVED
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json()
          // console.log('[ChatInterface] API Response Data:', data); // <-- REMOVED
          
          if (data.hasPrevious && Array.isArray(data.resumes) && data.resumes.length > 0) {
            // console.log('[ChatInterface] Found previous conversation.'); // <-- REMOVED
            const latestCV = data.resumes[0]
            if (Array.isArray(latestCV.conversation) && latestCV.conversation.length > 0) {
              setMessages(latestCV.conversation.map(convertToMessageFormat))
              localStorage.setItem('conversation', JSON.stringify(latestCV.conversation.map(convertToMessageFormat)))
              setIsWaitingForInitial(false)
              setIsTyping(false)
              return 
            }
          }
          
          // console.log('[ChatInterface] No previous conversation found or conversation empty...'); // <-- REMOVED
        } catch (error) {
          // console.error('[ChatInterface] Error checking for initial message:', error) // <-- REMOVED
        } 
      } else {
        // console.log('[ChatInterface] Already have messages, skipping initial check.'); // <-- REMOVED
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
        className="flex-1 overflow-y-auto scroll-smooth"
        style={{
          height: 'calc(100vh - 280px)',
          minHeight: '400px',
          scrollbarWidth: 'thin',
          scrollbarColor: '#CBD5E0 #F1F5F9',
          WebkitOverflowScrolling: 'touch' // For smooth scrolling on iOS
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