import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { VehicleProvider, useVehicles } from '../contexts/VehicleContext';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Test component to access context
const TestComponent: React.FC = () => {
  const { vehicles, loading, error, fetchVehicles, updateVehicle, addVehicle, deleteVehicle } = useVehicles();
  
  return (
    <div>
      <div data-testid="loading">{loading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="error">{error || 'No Error'}</div>
      <div data-testid="vehicles-count">{vehicles.length}</div>
      <button onClick={() => fetchVehicles()}>Fetch</button>
      <button onClick={() => updateVehicle('V001', { name: 'Updated' })}>Update</button>
      <button onClick={() => addVehicle({ vehicle_id: 'V002', name: 'New', type: 'Truck', status: 'offline', fuel_level: 100 })}>Add</button>
      <button onClick={() => deleteVehicle('V001')}>Delete</button>
    </div>
  );
};

describe('VehicleContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('provides initial state', () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [] });
    
    render(
      <VehicleProvider>
        <TestComponent />
      </VehicleProvider>
    );
    
    expect(screen.getByTestId('loading')).toHaveTextContent('Loading');
    expect(screen.getByTestId('error')).toHaveTextContent('No Error');
    expect(screen.getByTestId('vehicles-count')).toHaveTextContent('0');
  });

  test('fetches vehicles on mount', async () => {
    const mockVehicles = [
      {
        id: 1,
        vehicle_id: 'V001',
        name: 'Truck 1',
        type: 'Ciężarówka',
        status: 'w ruchu' as const,
        fuel_level: 85
      }
    ];
    
    mockedAxios.get.mockResolvedValueOnce({ data: mockVehicles });
    
    render(
      <VehicleProvider>
        <TestComponent />
      </VehicleProvider>
    );
    
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/vehicles');
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
      expect(screen.getByTestId('vehicles-count')).toHaveTextContent('1');
    });
  });

  test('handles fetch error', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));
    
    render(
      <VehicleProvider>
        <TestComponent />
      </VehicleProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Błąd podczas pobierania pojazdów');
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });
  });

  test('allows manual fetch', async () => {
    mockedAxios.get.mockResolvedValue({ data: [] });
    
    render(
      <VehicleProvider>
        <TestComponent />
      </VehicleProvider>
    );
    
    const fetchButton = screen.getByText('Fetch');
    await act(async () => {
      fetchButton.click();
    });
    
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/vehicles');
  });

  test('updates vehicle', async () => {
    mockedAxios.get.mockResolvedValue({ data: [] });
    mockedAxios.put.mockResolvedValueOnce({ data: { message: 'Updated' } });
    
    render(
      <VehicleProvider>
        <TestComponent />
      </VehicleProvider>
    );
    
    const updateButton = screen.getByText('Update');
    await act(async () => {
      updateButton.click();
    });
    
    expect(mockedAxios.put).toHaveBeenCalledWith('/api/vehicles/V001', { name: 'Updated' });
    expect(mockedAxios.get).toHaveBeenCalled(); // Should refresh after update
  });

  test('adds vehicle', async () => {
    mockedAxios.get.mockResolvedValue({ data: [] });
    mockedAxios.post.mockResolvedValueOnce({ data: { message: 'Added' } });
    
    render(
      <VehicleProvider>
        <TestComponent />
      </VehicleProvider>
    );
    
    const addButton = screen.getByText('Add');
    await act(async () => {
      addButton.click();
    });
    
    expect(mockedAxios.post).toHaveBeenCalledWith('/api/vehicles', {
      vehicle_id: 'V002',
      name: 'New',
      type: 'Truck',
      status: 'offline',
      fuel_level: 100
    });
    expect(mockedAxios.get).toHaveBeenCalled(); // Should refresh after add
  });

  test('deletes vehicle', async () => {
    mockedAxios.get.mockResolvedValue({ data: [] });
    mockedAxios.delete.mockResolvedValueOnce({ data: { message: 'Deleted' } });
    
    render(
      <VehicleProvider>
        <TestComponent />
      </VehicleProvider>
    );
    
    const deleteButton = screen.getByText('Delete');
    await act(async () => {
      deleteButton.click();
    });
    
    expect(mockedAxios.delete).toHaveBeenCalledWith('/api/vehicles/V001');
    expect(mockedAxios.get).toHaveBeenCalled(); // Should refresh after delete
  });

  test('handles update error', async () => {
    mockedAxios.get.mockResolvedValue({ data: [] });
    mockedAxios.put.mockRejectedValueOnce(new Error('Update failed'));
    
    render(
      <VehicleProvider>
        <TestComponent />
      </VehicleProvider>
    );
    
    const updateButton = screen.getByText('Update');
    await act(async () => {
      updateButton.click();
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Błąd podczas aktualizacji pojazdu');
    });
  });

  test('handles add error', async () => {
    mockedAxios.get.mockResolvedValue({ data: [] });
    mockedAxios.post.mockRejectedValueOnce(new Error('Add failed'));
    
    render(
      <VehicleProvider>
        <TestComponent />
      </VehicleProvider>
    );
    
    const addButton = screen.getByText('Add');
    await act(async () => {
      addButton.click();
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Błąd podczas dodawania pojazdu');
    });
  });

  test('handles delete error', async () => {
    mockedAxios.get.mockResolvedValue({ data: [] });
    mockedAxios.delete.mockRejectedValueOnce(new Error('Delete failed'));
    
    render(
      <VehicleProvider>
        <TestComponent />
      </VehicleProvider>
    );
    
    const deleteButton = screen.getByText('Delete');
    await act(async () => {
      deleteButton.click();
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Błąd podczas usuwania pojazdu');
    });
  });

  test('sets up auto-refresh interval', async () => {
    mockedAxios.get.mockResolvedValue({ data: [] });
    
    render(
      <VehicleProvider>
        <TestComponent />
      </VehicleProvider>
    );
    
    // Initial fetch
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });
    
    // Advance timer to trigger interval
    act(() => {
      jest.advanceTimersByTime(3500);
    });
    
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });
  });

  test('cleans up interval on unmount', () => {
    mockedAxios.get.mockResolvedValue({ data: [] });
    
    const { unmount } = render(
      <VehicleProvider>
        <TestComponent />
      </VehicleProvider>
    );
    
    unmount();
    
    // Should not call axios after unmount
    act(() => {
      jest.advanceTimersByTime(3500);
    });
    
    expect(mockedAxios.get).toHaveBeenCalledTimes(1); // Only initial call
  });
});

describe('useVehicles hook', () => {
  test('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useVehicles must be used within a VehicleProvider');
    
    consoleSpy.mockRestore();
  });
}); 