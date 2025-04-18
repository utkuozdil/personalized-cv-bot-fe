import React from 'react'
import Message from './Message'
import TypingIndicator from './TypingIndicator'
import StreamingIndicator from './StreamingIndicator'
import formatMessage from './MessageFormatter'

function MessageList({ messages, isTyping, streamingMessage, messagesEndRef }) {
  
  return (
    <div className="space-y-6">
      {messages && messages.map((message, index) => (
        <Message key={`message-${index}-${message.text.substring(0, 10)}`} message={message} />
      ))}
      
      {/* Show streaming message with streaming indicator */}
      {streamingMessage && (
        <div className="flex justify-start">
          <div className="max-w-[80%] rounded-lg p-4 bg-gray-100 text-gray-800 shadow-sm leading-relaxed">
            {formatMessage(streamingMessage)}
            <StreamingIndicator />
          </div>
        </div>
      )}
      
      {/* Show typing indicator only when typing and no streaming message */}
      {isTyping && !streamingMessage && (
        <TypingIndicator />
      )}

      <div ref={messagesEndRef} className="h-4" />
    </div>
  )
}

export default MessageList 