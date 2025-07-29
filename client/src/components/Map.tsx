import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import { useVehicles } from '../contexts/VehicleContext';
import { useSocket } from '../contexts/SocketContext';
import { useLocation } from 'react-router-dom';

// Nowe ikony pojazdów
const vehicleIcons = {
  moving: new Icon({
    iconUrl: '/green_truck.png',
    iconSize: [null as any, 35], // szerokość automatyczna, wysokość 50
    iconAnchor: [25, 25], // anchor zostanie poprawiony poniżej
  }),
  stopped: new Icon({
    iconUrl: '/red_truck.png',
    iconSize: [null as any, 35],
    iconAnchor: [25, 25],
  })
};

// Poprawka anchor: po załadowaniu obrazka ustawiamy anchor na środek obrazu
function getVehicleIcon(status: string) {
  const icon = status === 'w ruchu' ? vehicleIcons.moving : vehicleIcons.stopped;
  const img = new window.Image();
  img.src = icon.options.iconUrl;
  img.onload = function() {
    icon.options.iconSize = [img.width * (35 / img.height), 35];
    icon.options.iconAnchor = [icon.options.iconSize[0] / 2, 0]; // środek góry ikony
  };
  return icon;
}

// Komponent do aktualizacji mapy - wyłączony automatyczny fitBounds
const MapUpdater: React.FC<{ vehicles: any[] }> = ({ vehicles }) => {
  // Wyłączamy automatyczne dopasowywanie widoku mapy
  // Dzięki temu użytkownik może swobodnie zoomować i przesuwać mapę
  return null;
};

// Komponent do aktualizacji pozycji markerów
const MarkerUpdater: React.FC<{ vehicles: any[] }> = ({ vehicles }) => {
  const map = useMap();
  
  useEffect(() => {
    // Aktualizuj pozycje markerów bez przeładowywania mapy
    vehicles.forEach(vehicle => {
      if (vehicle.latitude && vehicle.longitude) {
        // Leaflet automatycznie zaktualizuje pozycję markera
        // bez przeładowywania całej mapy
      }
    });
  }, [vehicles, map]);
  
  return null;
};

// Komponent do centrowania i otwierania popupu na markerze
const FlyToAndOpenPopup: React.FC<{ lat: number, lng: number, zoom: number, vehicleId: string }> = ({ lat, lng, zoom, vehicleId }) => {
  const map = useMap();
  const [popupOpened, setPopupOpened] = useState(false);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    map.setView([lat, lng], zoom, { animate: true });
    setTimeout(() => {
      if (markerRef.current) {
        markerRef.current.openPopup();
        setPopupOpened(true);
      }
    }, 500);
  }, [lat, lng, zoom, map]);

  return null;
};

const Map: React.FC = () => {
  const { vehicles, loading, error } = useVehicles();
  const { socket, isConnected } = useSocket();
  const [realTimeVehicles, setRealTimeVehicles] = useState<any[]>([]);
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const latParam = params.get('lat');
  const lngParam = params.get('lng');
  const zoomParam = params.get('zoom');
  const [popupVehicleId, setPopupVehicleId] = useState<string | null>(null);

  useEffect(() => {
    if (socket) {
      socket.on('location_update', (data) => {
        setRealTimeVehicles(prev => {
          const existing = prev.find(v => v.vehicle_id === data.vehicle_id);
          if (existing) {
            // Aktualizuj tylko pozycję i dane, nie cały obiekt
            return prev.map(v => 
              v.vehicle_id === data.vehicle_id ? { 
                ...v, 
                latitude: data.latitude,
                longitude: data.longitude,
                speed: data.speed,
                fuel_level: data.fuel_level,
                heading: data.heading,
                timestamp: data.timestamp
              } : v
            );
          } else {
            return [...prev, data];
          }
        });
      });

      return () => {
        socket.off('location_update');
      };
    }
  }, [socket]);

  // Łączymy dane z API z danymi w czasie rzeczywistym
  const vehiclesWithLocation = vehicles.filter(v => v.latitude && v.longitude && v.status !== 'offline');
  const displayVehicles = vehiclesWithLocation.map(vehicle => {
    const realTimeData = realTimeVehicles.find(rt => rt.vehicle_id === vehicle.vehicle_id);
    if (realTimeData) {
      // Używamy danych z WebSocket, ale zachowujemy dane z API jako fallback
      return {
        ...vehicle,
        latitude: realTimeData.latitude,
        longitude: realTimeData.longitude,
        speed: realTimeData.speed,
        fuel_level: realTimeData.fuel_level,
        // Status na podstawie prędkości z WebSocket
        status: realTimeData.speed > 0 ? 'w ruchu' : 'postój'
      };
    }
    return vehicle;
  });

  useEffect(() => {
    if (latParam && lngParam && zoomParam) {
      // Znajdź pojazd o tych współrzędnych
      const found = displayVehicles.find(v =>
        Math.abs(v.latitude - parseFloat(latParam)) < 0.0001 &&
        Math.abs(v.longitude - parseFloat(lngParam)) < 0.0001
      );
      if (found) setPopupVehicleId(found.vehicle_id);
    } else {
      setPopupVehicleId(null);
    }
  }, [latParam, lngParam, zoomParam, displayVehicles]);

  if (loading) {
    return <div className="loading">Ładowanie mapy...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div>
      <h2 className="page-title">Mapa Floty</h2>
      <div className="card map-card">
        <div style={{ marginBottom: '1rem', marginLeft: '15px', display: 'flex', alignItems: 'center' }}>
          <span style={{ 
            display: 'inline-block', 
            width: '10px', 
            height: '10px', 
            borderRadius: '50%', 
            backgroundColor: isConnected ? '#28a745' : '#dc3545',
            marginRight: '0.5rem'
          }}></span>
          Status połączenia: {isConnected ? 'Połączony' : 'Rozłączony'}
        </div>
        
        <div className="map-container">
          <MapContainer
            center={[latParam && lngParam ? parseFloat(latParam) : 52.0, latParam && lngParam ? parseFloat(lngParam) : 19.0]}
            zoom={zoomParam ? parseInt(zoomParam) : 6}
            minZoom={6}
            maxZoom={16}
            maxBounds={[
              [48.95, 13.95], // Południowo-zachodni róg Polski (lekko poza granicą)
              [55.10, 24.15]  // Północno-wschodni róg Polski (lekko poza granicą)
            ]}
            bounds={[[48.95, 13.95], [55.10, 24.15]]}
            maxBoundsViscosity={1}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            
            <MapUpdater vehicles={displayVehicles} />
            <MarkerUpdater vehicles={displayVehicles} />
            {latParam && lngParam && zoomParam && popupVehicleId && (
              <FlyToAndOpenPopup lat={parseFloat(latParam)} lng={parseFloat(lngParam)} zoom={parseInt(zoomParam)} vehicleId={popupVehicleId} />
            )}
            {displayVehicles.map((vehicle) => (
              <Marker
                key={`vehicle-${vehicle.vehicle_id}`}
                position={[vehicle.latitude, vehicle.longitude]}
                icon={getVehicleIcon(vehicle.status)}
                ref={el => {
                  if (popupVehicleId === vehicle.vehicle_id && el) {
                    setTimeout(() => el.openPopup(), 600);
                  }
                }}
              >
                <Popup offset={[0, -10]}>
                  <div>
                    <h4>{vehicle.license_plate}</h4>
                    <p><h4>{vehicle.name}</h4></p>
                    <p><strong>Status:</strong> {vehicle.status}</p>
                    <p><strong>Prędkość:</strong> {vehicle.speed ? vehicle.speed.toFixed(1) : '0.0'} km/h</p>
                    <p><strong>Paliwo:</strong> {vehicle.fuel_level ? vehicle.fuel_level.toFixed(1) : '0.0'}%</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default Map; 