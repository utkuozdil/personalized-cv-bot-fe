export const convertToMessageFormat = (conversationItem) => {
    if ('text' in conversationItem) {
      // Already in message format
      return conversationItem
    }
    return {
      text: conversationItem.content,
      isBot: conversationItem.role === 'assistant',
      error: false,
      timestamp: conversationItem.timestamp
    }
  }