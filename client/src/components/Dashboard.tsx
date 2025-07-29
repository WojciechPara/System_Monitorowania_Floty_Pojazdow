import React, { useState, useEffect } from 'react';
import axios from 'axios';

const getFuelLevelLabel = (level: number) => {
  if (level <= 33) return { label: 'niski', color: 'red' };
  if (level <= 66) return { label: 'średni', color: 'orange' };
  return { label: 'wysoki', color: 'green' };
};

const Dashboard: React.FC = () => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    const fetchData = async () => {
      try {
        const response = await axios.get('/api/vehicles');
        setVehicles(response.data);
        setLoading(false);
      } catch (err) {
        setError('Błąd podczas pobierania danych z serwera');
        setLoading(false);
      }
    };
    fetchData();
    interval = setInterval(fetchData, 3500);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Ładowanie dashboardu...</div>;
  if (error) return <div className="error">{error}</div>;

  // Mapowanie statusów do online/offline
  const onlineVehicles = vehicles.filter(v => v.status === 'w ruchu' || v.status === 'postój').sort((a, b) => (a.license_plate || '').localeCompare(b.license_plate || ''));
  const offlineVehicles = vehicles.filter(v => v.status === 'offline').sort((a, b) => (a.license_plate || '').localeCompare(b.license_plate || ''));

  return (
    <div>
      <h2 className="page-title">Dashboard Floty</h2>
      <div className="dashboard-grid">
        {/* Pojazdy Online */}
        <div className="card">
          <h3>
            Pojazdy Online{' '}
            <span className="status-online" style={{ background: 'none' }}>(
              {onlineVehicles.length}
            )</span>
          </h3>
          <div className="vehicle-list">
            {onlineVehicles.map(v => (
              <div key={v.vehicle_id} className="vehicle-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 48, minHeight: 48 }}>
                <div className="vehicle-details" style={{ flex: 1, display: 'flex', alignItems: 'center' }}>{v.license_plate}</div>
                <div className={v.status === 'w ruchu' ? 'status-online' : 'status-offline'} style={{ fontWeight: 600, textAlign: 'right', minWidth: 80, background: 'none' }}>{v.status}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Pojazdy Offline */}
        <div className="card">
          <h3>
            Pojazdy Offline{' '}
            <span className="status-offline" style={{ background: 'none' }}>(
              {offlineVehicles.length}
            )</span>
          </h3>
          <div className="vehicle-list">
            {offlineVehicles.map(v => (
              <div key={v.vehicle_id} className="vehicle-item" style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', height: 48, minHeight: 48 }}>
                <div className="vehicle-details" style={{ flex: 1, display: 'flex', alignItems: 'center' }}>{v.license_plate}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Stan Paliwa */}
        <div className="card">
          <h3>Stan Paliwa</h3>
          <div className="vehicle-list">
            {vehicles.filter(v => v.status !== 'offline').sort((a, b) => (a.license_plate || '').localeCompare(b.license_plate || '')).map(v => {
              const { label } = getFuelLevelLabel(v.fuel_level);
              let labelClass = '';
              if (label === 'wysoki') labelClass = 'status-online';
              else if (label === 'niski') labelClass = 'status-offline';
              else if (label === 'średni') labelClass = 'status-medium';
              return (
                <div key={v.vehicle_id} className="vehicle-item" style={{ display: 'flex', alignItems: 'center', height: 48, minHeight: 48 }}>
                  <div className="vehicle-details" style={{ flex: 1, display: 'flex', alignItems: 'center' }}>{v.license_plate}</div>
                  <div className={labelClass} style={{ fontWeight: 700, textAlign: 'center', minWidth: 70, background: 'none' }}>{label}</div>
                  <div className="vehicle-status" style={{ fontWeight: 600, textAlign: 'right', minWidth: 60 }}>{v.fuel_level.toFixed(1)}%</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 