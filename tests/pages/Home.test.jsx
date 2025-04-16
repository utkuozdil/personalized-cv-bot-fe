import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import Home from '../../src/pages/Home'
import { uploadCV, pollStatus, checkPreviousCV } from '../../src/utils/cv'
import { useWebSocket } from '../../src/hooks/useWebSocket'

// Mock the hooks and services
jest.mock('../../src/hooks/useWebSocket', () => ({
  useWebSocket: jest.fn()
}))
jest.mock('../../src/utils/cv')

describe('Home Page', () => {
  const mockSendMessage = jest.fn()
  const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' })

  beforeEach(() => {
    jest.clearAllMocks()
    useWebSocket.mockReturnValue({
      sendMessage: mockSendMessage,
      lastMessage: null,
      connected: true
    })
    uploadCV.mockResolvedValue('test-uuid')
    pollStatus.mockResolvedValue({ status: 'processing', progress: 50 })
    checkPreviousCV.mockResolvedValue(null)
  })

  describe('Email validation', () => {
    it('shows error for invalid email', async () => {
      render(<Home />)
      
      const emailInput = screen.getByLabelText(/Email Address/i)
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
      fireEvent.blur(emailInput)

      await waitFor(() => {
        expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument()
      })
    })

    it('accepts valid email', async () => {
      render(<Home />)
      
      const emailInput = screen.getByLabelText(/Email Address/i)
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.blur(emailInput)

      await waitFor(() => {
        expect(screen.queryByText(/Please enter a valid email address/i)).not.toBeInTheDocument()
      })
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
      
      const emailInput = screen.getByLabelText(/Email Address/i)
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      
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
      render(<Home />)
      
      const emailInput = screen.getByLabelText(/Email Address/i)
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
      const fileInput = screen.getByTestId('file-input')
      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByTestId('dialog')).toBeInTheDocument()
      })
    })
  })

  describe('Status Management', () => {
    it('updates status and progress during file processing', async () => {
      render(<Home />)
      
      const emailInput = screen.getByLabelText(/Email Address/i)
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
      const fileInput = screen.getByTestId('file-input')
      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitFor(() => {
        expect(pollStatus).toHaveBeenCalledWith('test-uuid')
      })
    })
  })
}) 