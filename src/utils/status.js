export const getStatusMessage = (status) => {
  switch (status) {
    case 'created':
      return 'CV received, awaiting confirmation...'
    case 'uploaded':
      return 'Processing your CV...'
    case 'processing':
      return 'Analyzing your CV...'
    case 'embedded':
      return 'Ready to chat about your CV!'
    case 'extracted':
      return 'Extracting information from your CV...'
    default:
      return 'Uploading your CV...'
  }
}

export const calculateProgress = (status, currentProgress, highestProgress) => {
  let targetProgress
  switch (status) {
    case 'created':
      targetProgress = 25
      break
    case 'uploaded':
      targetProgress = 50
      break
    case 'extracted':
      targetProgress = 65
      break
    case 'processing':
      targetProgress = 75
      break
    case 'embedded':
      targetProgress = 100
      break
    default:
      targetProgress = highestProgress
  }
  
  return Math.max(targetProgress, highestProgress)
}

export const formatConversation = (conversation) => {
  if (!conversation || !Array.isArray(conversation)) return []
  
  return conversation.map(msg => ({
    text: msg.content,
    isBot: msg.role === 'assistant'
  }))
} 