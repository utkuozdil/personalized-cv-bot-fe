import { validateEmail, checkPreviousCV, uploadCV, pollStatus } from '../../src/utils/cv'

// Mock fetch globally
global.fetch = jest.fn()

describe('CV Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('validateEmail', () => {
    it('returns true for valid email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('user.name@domain.co.uk')).toBe(true)
      expect(validateEmail('user+label@domain.com')).toBe(true)
    })

    it('returns false for invalid email addresses', () => {
      expect(validateEmail('invalid-email')).toBe(false)
      expect(validateEmail('@domain.com')).toBe(false)
      expect(validateEmail('user@')).toBe(false)
      expect(validateEmail('')).toBe(false)
    })
  })

  describe('checkPreviousCV', () => {
    it('returns the most recent CV when previous CVs exist', async () => {
      const mockResponse = {
        hasPrevious: true,
        resumes: [
          { created_at: '2023-01-01', uuid: 'old' },
          { created_at: '2023-02-01', uuid: 'new' }
        ]
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const result = await checkPreviousCV('test@example.com')
      expect(result).toEqual({ created_at: '2023-02-01', uuid: 'new' })
      expect(fetch).toHaveBeenCalledWith('/api/check-email?email=test%40example.com')
    })

    it('returns null when no previous CVs exist', async () => {
      const mockResponse = {
        hasPrevious: false,
        resumes: []
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const result = await checkPreviousCV('test@example.com')
      expect(result).toBeNull()
    })

    it('throws error when API call fails', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      })

      await expect(checkPreviousCV('test@example.com')).rejects.toThrow('Failed to check email: 500')
    })
  })

  describe('uploadCV', () => {
    const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' })
    const mockEmail = 'test@example.com'

    it('successfully uploads a CV file', async () => {
      const mockUploadUrl = 'https://example.com/upload'
      const mockUuid = '123'

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ upload_url: mockUploadUrl, uuid: mockUuid })
        })
        .mockResolvedValueOnce({
          ok: true
        })

      const result = await uploadCV(mockFile, mockEmail)
      expect(result).toBe(mockUuid)
      expect(fetch).toHaveBeenCalledTimes(2)
    })

    it('throws error when getting upload URL fails', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      })

      await expect(uploadCV(mockFile, mockEmail)).rejects.toThrow('Failed to get upload URL: 500')
    })

    it('throws error when upload fails', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ upload_url: 'https://example.com/upload', uuid: '123' })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500
        })

      await expect(uploadCV(mockFile, mockEmail)).rejects.toThrow('Failed to upload file: 500')
    })
  })

  describe('pollStatus', () => {
    it('successfully polls status', async () => {
      const mockResponse = { status: 'processing' }
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const result = await pollStatus('123')
      expect(result).toEqual(mockResponse)
      expect(fetch).toHaveBeenCalledWith('/api/status/123')
    })

    it('throws error when status check fails', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      })

      await expect(pollStatus('123')).rejects.toThrow('Status check failed: 500')
    })
  })
}) 