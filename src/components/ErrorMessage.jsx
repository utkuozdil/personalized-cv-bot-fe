import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const ErrorMessage = ({ message, onTryAgain }) => {
  return (
    <div className="max-w-md mx-auto">
      <div className="text-center space-y-4">
        <div className="bg-red-50 rounded-2xl p-6 border border-red-100">
          <div className="flex justify-center mb-4">
            <div className="bg-red-100 rounded-xl p-3" data-testid="error-icon-container">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {message}
          </h3>
          <button
            onClick={onTryAgain}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage; 