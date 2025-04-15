export const setupWebSocket = (embeddingKey, onOpen, onError) => {
  if (!embeddingKey) return null

  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const wsUrl = `${wsProtocol}//${window.location.host}/ws`
  const socket = new WebSocket(wsUrl)
  
  socket.onopen = () => onOpen(socket)
  socket.onerror = onError

  return () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.close()
    }
  }
} 