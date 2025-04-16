import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import ChatInterface from '../../src/components/ChatInterface'
import { convertToMessageFormat } from '../../src/utils/format'

// Use fake timers
jest.useFakeTimers();

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
    this.readyState = WebSocket.OPEN // Assume open immediately for simplicity
    this.send = jest.fn()
    this.close = jest.fn()
    this.onopen = jest.fn()
    this.onclose = jest.fn()
    this.onmessage = jest.fn()
    
    mockSocket = this // Assign instance for test access
  }
}

MockWebSocket.OPEN = WebSocket.OPEN
MockWebSocket.CLOSED = WebSocket.CLOSED
global.WebSocket = MockWebSocket

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ hasPrevious: false }) 
  })
)

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn()

describe('ChatInterface', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.clear()
    // Create the mock socket instance before each test
    mockSocket = new MockWebSocket('ws://localhost')
    mockLocalStorage.getItem.mockReturnValue(null)
    global.fetch.mockClear()
    jest.clearAllTimers();
  })

  // Helper function to render with props
  const renderComponent = (props = {}) => {
    return render(
      <ChatInterface 
        socket={mockSocket}
        embeddingKey="test-key" 
        email="test@example.com" 
        {...props} 
      />
    )
  }

  it('renders without crashing', () => {
    renderComponent()
    expect(screen.getByPlaceholderText(/type your message/i)).toBeInTheDocument()
  })

  it('loads initial conversation from localStorage', async () => {
    const mockMessages = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there' }
    ]
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockMessages))

    renderComponent()
    
    await waitFor(() => {
      const messages = screen.getAllByText(/Hello|Hi there/)
      expect(messages).toHaveLength(2)
    })
    expect(global.fetch).not.toHaveBeenCalled()
    // Manually trigger onopen, but it shouldn't send due to localStorage data
    act(() => { mockSocket.onopen?.() });
    expect(mockSocket.send).not.toHaveBeenCalled()
  })

  it('handles WebSocket connection and sends initial message if no localStorage data', async () => {
    renderComponent()
    
    // Manually trigger onopen to simulate connection completing
    act(() => { 
      mockSocket.onopen?.(); 
    });

    // Now wait for the send call triggered by onopen
    await waitFor(() => {
      expect(mockSocket.send).toHaveBeenCalledWith(JSON.stringify({
        type: 'initial',
        embeddingKey: 'test-key',
        email: 'test@example.com'
      }))
    })
  })

  it('handles incoming WebSocket messages correctly', async () => {
    renderComponent()
    
    // Manually trigger onopen first
    act(() => { mockSocket.onopen?.(); });
    await waitFor(() => { expect(mockSocket.send).toHaveBeenCalledTimes(1); }); // Ensure connection established

    // Simulate initial response
    act(() => {
      mockSocket.onmessage({ data: JSON.stringify({ type: 'initial_response' }) })
    })
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })

    // Simulate typing indicator
    act(() => {
      mockSocket.onmessage({ data: JSON.stringify({ type: 'typing' }) })
    })
    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    // Simulate message stream
    act(() => {
      mockSocket.onmessage({ data: JSON.stringify({ type: 'stream', token: 'Test ' }) })
      mockSocket.onmessage({ data: JSON.stringify({ type: 'stream', token: 'message' }) })
    })
    await waitFor(() => {
      expect(screen.getByText(/Test message/)).toBeInTheDocument()
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })

    // Simulate stream end
    act(() => {
      mockSocket.onmessage({ data: JSON.stringify({ type: 'stream_end' }) })
    })
    await waitFor(() => {
      const messages = screen.getAllByText(/Test message/)
      expect(messages[messages.length - 1]).toHaveTextContent('Test message')
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
  })

  it('sends user messages and updates conversation', async () => {
    const { container } = renderComponent()

    // Manually trigger onopen and wait for initial send
    act(() => { mockSocket.onopen?.(); });
    await waitFor(() => {
      expect(mockSocket.send).toHaveBeenCalledTimes(1)
    })

    const input = screen.getByPlaceholderText(/type your message/i)
    // Find form using container query as getByRole seems problematic
    const form = container.querySelector('form') 
    expect(form).toBeInTheDocument() // Verify form is found
    
    fireEvent.change(input, { target: { value: 'New message' } })
    fireEvent.submit(form)

    // Check for the second send call
    await waitFor(() => {
      expect(mockSocket.send).toHaveBeenCalledTimes(2)
      expect(mockSocket.send).toHaveBeenNthCalledWith(2, JSON.stringify({
        question: 'New message',
        embeddingKey: 'test-key',
        email: 'test@example.com'
      }))
    })
    
    // User message should appear
    await waitFor(() => {
      const messages = screen.getAllByText(/New message/)
      expect(messages[messages.length - 1]).toHaveTextContent('New message')
    })
    expect(input).toHaveValue('')
  })

  it('checks for initial message from API if no localStorage', async () => {
    renderComponent()
    
    // Wait for the fetch call
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/check-email?email=${encodeURIComponent('test@example.com')}`
      )
    })
    
    // Trigger onopen just in case fetch result interacts with it
    act(() => { mockSocket.onopen?.(); });
    
    // Ensure no specific message from API mock appears
    await act(async () => { jest.advanceTimersByTime(10); });
    expect(screen.queryByText('Initial message')).not.toBeInTheDocument(); 
  })

  it('handles WebSocket disconnection', async () => {
    renderComponent()

    // Manually trigger onopen 
    act(() => { mockSocket.onopen?.(); });
    await waitFor(() => { expect(mockSocket.send).toHaveBeenCalledTimes(1); });
    
    // Ensure onclose is assigned
    expect(mockSocket.onclose).toBeDefined()

    // Simulate close event and update readyState
    act(() => {
      // Set readyState before calling handler, as component checks it
      mockSocket.readyState = WebSocket.CLOSED 
      mockSocket.onclose()
    })

    // Advance timers past the 3-second delay
    act(() => {
      jest.runAllTimers();
    });

    // Check for the disconnection message
    await waitFor(() => {
      expect(screen.getByText(/Connection lost/i)).toBeInTheDocument()
      expect(screen.getByText(/Attempting to reconnect/i)).toBeInTheDocument()
    })
  })
}) 