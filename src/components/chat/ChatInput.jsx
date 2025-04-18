import React, { forwardRef } from 'react'
import { PaperAirplaneIcon } from '@heroicons/react/24/solid'

const ChatInput = forwardRef(function ChatInput({ value, onChange, onSubmit, disabled, placeholder = "Type your message..." }, ref) {
  return (
    <form onSubmit={onSubmit} className="w-full">
      <div className="flex items-center space-x-2">
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          disabled={disabled}
        />
        <button
          type="submit"
          className="bg-blue-500 text-white rounded-lg px-4 py-2 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:hover:bg-blue-500"
          disabled={disabled || !value.trim()}
        >
          <PaperAirplaneIcon className="h-5 w-5" />
        </button>
      </div>
    </form>
  )
})

export default ChatInput 