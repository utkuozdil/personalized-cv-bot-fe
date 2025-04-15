import React from 'react'

function EmailInput({ email, onChange }) {
  return (
    <div className="mb-6">
      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
        Email Address
      </label>
      <div className="mt-1 relative rounded-md shadow-sm">
        <input
          type="email"
          id="email"
          value={email}
          onChange={onChange}
          placeholder="Enter your email address"
          className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
          required
        />
      </div>
    </div>
  )
}

export default EmailInput 