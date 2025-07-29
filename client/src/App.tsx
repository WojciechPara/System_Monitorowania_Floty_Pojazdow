import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useLocation, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Map from './components/Map';
import VehicleList from './components/VehicleList';
import VehicleDetails from './components/VehicleDetails';
import { VehicleProvider } from './contexts/VehicleContext';
import Login from './components/Login';

const Navigation: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;
  return (
    <div className="navigation">
      <Link to="/" className={`nav-button${isActive('/') ? ' active' : ''}`}>Dashboard</Link>
      <Link to="/map" className={`nav-button${isActive('/map') ? ' active' : ''}`}>Mapa</Link>
      <Link to="/vehicles" className={`nav-button${isActive('/vehicles') ? ' active' : ''}`}>Pojazdy</Link>
      <button onClick={onLogout} className="nav-button logout-button">Wyloguj się</button>
    </div>
  );
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(!!localStorage.getItem('auth_token'));
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
    window.location.hash = '/'; // wymusza przejście na Dashboard po zalogowaniu
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <VehicleProvider>
      <Router>
        <div className="app">
          <header className="header">
            <div className="header-content">
              <h1>🚛 System monitorowania floty pojazdów</h1>
              <Navigation onLogout={handleLogout} />
            </div>
          </header>
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/map" element={<Map />} />
              <Route path="/vehicles" element={<VehicleList />} />
              <Route path="/vehicles/:id" element={<VehicleDetails />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </Router>
    </VehicleProvider>
  );
};

export default App; 