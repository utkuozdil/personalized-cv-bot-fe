import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import ChatInterface from '../../src/components/ChatInterface'
import { convertToMessageFormat } from '../../src/utils/format'

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

// Mock WebSocket
let mockSocket = null
class MockWebSocket {
  constructor(url) {
    this.url = url
    this.readyState = WebSocket.OPEN
    this.send = jest.fn()
    this.close = jest.fn()
    this.onopen = jest.fn()
    this.onclose = jest.fn()
    this.onmessage = jest.fn()
    
    // Store instance for testing
    mockSocket = this
    
    // Simulate connection immediately
    setTimeout(() => {
      if (this.onopen) this.onopen()
    }, 0)
  }
}

MockWebSocket.OPEN = WebSocket.OPEN
MockWebSocket.CLOSED = WebSocket.CLOSED
global.WebSocket = MockWebSocket

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ hasInitialMessage: true, message: 'Initial message' })
  })
)

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn()

describe('ChatInterface', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.clear()
    mockSocket = new MockWebSocket('ws://localhost')
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  it('renders without crashing', () => {
    render(<ChatInterface embeddingKey="test-key" email="test@example.com" />)
    expect(screen.getByPlaceholderText(/type your message/i)).toBeInTheDocument()
  })

  it('loads initial conversation from localStorage', async () => {
    const mockMessages = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there' }
    ]
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockMessages))

    render(<ChatInterface embeddingKey="test-key" email="test@example.com" />)
    
    await waitFor(() => {
      const messages = screen.getAllByText(/Hello|Hi there/)
      expect(messages).toHaveLength(2)
      expect(messages[0]).toHaveTextContent('Hello')
      expect(messages[1]).toHaveTextContent('Hi there')
    })
  })

  it('handles WebSocket connection and initial message', async () => {
    render(<ChatInterface embeddingKey="test-key" email="test@example.com" />)

    await waitFor(() => {
      expect(mockSocket.send).toHaveBeenCalledWith(JSON.stringify({
        type: 'initial',
        embeddingKey: 'test-key',
        email: 'test@example.com'
      }))
    })
  })

  it('handles incoming WebSocket messages correctly', async () => {
    render(<ChatInterface embeddingKey="test-key" email="test@example.com" />)

    await waitFor(() => {
      expect(mockSocket.onmessage).toBeDefined()
    })

    act(() => {
      mockSocket.onmessage({ data: JSON.stringify({ type: 'typing' }) })
    })

    await waitFor(() => {
      expect(screen.getByText(/Typing.../)).toBeInTheDocument()
    })

    act(() => {
      mockSocket.onmessage({ data: JSON.stringify({ 
        type: 'message', 
        content: 'Test message' 
      }) })
    })

    await waitFor(() => {
      const messages = screen.getAllByText(/Test message/)
      expect(messages[messages.length - 1]).toHaveTextContent('Test message')
      expect(screen.queryByText(/Typing.../)).not.toBeInTheDocument()
    })
  })

  it('sends user messages and updates conversation', async () => {
    render(<ChatInterface embeddingKey="test-key" email="test@example.com" />)

    await waitFor(() => {
      expect(mockSocket.send).toBeDefined()
    })

    const input = screen.getByPlaceholderText(/type your message/i)
    const form = screen.getByRole('form', { hidden: true })
    
    fireEvent.change(input, { target: { value: 'New message' } })
    fireEvent.submit(form)

    await waitFor(() => {
      expect(mockSocket.send).toHaveBeenCalledWith(JSON.stringify({
        type: 'message',
        content: 'New message',
        embeddingKey: 'test-key',
        email: 'test@example.com'
      }))
      const messages = screen.getAllByText(/New message/)
      expect(messages[messages.length - 1]).toHaveTextContent('New message')
    })
  })

  it('checks for initial message from API', async () => {
    render(<ChatInterface embeddingKey="test-key" email="test@example.com" />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/check-email?email=${encodeURIComponent('test@example.com')}`
      )
    })

    await waitFor(() => {
      const messages = screen.getAllByText((content, element) => {
        return element.textContent === 'Initial message'
      })
      expect(messages[messages.length - 1]).toHaveTextContent('Initial message')
    })
  })

  it('handles WebSocket disconnection', async () => {
    render(<ChatInterface embeddingKey="test-key" email="test@example.com" />)

    await waitFor(() => {
      expect(mockSocket.onclose).toBeDefined()
    })

    act(() => {
      mockSocket.onclose()
    })

    await waitFor(() => {
      expect(screen.getByText(/connection lost/i)).toBeInTheDocument()
    })
  })
}) 