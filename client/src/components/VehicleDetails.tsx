import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, MapPin, Activity, Fuel, Calendar } from 'lucide-react';
import axios from 'axios';

interface VehicleDetails {
  id: number;
  vehicle_id: string;
  name: string;
  type: string;
  model?: string;
  year?: number;
  license_plate?: string;
  status: 'online' | 'offline';
  fuel_level: number;
  last_seen?: string;
  latitude?: number;
  longitude?: number;
  speed?: number;
  heading?: number;
  last_location_time?: string;
}

interface Route {
  id: number;
  vehicle_id: string;
  start_time: string;
  end_time: string;
  distance: number;
  avg_speed: number;
  max_speed: number;
  fuel_consumed: number;
}

const VehicleDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [vehicle, setVehicle] = useState<VehicleDetails | null>(null);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Główne pobieranie danych (pojazd + trasy)
  useEffect(() => {
    const fetchVehicleDetails = async () => {
      try {
        setLoading(true);
        const [vehicleResponse, routesResponse] = await Promise.all([
          axios.get(`/api/vehicles/${id}`),
          axios.get(`/api/routes/vehicle/${id}`)
        ]);
        setVehicle(vehicleResponse.data);
        setRoutes(routesResponse.data);
      } catch (err) {
        setError('Błąd podczas pobierania szczegółów pojazdu');
        console.error('Error fetching vehicle details:', err);
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchVehicleDetails();
    }
  }, [id]);

  // Automatyczne odświeżanie statusu i lokalizacji pojazdu
  useEffect(() => {
    if (!id) return;
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`/api/vehicles/${id}`);
        const updatedVehicle = response.data;
        
        // Nie aktualizuj last_seen dla pojazdów offline
        if (updatedVehicle.status === 'offline' && vehicle?.last_seen) {
          updatedVehicle.last_seen = vehicle.last_seen;
        }
        
        setVehicle(prev => ({ ...prev, ...updatedVehicle }));
      } catch (err) {
        // nie nadpisuj error globalnego
      }
    }, 3500);
    return () => clearInterval(interval);
  }, [id, vehicle?.last_seen]);

  if (loading) {
    return <div className="loading">Ładowanie szczegółów pojazdu...</div>;
  }

  if (error || !vehicle) {
    return <div className="error">{error || 'Pojazd nie znaleziony'}</div>;
  }

  return (
    <div>
      {/* Tylko przycisk powrotu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link to="/vehicles" className="nav-button" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowLeft size={16} />
          Powrót
        </Link>
      </div>

      <div className="dashboard-grid">
        {/* Podstawowe informacje */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Informacje podstawowe</h3>
            {/* Usunięto przyciski Edytuj i Usuń */}
          </div>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <strong>ID pojazdu:</strong> {vehicle.vehicle_id}
            </div>
            <div>
              <strong>Typ:</strong> {vehicle.type}
            </div>
            <div>
              <strong>Model:</strong> {vehicle.name || vehicle.model || 'Brak danych'}
            </div>
            <div>
              <strong>Rok produkcji:</strong> {vehicle.year || 'Brak danych'}
            </div>
            <div>
              <strong>Numer rejestracyjny:</strong> {vehicle.license_plate || 'Brak danych'}
            </div>
          </div>
        </div>

        {/* Status i lokalizacja */}
        <div className="card">
          <h3>Status i lokalizacja</h3>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={16} />
              <span><strong>Status:</strong></span>
              <div className={`vehicle-status status-${vehicle.status}`}>
                {['online', 'w ruchu', 'postój'].includes(vehicle.status) ? 'Online' : 'Offline'}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Fuel size={16} />
              <span><strong>Poziom paliwa:</strong> {typeof vehicle.fuel_level === 'number' ? vehicle.fuel_level.toFixed(1) + '%' : 'Brak danych'}</span>
            </div>
            {(typeof vehicle.speed === 'number') ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={16} />
                <span><strong>Prędkość:</strong> {vehicle.speed.toFixed(1)} km/h</span>
              </div>
            ) : null}
            {(typeof vehicle.latitude === 'number' && typeof vehicle.longitude === 'number') ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={16} />
                <span><strong>Lokalizacja:</strong> {vehicle.latitude.toFixed(4)}, {vehicle.longitude.toFixed(4)}</span>
              </div>
            ) : null}
            {vehicle.last_seen && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={16} />
                <span><strong>Ostatnio widziany:</strong> {new Date(vehicle.last_seen).toLocaleString('pl-PL')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Statystyki tras */}
        <div className="card">
          <h3>Statystyki tras</h3>
          {routes.length > 0 ? (
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <strong>Liczba tras:</strong> {routes.length}
              </div>
              <div>
                <strong>Całkowity dystans:</strong> {routes.reduce((sum, route) => sum + route.distance, 0).toFixed(1)} km
              </div>
              <div>
                <strong>Średnia prędkość:</strong> {routes.reduce((sum, route) => sum + route.avg_speed, 0) / routes.length} km/h
              </div>
              <div>
                <strong>Maksymalna prędkość:</strong> {Math.max(...routes.map(r => r.max_speed))} km/h
              </div>
              <div>
                <strong>Zużyte paliwo:</strong> {routes.reduce((sum, route) => sum + route.fuel_consumed, 0).toFixed(1)} L
              </div>
            </div>
          ) : (
            <div style={{ color: '#666', textAlign: 'center', padding: '1rem' }}>
              Brak danych o trasach
            </div>
          )}
        </div>
      </div>

      {/* Historia tras */}
      {routes.length > 0 && (
        <div className="card" style={{ marginTop: '2rem' }}>
          <h3>Historia tras</h3>
          <div className="vehicle-list">
            {routes.slice(0, 10).map(route => (
              <div key={route.id} className="vehicle-item">
                <div className="vehicle-info">
                  <div className="vehicle-name">
                    {new Date(route.start_time).toLocaleDateString('pl-PL')} - {new Date(route.end_time).toLocaleDateString('pl-PL')}
                  </div>
                  <div className="vehicle-details">
                    Dystans: {route.distance.toFixed(1)} km • Średnia prędkość: {route.avg_speed.toFixed(1)} km/h • 
                    Maksymalna prędkość: {route.max_speed.toFixed(1)} km/h • Zużyte paliwo: {route.fuel_consumed.toFixed(1)} L
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleDetails; 