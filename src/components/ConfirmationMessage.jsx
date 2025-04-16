import React from 'react';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from './LoadingSpinner';

const ConfirmationMessage = ({ status, getStatusMessage }) => {
  return (
    <div className="max-w-md mx-auto">
      {status === 'created' ? (
        <div className="text-center space-y-4">
          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-100 rounded-xl p-3">
                <EnvelopeIcon className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Confirmation Required
            </h3>
            <p className="text-gray-600">
              Please check your email and click the confirmation link to continue.
            </p>
          </div>
          <div className="flex justify-center">
            <LoadingSpinner message={getStatusMessage(status)} />
          </div>
        </div>
      ) : (
        <LoadingSpinner message={getStatusMessage(status)} />
      )}
    </div>
  );
};

export default ConfirmationMessage; 