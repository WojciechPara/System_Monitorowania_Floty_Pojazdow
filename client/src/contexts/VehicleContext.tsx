import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

export interface Vehicle {
  id: number;
  vehicle_id: string;
  name: string;
  type: string;
  model?: string;
  year?: number;
  license_plate?: string;
  status: 'online' | 'offline' | 'w ruchu' | 'postój';
  fuel_level: number;
  last_seen?: string;
  latitude?: number;
  longitude?: number;
  speed?: number;
  heading?: number;
  last_location_time?: string;
}

interface VehicleContextType {
  vehicles: Vehicle[];
  loading: boolean;
  error: string | null;
  fetchVehicles: () => Promise<void>;
  updateVehicle: (vehicleId: string, updates: Partial<Vehicle>) => Promise<void>;
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => Promise<void>;
  deleteVehicle: (vehicleId: string) => Promise<void>;
}

const VehicleContext = createContext<VehicleContextType | undefined>(undefined);

export const useVehicles = () => {
  const context = useContext(VehicleContext);
  if (context === undefined) {
    throw new Error('useVehicles must be used within a VehicleProvider');
  }
  return context;
};

interface VehicleProviderProps {
  children: ReactNode;
}

export const VehicleProvider: React.FC<VehicleProviderProps> = ({ children }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicles = async (showLoading = true) => {
    try {
      if (showLoading) {
      setLoading(true);
      }
      setError(null);
      const response = await axios.get('/api/vehicles');
      setVehicles(response.data);
    } catch (err) {
      setError('Błąd podczas pobierania pojazdów');
      console.error('Error fetching vehicles:', err);
    } finally {
      if (showLoading) {
      setLoading(false);
      }
    }
  };

  const updateVehicle = async (vehicleId: string, updates: Partial<Vehicle>) => {
    try {
      await axios.put(`/api/vehicles/${vehicleId}`, updates);
      await fetchVehicles(false); // Odśwież listę bez loading
    } catch (err) {
      setError('Błąd podczas aktualizacji pojazdu');
      console.error('Error updating vehicle:', err);
      throw err;
    }
  };

  const addVehicle = async (vehicle: Omit<Vehicle, 'id'>) => {
    try {
      await axios.post('/api/vehicles', vehicle);
      await fetchVehicles(false); // Odśwież listę bez loading
    } catch (err) {
      setError('Błąd podczas dodawania pojazdu');
      console.error('Error adding vehicle:', err);
      throw err;
    }
  };

  const deleteVehicle = async (vehicleId: string) => {
    try {
      await axios.delete(`/api/vehicles/${vehicleId}`);
      await fetchVehicles(false); // Odśwież listę bez loading
    } catch (err) {
      setError('Błąd podczas usuwania pojazdu');
      console.error('Error deleting vehicle:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchVehicles(true); // Pierwsze załadowanie z loading
    
    // Automatyczna aktualizacja co 3.5 sekundy (jak w Dashboard) - bez loading
    const interval = setInterval(() => fetchVehicles(false), 3500);
    
    return () => clearInterval(interval);
  }, []);

  const value: VehicleContextType = {
    vehicles,
    loading,
    error,
    fetchVehicles,
    updateVehicle,
    addVehicle,
    deleteVehicle,
  };

  return (
    <VehicleContext.Provider value={value}>
      {children}
    </VehicleContext.Provider>
  );
}; 