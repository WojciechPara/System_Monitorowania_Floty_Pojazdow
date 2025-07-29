import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useVehicles } from '../contexts/VehicleContext';
import { Search, Filter, Plus } from 'lucide-react';

const VehicleList: React.FC = () => {
  const { vehicles, loading, error } = useVehicles();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const navigate = useNavigate();

  if (loading) {
    return <div className="loading">Ładowanie pojazdów...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  const filteredVehicles = vehicles.filter(vehicle => {
    const searchText = searchTerm.toLowerCase();
    const matchesSearch = vehicle.name.toLowerCase().includes(searchText) ||
                         vehicle.license_plate?.toLowerCase().includes(searchText) ||
                         vehicle.vehicle_id.toLowerCase().includes(searchText);
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'online' && (vehicle.status === 'w ruchu' || vehicle.status === 'postój')) ||
                         (statusFilter === 'offline' && vehicle.status === 'offline');
    const matchesType = typeFilter === 'all' || vehicle.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  }).sort((a, b) => (a.license_plate || '').localeCompare(b.license_plate || ''));

  const uniqueTypes = Array.from(new Set(vehicles.map(v => v.type)));

  // Liczba pojazdów online/offline
  const onlineCount = vehicles.filter(v => v.status === 'w ruchu' || v.status === 'postój').length;
  const offlineCount = vehicles.filter(v => v.status === 'offline').length;

  return (
    <div>
      <h2 className="page-title">Lista Pojazdów</h2>

      {/* Filtry */}
      <div className="search-bar-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
            <input
              type="text"
              placeholder="Szukaj pojazdów..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            style={{
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '1rem'
            }}
          >
            <option value="all">Wszystkie statusy</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </select>
          
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '1rem'
            }}
          >
            <option value="all">Wszystkie typy</option>
            {uniqueTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista pojazdów */}
      <div className="card vehicle-list-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>Pojazdy ({filteredVehicles.length})</h3>
          <div style={{ fontSize: '0.9rem', color: '#666' }}>
            {onlineCount} online, {offlineCount} offline
          </div>
        </div>
        
        <div className="vehicle-list">
          {filteredVehicles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
              Brak pojazdów spełniających kryteria wyszukiwania
            </div>
          ) : (
            filteredVehicles.map(vehicle => (
              <Link 
                key={vehicle.vehicle_id} 
                to={`/vehicles/${vehicle.vehicle_id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="vehicle-item" style={{ cursor: 'pointer' }}>
                  <div className="vehicle-info">
                    <div className="vehicle-name">{vehicle.name}</div>
                    <div className="vehicle-details">
                      {vehicle.license_plate || vehicle.vehicle_id} • {vehicle.type} • {vehicle.model}
                      {vehicle.year && ` • ${vehicle.year}`}
                    </div>
                    {/* Lokalizacja tylko raz! */}
                    {vehicle.latitude && vehicle.longitude && (
                      <span
                        className="vehicle-location-link"
                        title="Pokaż na mapie"
                        onClick={e => {
                          e.preventDefault();
                          navigate(`/map?lat=${vehicle.latitude}&lng=${vehicle.longitude}&zoom=16`);
                        }}
                        style={{ cursor: 'pointer', padding: '2px 6px', borderRadius: '6px', transition: 'background 0.2s', display: 'inline-block' }}
                      >
                        📍 {vehicle.latitude.toFixed(4)}, {vehicle.longitude.toFixed(4)}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                    <div className={`vehicle-status status-${vehicle.status === 'w ruchu' || vehicle.status === 'postój' ? 'online' : 'offline'}`}>
                      {vehicle.status === 'w ruchu' || vehicle.status === 'postój' ? 'Online' : 'Offline'}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>
                      ⛽ {vehicle.fuel_level.toFixed(1)}%
                    </div>
                    {/* Prędkość i status ruchu/postoju */}
                    {vehicle.status === 'w ruchu' && vehicle.speed && vehicle.speed > 0 && (
                      <div style={{ fontSize: '0.9rem', color: '#666' }}>
                        🚗 w ruchu: {vehicle.speed.toFixed(1)} km/h
                      </div>
                    )}
                    {vehicle.status === 'postój' && (
                      <div style={{ fontSize: '0.9rem', color: '#666' }}>
                        postój
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleList; 