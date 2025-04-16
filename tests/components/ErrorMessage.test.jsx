import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorMessage from '../../src/components/ErrorMessage';

describe('ErrorMessage', () => {
  const mockOnTryAgain = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders error message with the provided message', () => {
    const errorMessage = 'An error occurred while processing your CV';
    render(
      <ErrorMessage
        message={errorMessage}
        onTryAgain={mockOnTryAgain}
      />
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('renders the try again button', () => {
    render(
      <ErrorMessage
        message="An error occurred"
        onTryAgain={mockOnTryAgain}
      />
    );

    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('calls onTryAgain when the try again button is clicked', () => {
    render(
      <ErrorMessage
        message="An error occurred"
        onTryAgain={mockOnTryAgain}
      />
    );

    const tryAgainButton = screen.getByText('Try Again');
    fireEvent.click(tryAgainButton);

    expect(mockOnTryAgain).toHaveBeenCalledTimes(1);
  });

  it('renders the error icon', () => {
    render(
      <ErrorMessage
        message="An error occurred"
        onTryAgain={mockOnTryAgain}
      />
    );

    // The icon is rendered as an SVG, so we can check for its container
    const iconContainer = screen.getByTestId('error-icon-container');
    expect(iconContainer).toBeInTheDocument();
  });
}); 