/**
 * Validates an email address format
 * @param {string} email - The email address to validate
 * @returns {boolean} - True if the email format is valid
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Checks if a user has any previous CVs
 * @param {string} email - The user's email address
 * @returns {Promise<Object|null>} - The latest CV data if found, null otherwise
 */
export const checkPreviousCV = async (email) => {
  try {
    const url = `/api/check-email?email=${encodeURIComponent(email)}`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Failed to check email: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.hasPrevious && Array.isArray(data.resumes) && data.resumes.length > 0) {
      // Sort by created_at to get the most recent CV
      const sortedResumes = data.resumes.sort((a, b) => {
        return new Date(b.created_at) - new Date(a.created_at)
      })
      return sortedResumes[0]
    }
    return null
  } catch (error) {
    throw error
  }
}

/**
 * Uploads a CV file to the server
 * @param {File} file - The CV file to upload
 * @param {string} email - The user's email address
 * @returns {Promise<string>} - The UUID of the uploaded file
 */
export const uploadCV = async (file, email) => {
  const response = await fetch('/api/extract', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filename: file.name,
      email: email,
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to get upload URL: ${response.status}`)
  }

  const data = await response.json()
  if (!data.upload_url) {
    throw new Error('No upload URL received from server')
  }

  const { upload_url: uploadUrl, uuid } = data

  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type
    }
  })

  if (!uploadResponse.ok) {
    throw new Error(`Failed to upload file: ${uploadResponse.status}`)
  }

  return uuid
}

/**
 * Polls the server for the status of a CV processing job
 * @param {string} uuid - The UUID of the processing job
 * @returns {Promise<Object>} - The status data from the server
 */
export const pollStatus = async (uuid) => {
  try {
    console.log('Polling status for UUID:', uuid)
    const response = await fetch(`/api/status/${uuid}`)
    if (!response.ok) {
      throw new Error(`Status check failed: ${response.status}`)
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error polling status:', error)
    throw error
  }
} 