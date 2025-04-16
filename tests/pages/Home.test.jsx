import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import Home from '../../src/pages/Home'
import { uploadCV, pollStatus, checkPreviousCV, validateEmail } from '../../src/utils/cv'

// Mock the hooks and services
jest.mock('../../src/utils/cv')

describe('Home Page', () => {
  const mockSendMessage = jest.fn()
  const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' })

  beforeEach(() => {
    jest.clearAllMocks()
    uploadCV.mockResolvedValue('test-uuid')
    pollStatus.mockResolvedValue({ status: 'processing', progress: 50 })
    checkPreviousCV.mockResolvedValue(null)
    validateEmail.mockReturnValue(true)
    localStorage.clear()
  })

  describe('Email validation', () => {
    it('shows error for invalid email', async () => {
      validateEmail.mockImplementation(() => false);
      
      render(<Home />)
      
      const emailInput = screen.getByRole('textbox', { name: /email address/i })
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
      
      await act(async () => {
          fireEvent.blur(emailInput);
      });

      await waitFor(() => {
        expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument()
      })
      expect(checkPreviousCV).not.toHaveBeenCalled()
      
      validateEmail.mockImplementation(() => true);
    })
  })

  describe('File upload', () => {
    it('shows error when trying to upload without email', async () => {
      render(<Home />)
      
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
      const fileInput = screen.getByTestId('file-input')
      
      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByText(/Please enter a valid email first/i)).toBeInTheDocument()
      })
      expect(uploadCV).not.toHaveBeenCalled();
    })

    it('handles successful file upload', async () => {
      render(<Home />)
      
      const emailInput = screen.getByRole('textbox', { name: /email address/i })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      await act(async () => {
          fireEvent.blur(emailInput);
      });
      await waitFor(() => expect(checkPreviousCV).toHaveBeenCalledWith('test@example.com'));
      
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
      const fileInput = screen.getByTestId('file-input')
      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitFor(() => {
        expect(uploadCV).toHaveBeenCalledWith(file, 'test@example.com')
      })
    })
  })

  describe('Previous CV Handling', () => {
    it('shows dialog when previous CV exists on email blur', async () => {
      const mockCvData = { uuid: 'previous-cv-uuid', filename: 'old.pdf' };
      checkPreviousCV.mockResolvedValueOnce(mockCvData)
      
      render(<Home />)
      
      const emailInput = screen.getByRole('textbox', { name: /email address/i })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      
      await act(async () => {
          fireEvent.blur(emailInput);
      });

      await waitFor(() => {
        expect(checkPreviousCV).toHaveBeenCalledWith('test@example.com');
        expect(screen.getByTestId('previous-cv-dialog')).toBeInTheDocument()
      })
      expect(uploadCV).not.toHaveBeenCalled();
    })
  })

  describe('Status Management', () => {
    it('updates status and progress during file processing', async () => {
      render(<Home />)
      
      const emailInput = screen.getByRole('textbox', { name: /email address/i })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      await act(async () => {
          fireEvent.blur(emailInput);
      });
      await waitFor(() => expect(checkPreviousCV).toHaveBeenCalledWith('test@example.com'));
      
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
      const fileInput = screen.getByTestId('file-input')
      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitFor(() => {
        expect(uploadCV).toHaveBeenCalledWith(file, 'test@example.com')
      })
      
      await waitFor(() => {
        expect(pollStatus).toHaveBeenCalledWith('test-uuid')
      })
    })
  })
}) 