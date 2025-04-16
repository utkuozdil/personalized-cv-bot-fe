import React from 'react'

const formatMessage = (text) => {
  if (!text) return ''
  
  // Split text into paragraphs
  return text.split('\n').map((paragraph, index) => {
    if (!paragraph.trim()) return <br key={index} />
    return (
      <p key={index} className="mb-2 last:mb-0">
        {paragraph}
      </p>
    )
  })
}

export default formatMessage 