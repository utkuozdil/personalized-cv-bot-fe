import { convertToMessageFormat } from '../../src/utils/format'

describe('Format Utils', () => {
  describe('convertToMessageFormat', () => {
    it('returns the same object if already in message format', () => {
      const message = {
        text: 'Hello',
        isBot: true,
        error: false,
        timestamp: '2024-03-15'
      }
      expect(convertToMessageFormat(message)).toEqual(message)
    })

    it('converts conversation item to message format', () => {
      const conversationItem = {
        content: 'Hello',
        role: 'assistant',
        timestamp: '2024-03-15'
      }
      expect(convertToMessageFormat(conversationItem)).toEqual({
        text: 'Hello',
        isBot: true,
        error: false,
        timestamp: '2024-03-15'
      })
    })

    it('handles user messages correctly', () => {
      const conversationItem = {
        content: 'Hi there',
        role: 'user',
        timestamp: '2024-03-15'
      }
      expect(convertToMessageFormat(conversationItem)).toEqual({
        text: 'Hi there',
        isBot: false,
        error: false,
        timestamp: '2024-03-15'
      })
    })
  })
}) 