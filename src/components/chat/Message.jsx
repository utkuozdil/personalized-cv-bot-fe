import React from 'react'
import formatMessage from './MessageFormatter'

function Message({ message }) {
  
  if (!message || !message.text) {
    console.warn('Invalid message:', message)
    return null
  }

  return (
    <div className={`flex ${message.isBot ? 'justify-start' : 'justify-end'} mb-4`}>
      <div
        className={`max-w-[80%] rounded-lg p-4 ${
          message.isBot
            ? message.error 
              ? 'bg-red-50 text-red-800' 
              : 'bg-gray-100 text-gray-800 shadow-sm'
            : 'bg-blue-500 text-white shadow-sm'
        } ${message.isBot ? 'leading-relaxed' : ''}`}
      >
        <div className="whitespace-pre-wrap">
          {message.isBot ? formatMessage(message.text) : message.text}
        </div>
        {message.similarity > 0 && (
          <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
            Relevance score: {(message.similarity * 100).toFixed(2)}%
          </div>
        )}
      </div>
    </div>
  )
}

export default Message 