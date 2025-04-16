import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import Contact from '../../src/pages/Contact'

describe('Contact Page', () => {
  it('renders the main heading with name and title', () => {
    render(<Contact />)
    expect(screen.getByText('Muammer Utku Ozdil')).toBeInTheDocument()
    expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument()
  })

  it('renders contact information', () => {
    render(<Contact />)
    expect(screen.getByText('Ankara, Turkey')).toBeInTheDocument()
    expect(screen.getByText('utkuozdil@gmail.com')).toBeInTheDocument()
  })

  it('renders professional summary', () => {
    render(<Contact />)
    expect(screen.getByText(/Results-driven Senior Software Engineer/i)).toBeInTheDocument()
  })

  it('renders LinkedIn link with correct attributes', () => {
    render(<Contact />)
    const linkedinLink = screen.getByText('LinkedIn').closest('a')
    expect(linkedinLink).toHaveAttribute('href', 'https://www.linkedin.com/in/utkuozdil/')
    expect(linkedinLink).toHaveAttribute('target', '_blank')
    expect(linkedinLink).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders GitHub link with correct attributes', () => {
    render(<Contact />)
    const githubLink = screen.getByText('GitHub').closest('a')
    expect(githubLink).toHaveAttribute('href', 'https://github.com/utkuozdil')
    expect(githubLink).toHaveAttribute('target', '_blank')
    expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders social media descriptions', () => {
    render(<Contact />)
    expect(screen.getByText('Connect with me on LinkedIn')).toBeInTheDocument()
    expect(screen.getByText('Check out my projects and contributions')).toBeInTheDocument()
  })
}) 