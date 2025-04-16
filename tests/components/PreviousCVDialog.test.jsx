import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PreviousCVDialog from '../../src/components/PreviousCVDialog';

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

describe('PreviousCVDialog', () => {
  const mockPreviousCV = {
    uuid: 'test-uuid',
    filename: 'resume.pdf',
    created_at: '2023-01-01',
    summary: 'Software Engineer with 5 years of experience',
  };

  const mockOnStartNew = jest.fn();
  const mockOnResumePrevious = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the dialog when open is true', () => {
    render(
      <PreviousCVDialog
        open={true}
        previousCV={mockPreviousCV}
        onStartNew={mockOnStartNew}
        onResumePrevious={mockOnResumePrevious}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByTestId('mui-dialog')).toBeInTheDocument();
    expect(screen.getByText('Previous CV Found')).toBeInTheDocument();
    expect(screen.getByText(/We found your previously analyzed CV/i)).toBeInTheDocument();
    expect(screen.getByText('Start New')).toBeInTheDocument();
    expect(screen.getByText('Resume Previous')).toBeInTheDocument();
  });

  it('does not render the dialog when open is false', () => {
    render(
      <PreviousCVDialog
        open={false}
        previousCV={mockPreviousCV}
        onStartNew={mockOnStartNew}
        onResumePrevious={mockOnResumePrevious}
        onClose={mockOnClose}
      />
    );

    expect(screen.queryByText('Previous CV Found')).not.toBeInTheDocument();
  });

  it('displays the previous CV information', () => {
    render(
      <PreviousCVDialog
        open={true}
        previousCV={mockPreviousCV}
        onStartNew={mockOnStartNew}
        onResumePrevious={mockOnResumePrevious}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Previous CV Found')).toBeInTheDocument();
    expect(screen.getByText(mockPreviousCV.filename)).toBeInTheDocument();
    expect(screen.getByText(/Analyzed on/i)).toBeInTheDocument();
  });

  it('calls onStartNew when Start New button is clicked', () => {
    render(
      <PreviousCVDialog
        open={true}
        previousCV={mockPreviousCV}
        onStartNew={mockOnStartNew}
        onResumePrevious={mockOnResumePrevious}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText('Start New'));
    expect(mockOnStartNew).toHaveBeenCalled();
  });

  it('calls onResumePrevious when Resume Previous button is clicked', () => {
    render(
      <PreviousCVDialog
        open={true}
        previousCV={mockPreviousCV}
        onStartNew={mockOnStartNew}
        onResumePrevious={mockOnResumePrevious}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText('Resume Previous'));
    expect(mockOnResumePrevious).toHaveBeenCalled();
  });
}); 