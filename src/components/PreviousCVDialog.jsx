import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';

function PreviousCVDialog({ 
  open, 
  onClose, 
  previousCV, 
  onStartNew, 
  onResumePrevious 
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
      data-testid="previous-cv-dialog"
    >
      <DialogTitle className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Previous CV Found</h2>
        </div>
      </DialogTitle>
      <DialogContent className="px-6 py-6">
        <p className="text-gray-600 mb-4">
          We found your previously analyzed CV. Would you like to resume your previous conversation or start a new one?
        </p>
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <div className="flex items-center space-x-3 text-sm">
            <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <span className="font-medium text-gray-900">{previousCV?.filename}</span>
          </div>
          {previousCV?.created_at && (
            <div className="flex items-center space-x-3 mt-2 text-sm text-gray-500">
              <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>
                Analyzed on {new Date(previousCV.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          )}
        </div>
      </DialogContent>
      <DialogActions className="px-6 py-4 border-t bg-gray-50">
        <Button 
          onClick={onStartNew}
          className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
        >
          Start New
        </Button>
        <Button 
          onClick={onResumePrevious}
          variant="contained"
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm"
        >
          Resume Previous
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default PreviousCVDialog; 