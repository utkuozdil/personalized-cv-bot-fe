import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../../src/components/LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with default message', () => {
    render(<LoadingSpinner />);
    expect(screen.getByText('Processing your CV...')).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    const customMessage = 'Uploading your CV...';
    render(<LoadingSpinner message={customMessage} />);
    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  it('renders the spinner animation', () => {
    render(<LoadingSpinner />);
    const spinnerContainer = screen.getByTestId('spinner-container');
    expect(spinnerContainer).toBeInTheDocument();
  });

  it('shows correct step based on message', () => {
    const { rerender } = render(<LoadingSpinner message="Uploading your CV..." />);
    expect(screen.getByText('Step 1 of 4')).toBeInTheDocument();

    rerender(<LoadingSpinner message="Extracting information..." />);
    expect(screen.getByText('Step 2 of 4')).toBeInTheDocument();

    rerender(<LoadingSpinner message="Analyzing your CV..." />);
    expect(screen.getByText('Step 3 of 4')).toBeInTheDocument();

    rerender(<LoadingSpinner message="Finalizing..." />);
    expect(screen.getByText('Step 4 of 4')).toBeInTheDocument();
  });
}); 