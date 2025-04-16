import { getStatusMessage, calculateProgress } from '../../src/utils/status'

describe('Status Utils', () => {
  describe('getStatusMessage', () => {
    it('returns correct message for created status', () => {
      expect(getStatusMessage('created')).toBe('CV received, awaiting confirmation...')
    })

    it('returns correct message for uploaded status', () => {
      expect(getStatusMessage('uploaded')).toBe('Processing your CV...')
    })

    it('returns correct message for processing status', () => {
      expect(getStatusMessage('processing')).toBe('Analyzing your CV...')
    })

    it('returns correct message for embedded status', () => {
      expect(getStatusMessage('embedded')).toBe('Ready to chat about your CV!')
    })

    it('returns correct message for extracted status', () => {
      expect(getStatusMessage('extracted')).toBe('Extracting information from your CV...')
    })

    it('returns default message for unknown status', () => {
      expect(getStatusMessage('unknown')).toBe('Uploading your CV...')
    })
  })

  describe('calculateProgress', () => {
    it('returns correct progress for created status', () => {
      expect(calculateProgress('created', 0, 0)).toBe(25)
    })

    it('returns correct progress for uploaded status', () => {
      expect(calculateProgress('uploaded', 0, 0)).toBe(50)
    })

    it('returns correct progress for extracted status', () => {
      expect(calculateProgress('extracted', 0, 0)).toBe(65)
    })

    it('returns correct progress for processing status', () => {
      expect(calculateProgress('processing', 0, 0)).toBe(75)
    })

    it('returns correct progress for embedded status', () => {
      expect(calculateProgress('embedded', 0, 0)).toBe(100)
    })

    it('returns highest progress for unknown status', () => {
      expect(calculateProgress('unknown', 0, 50)).toBe(50)
    })

    it('never decreases progress', () => {
      expect(calculateProgress('created', 50, 50)).toBe(50)
      expect(calculateProgress('uploaded', 75, 75)).toBe(75)
    })
  })
}) 