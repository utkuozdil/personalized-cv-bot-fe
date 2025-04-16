import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import About from '../../src/pages/About'

describe('About Page', () => {
  it('renders the header', () => {
    render(<About />)
    expect(screen.getByText('About CV Chat Assistant')).toBeInTheDocument()
    expect(screen.getByText(/your intelligent companion/i)).toBeInTheDocument()
  })

  it('renders all feature cards', () => {
    render(<About />)
    
    // Check feature titles
    expect(screen.getByText('CV Analysis')).toBeInTheDocument()
    expect(screen.getByText('Interactive Chat')).toBeInTheDocument()
    expect(screen.getByText('Smart Insights')).toBeInTheDocument()
    expect(screen.getByText('Secure Processing')).toBeInTheDocument()
    
    // Check feature descriptions using more specific text
    expect(screen.getByText(/let our AI analyze your professional experience/i)).toBeInTheDocument()
    expect(screen.getByText(/engage in natural conversations/i)).toBeInTheDocument()
    expect(screen.getByText(/get personalized insights/i)).toBeInTheDocument()
    expect(screen.getByText(/your cv is processed securely/i)).toBeInTheDocument()
  })

  it('renders the how it works section', () => {
    render(<About />)
    
    expect(screen.getByText('How It Works')).toBeInTheDocument()
    
    const steps = screen.getAllByTestId('step-item')
    expect(steps).toHaveLength(3)
    
    expect(screen.getByText(/upload your cv in pdf format through our secure interface/i)).toBeInTheDocument()
    expect(screen.getByText(/our ai processes and analyzes/i)).toBeInTheDocument()
    expect(screen.getByText(/start chatting and get detailed insights/i)).toBeInTheDocument()
  })

  it('renders step numbers correctly', () => {
    render(<About />)
    
    const stepNumbers = screen.getAllByText(/^[1-3]$/)
    expect(stepNumbers).toHaveLength(3)
    expect(stepNumbers[0]).toHaveTextContent('1')
    expect(stepNumbers[1]).toHaveTextContent('2')
    expect(stepNumbers[2]).toHaveTextContent('3')
  })
}) 