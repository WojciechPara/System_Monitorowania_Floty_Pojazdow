import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '../components/Login';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Login Component', () => {
  const mockOnLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('renders login form', () => {
    render(<Login onLogin={mockOnLogin} />);
    
    expect(screen.getByLabelText(/nazwa użytkownika/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/hasło/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /zaloguj się/i })).toBeInTheDocument();
  });

  test('allows user to input credentials', async () => {
    const user = userEvent.setup();
    render(<Login onLogin={mockOnLogin} />);
    
    const usernameInput = screen.getByLabelText(/nazwa użytkownika/i);
    const passwordInput = screen.getByLabelText(/hasło/i);
    
    await user.type(usernameInput, 'admin');
    await user.type(passwordInput, 'password123');
    
    expect(usernameInput).toHaveValue('admin');
    expect(passwordInput).toHaveValue('password123');
  });

  test('shows password toggle functionality', async () => {
    const user = userEvent.setup();
    render(<Login onLogin={mockOnLogin} />);
    
    const passwordInput = screen.getByLabelText(/hasło/i);
    const toggleButton = screen.getByLabelText(/pokaż hasło/i);
    
    // Initially password should be hidden
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Click toggle to show password
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText(/ukryj hasło/i)).toBeInTheDocument();
    
    // Click toggle to hide password again
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText(/pokaż hasło/i)).toBeInTheDocument();
  });

  test('handles successful login', async () => {
    const user = userEvent.setup();
    mockedAxios.post.mockResolvedValueOnce({
      data: { success: true, token: 'mock-token' }
    });
    
    render(<Login onLogin={mockOnLogin} />);
    
    const usernameInput = screen.getByLabelText(/nazwa użytkownika/i);
    const passwordInput = screen.getByLabelText(/hasło/i);
    const submitButton = screen.getByRole('button', { name: /zaloguj się/i });
    
    await user.type(usernameInput, 'admin');
    await user.type(passwordInput, 'admin');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/login', {
        username: 'admin',
        password: 'admin'
      });
    });
    
    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith('auth_token', 'mock-token');
      expect(mockOnLogin).toHaveBeenCalled();
    });
  });

  test('handles login error', async () => {
    const user = userEvent.setup();
    mockedAxios.post.mockRejectedValueOnce(new Error('Invalid credentials'));
    
    render(<Login onLogin={mockOnLogin} />);
    
    const usernameInput = screen.getByLabelText(/nazwa użytkownika/i);
    const passwordInput = screen.getByLabelText(/hasło/i);
    const submitButton = screen.getByRole('button', { name: /zaloguj się/i });
    
    await user.type(usernameInput, 'wrong');
    await user.type(passwordInput, 'wrong');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/nieprawidłowy login lub hasło/i)).toBeInTheDocument();
    });
    
    expect(mockOnLogin).not.toHaveBeenCalled();
  });

  test('shows loading state during login', async () => {
    const user = userEvent.setup();
    mockedAxios.post.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<Login onLogin={mockOnLogin} />);
    
    const usernameInput = screen.getByLabelText(/nazwa użytkownika/i);
    const passwordInput = screen.getByLabelText(/hasło/i);
    const submitButton = screen.getByRole('button', { name: /zaloguj się/i });
    
    await user.type(usernameInput, 'admin');
    await user.type(passwordInput, 'admin');
    await user.click(submitButton);
    
    expect(screen.getByText(/logowanie/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  test('prevents form submission with empty fields', async () => {
    const user = userEvent.setup();
    render(<Login onLogin={mockOnLogin} />);
    
    const submitButton = screen.getByRole('button', { name: /zaloguj się/i });
    
    // Try to submit without entering credentials
    await user.click(submitButton);
    
    expect(mockedAxios.post).not.toHaveBeenCalled();
    expect(mockOnLogin).not.toHaveBeenCalled();
  });

  test('clears error message on new submission', async () => {
    const user = userEvent.setup();
    
    // First, trigger an error
    mockedAxios.post.mockRejectedValueOnce(new Error('Invalid credentials'));
    render(<Login onLogin={mockOnLogin} />);
    
    const usernameInput = screen.getByLabelText(/nazwa użytkownika/i);
    const passwordInput = screen.getByLabelText(/hasło/i);
    const submitButton = screen.getByRole('button', { name: /zaloguj się/i });
    
    await user.type(usernameInput, 'wrong');
    await user.type(passwordInput, 'wrong');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/nieprawidłowy login lub hasło/i)).toBeInTheDocument();
    });
    
    // Clear inputs and try again
    await user.clear(usernameInput);
    await user.clear(passwordInput);
    await user.type(usernameInput, 'admin');
    await user.type(passwordInput, 'admin');
    
    // Error should be cleared
    expect(screen.queryByText(/nieprawidłowy login lub hasło/i)).not.toBeInTheDocument();
  });
}); 