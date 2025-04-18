import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';

function RestartChatDialog({ 
  open, 
  onClose, 
  onCancel, 
  onRestart 
}) {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      PaperProps={{
        className: 'rounded-2xl shadow-xl'
      }}
      maxWidth="sm"
      fullWidth
      data-testid="restart-chat-dialog"
    >
      <DialogTitle className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Start New Chat?</h2>
        </div>
      </DialogTitle>
      <DialogContent className="px-6 py-6">
        <p className="text-gray-600 mb-4">
          You're about to leave the current chat and start over with a new CV. Your current conversation will be lost.
        </p>
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <div className="flex items-center space-x-3 text-sm">
            <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="font-medium text-gray-900">This action cannot be undone</span>
          </div>
        </div>
      </DialogContent>
      <DialogActions className="px-6 py-4 border-t bg-gray-50">
        <Button 
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
        >
          Continue Chat
        </Button>
        <Button 
          onClick={onRestart}
          variant="contained"
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm"
        >
          Start New CV
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default RestartChatDialog; 