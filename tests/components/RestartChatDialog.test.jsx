import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import RestartChatDialog from '../../src/components/RestartChatDialog';

// Mock Material-UI Dialog
jest.mock('@mui/material', () => ({
  Dialog: ({ children, open }) => (
    open ? <div data-testid="mui-dialog">{children}</div> : null
  ),
  DialogTitle: ({ children }) => <div data-testid="mui-dialog-title">{children}</div>,
  DialogContent: ({ children }) => <div data-testid="mui-dialog-content">{children}</div>,
  DialogActions: ({ children }) => <div data-testid="mui-dialog-actions">{children}</div>,
  Button: ({ children, onClick }) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

describe('RestartChatDialog', () => {
  const mockOnCancel = jest.fn();
  const mockOnRestart = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the dialog when open is true', () => {
    render(
      <RestartChatDialog
        open={true}
        onClose={mockOnClose}
        onCancel={mockOnCancel}
        onRestart={mockOnRestart}
      />
    );

    expect(screen.getByTestId('mui-dialog')).toBeInTheDocument();
    expect(screen.getByText('Start New Chat?')).toBeInTheDocument();
    expect(screen.getByText(/You're about to leave the current chat and start over/i)).toBeInTheDocument();
    expect(screen.getByText('Continue Chat')).toBeInTheDocument();
    expect(screen.getByText('Start New CV')).toBeInTheDocument();
  });

  it('does not render the dialog when open is false', () => {
    render(
      <RestartChatDialog
        open={false}
        onClose={mockOnClose}
        onCancel={mockOnCancel}
        onRestart={mockOnRestart}
      />
    );

    expect(screen.queryByText('Start New Chat?')).not.toBeInTheDocument();
  });

  it('calls onCancel when Continue Chat button is clicked', () => {
    render(
      <RestartChatDialog
        open={true}
        onClose={mockOnClose}
        onCancel={mockOnCancel}
        onRestart={mockOnRestart}
      />
    );

    fireEvent.click(screen.getByText('Continue Chat'));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('calls onRestart when Start New CV button is clicked', () => {
    render(
      <RestartChatDialog
        open={true}
        onClose={mockOnClose}
        onCancel={mockOnCancel}
        onRestart={mockOnRestart}
      />
    );

    fireEvent.click(screen.getByText('Start New CV'));
    expect(mockOnRestart).toHaveBeenCalled();
  });
}); 