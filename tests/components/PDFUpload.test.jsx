import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PDFUpload from '../../src/components/PDFUpload';

// Mock the react-dropzone hook
jest.mock('react-dropzone', () => ({
  useDropzone: () => ({
    getRootProps: () => ({
      'data-testid': 'dropzone',
      onClick: jest.fn(),
    }),
    getInputProps: () => ({
      'data-testid': 'file-input',
      onChange: jest.fn(),
    }),
    isDragActive: false,
    open: jest.fn(),
  }),
}));

describe('PDFUpload', () => {
  const mockOnFileSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the upload area', () => {
    render(<PDFUpload onFileSelect={mockOnFileSelect} />);
    
    expect(screen.getByTestId('dropzone')).toBeInTheDocument();
    expect(screen.getByTestId('file-input')).toBeInTheDocument();
  });

  it('displays the upload instructions', () => {
    render(<PDFUpload onFileSelect={mockOnFileSelect} />);
    
    expect(screen.getByText(/Upload your CV/i)).toBeInTheDocument();
    expect(screen.getByText(/Drag and drop your PDF here, or/i)).toBeInTheDocument();
    expect(screen.getByText(/browse to upload/i)).toBeInTheDocument();
  });

  it('displays the file size limit', () => {
    render(<PDFUpload onFileSelect={mockOnFileSelect} />);
    
    expect(screen.getByText(/Maximum file size: 10MB/i)).toBeInTheDocument();
  });
}); 