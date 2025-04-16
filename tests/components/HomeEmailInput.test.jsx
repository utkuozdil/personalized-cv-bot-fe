import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HomeEmailInput from '../../src/components/HomeEmailInput';

describe('HomeEmailInput', () => {
  const mockHandleEmailChange = jest.fn();
  const mockHandleEmailBlur = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders email input field', () => {
    render(
      <HomeEmailInput
        email=""
        emailError=""
        handleEmailChange={mockHandleEmailChange}
        handleEmailBlur={mockHandleEmailBlur}
      />
    );

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
  });

  it('displays error message when emailError is provided', () => {
    const errorMessage = 'Please enter a valid email address';
    render(
      <HomeEmailInput
        email=""
        emailError={errorMessage}
        handleEmailChange={mockHandleEmailChange}
        handleEmailBlur={mockHandleEmailBlur}
      />
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('calls handleEmailChange when input value changes', async () => {
    render(
      <HomeEmailInput
        email=""
        emailError=""
        handleEmailChange={mockHandleEmailChange}
        handleEmailBlur={mockHandleEmailBlur}
      />
    );

    const input = screen.getByLabelText(/email address/i);
    await userEvent.type(input, 'test@example.com');

    expect(mockHandleEmailChange).toHaveBeenCalled();
  });

  it('calls handleEmailBlur when input loses focus', () => {
    render(
      <HomeEmailInput
        email=""
        emailError=""
        handleEmailChange={mockHandleEmailChange}
        handleEmailBlur={mockHandleEmailBlur}
      />
    );

    const input = screen.getByLabelText(/email address/i);
    fireEvent.blur(input);

    expect(mockHandleEmailBlur).toHaveBeenCalled();
  });

  it('displays the provided email value', () => {
    const email = 'test@example.com';
    render(
      <HomeEmailInput
        email={email}
        emailError=""
        handleEmailChange={mockHandleEmailChange}
        handleEmailBlur={mockHandleEmailBlur}
      />
    );

    const input = screen.getByLabelText(/email address/i);
    expect(input.value).toBe(email);
  });
}); 