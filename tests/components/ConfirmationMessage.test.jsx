import React from 'react';
import { render, screen } from '@testing-library/react';
import ConfirmationMessage from '../../src/components/ConfirmationMessage';

describe('ConfirmationMessage', () => {
  const mockGetStatusMessage = jest.fn().mockReturnValue('Processing your CV...');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders confirmation message when status is created', () => {
    render(
      <ConfirmationMessage
        status="created"
        getStatusMessage={mockGetStatusMessage}
      />
    );

    expect(screen.getByText('Confirmation Required')).toBeInTheDocument();
    expect(screen.getByText('Please check your email and click the confirmation link to continue.')).toBeInTheDocument();
  });

  it('renders loading spinner with status message when status is not created', () => {
    render(
      <ConfirmationMessage
        status="uploaded"
        getStatusMessage={mockGetStatusMessage}
      />
    );

    expect(mockGetStatusMessage).toHaveBeenCalledWith('uploaded');
  });

  it('renders the envelope icon when status is created', () => {
    render(
      <ConfirmationMessage
        status="created"
        getStatusMessage={mockGetStatusMessage}
      />
    );

    // The icon is rendered as an SVG, so we can check for its container
    const iconContainer = screen.getByTestId('envelope-icon-container');
    expect(iconContainer).toBeInTheDocument();
  });
}); 