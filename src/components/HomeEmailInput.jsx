import React from 'react';

const HomeEmailInput = ({ email, emailError, handleEmailChange, handleEmailBlur }) => {
  return (
    <div className="max-w-md mx-auto mb-10">
      <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
        Email Address
      </label>
      <div className="relative">
        <input
          type="email"
          id="email"
          value={email}
          onChange={handleEmailChange}
          onBlur={handleEmailBlur}
          placeholder="Enter your email"
          className={`w-full px-4 py-3 border-2 rounded-xl bg-gray-50/50 
            ${emailError ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'}
            focus:outline-none focus:ring-2 ${emailError ? 'focus:ring-red-200' : 'focus:ring-blue-200'}
            transition-all duration-200`}
        />
        {emailError && (
          <p className="mt-2 text-sm text-red-600 flex items-center">
            <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {emailError}
          </p>
        )}
      </div>
    </div>
  );
};

export default HomeEmailInput; 