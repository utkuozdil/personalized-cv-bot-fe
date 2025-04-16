import React from 'react';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

const HomeHeader = () => {
  return (
    <div className="text-center mb-16">
      <div className="flex items-center justify-center mb-6">
        <div className="bg-blue-50 p-4 rounded-2xl">
          <ChatBubbleLeftRightIcon className="h-12 w-12 text-blue-600" />
        </div>
      </div>
      <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
        CV Chat Assistant
      </h1>
      <p className="text-xl text-gray-600 max-w-2xl mx-auto">
        Upload your CV and let AI help you explore your professional journey
      </p>
    </div>
  );
};

export default HomeHeader; 