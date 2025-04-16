import React from 'react';
import { render, screen } from '@testing-library/react';
import HomeHeader from '../../src/components/HomeHeader';

describe('HomeHeader', () => {
  it('renders the header with title and description', () => {
    render(<HomeHeader />);

    // Check for main title
    expect(screen.getByText('CV Chat Assistant')).toBeInTheDocument();

    // Check for description
    expect(screen.getByText(/Upload your CV and let AI help you explore your professional journey/i)).toBeInTheDocument();
  });

  it('renders the chat icon', () => {
    render(<HomeHeader />);
    
    // The icon is rendered as an SVG, so we can check for its container
    const iconContainer = screen.getByTestId('chat-icon-container');
    expect(iconContainer).toBeInTheDocument();
  });
}); 