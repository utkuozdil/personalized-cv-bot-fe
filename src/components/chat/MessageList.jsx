import React from 'react'
import Message from './Message'
import TypingIndicator from './TypingIndicator'
import StreamingIndicator from './StreamingIndicator'
import formatMessage from './MessageFormatter'

function MessageList({ messages, isTyping, currentStreamingMessage }) {
  
  return (
    <div className="space-y-6">
      {messages && messages.map((message, index) => (
        <Message key={`message-${index}-${message.text.substring(0, 10)}`} message={message} />
      ))}
      
      {/* Show streaming message with streaming indicator */}
      {currentStreamingMessage && (
        <div className="flex justify-start">
          <div className="max-w-[80%] rounded-lg p-4 bg-gray-100 text-gray-800 shadow-sm leading-relaxed">
            {formatMessage(currentStreamingMessage)}
            <StreamingIndicator />
          </div>
        </div>
      )}
      
      {/* Show typing indicator only when typing and no streaming message */}
      {isTyping && !currentStreamingMessage && (
        <TypingIndicator />
      )}
    </div>
  )
}

export default MessageList 