import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import Home from '../../src/pages/Home'
import { uploadCV, pollStatus, checkPreviousCV } from '../../src/utils/cv'

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
    localStorage.clear()
  })

  describe('Email validation', () => {
    it('shows error for invalid email', () => {
      render(<Home />)
      
      const emailInput = screen.getByRole('textbox', { type: /email/i })
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
      fireEvent.blur(emailInput)

      expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument()
    })
  })

  describe('File upload', () => {
    it('shows error when trying to upload without email', async () => {
      render(<Home />)
      
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
      const fileInput = screen.getByTestId('file-input')
      
      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByText(/Please enter your email first/i)).toBeInTheDocument()
      })
    })

    it('handles successful file upload', async () => {
      render(<Home />)
      
      const emailInput = screen.getByRole('textbox', { type: /email/i })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.blur(emailInput)
      
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
      const fileInput = screen.getByTestId('file-input')
      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitFor(() => {
        expect(uploadCV).toHaveBeenCalledWith(file, 'test@example.com')
      })
    })
  })

  describe('Previous CV Handling', () => {
    it('shows dialog when previous CV exists', async () => {
      checkPreviousCV.mockResolvedValueOnce({ id: 'previous-cv-id' })
      render(<Home />)
      
      const emailInput = screen.getByRole('textbox', { type: /email/i })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.blur(emailInput)
      
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
      const fileInput = screen.getByTestId('file-input')
      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByTestId('previous-cv-dialog')).toBeInTheDocument()
      })
    })
  })

  describe('Status Management', () => {
    it('updates status and progress during file processing', async () => {
      render(<Home />)
      
      const emailInput = screen.getByRole('textbox', { type: /email/i })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.blur(emailInput)
      
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
      const fileInput = screen.getByTestId('file-input')
      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitFor(() => {
        expect(pollStatus).toHaveBeenCalledWith('test-uuid')
      })
    })
  })
}) 