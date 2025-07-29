import React, { useState } from 'react';
import axios from 'axios';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await axios.post('/api/login', { username, password });
      localStorage.setItem('auth_token', res.data.token);
      onLogin();
    } catch (err: any) {
      setError('Nieprawidłowy login lub hasło');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      width: '100vw',
      background: '#f5f6fa',
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '75vw',
        maxWidth: '1400px',
        height: '75vh',
        maxHeight: '75vh',
        background: 'white',
        borderRadius: '32px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        overflow: 'hidden',
      }}>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          height: '100%',
          background: '#e3eaff',
          borderTopLeftRadius: '32px',
          borderBottomLeftRadius: '32px',
          borderTopRightRadius: 0,
          borderBottomRightRadius: 0,
          overflow: 'hidden',
        }}>
          <img
            src="/mapa_demo.png"
            alt="Mapa floty"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'left center',
              borderTopLeftRadius: '32px',
              borderBottomLeftRadius: '32px',
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
              boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
              userSelect: 'none',
              pointerEvents: 'none',
            }}
            draggable={false}
          />
        </div>
        <div style={{
          flex: '0 0 380px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          background: '#7b7be6',
          borderRadius: '0 32px 32px 0',
        }}>
          <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 340, padding: '2.5rem 2rem', background: 'none', borderRadius: 0, boxShadow: 'none' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ color: 'white', fontWeight: 500, display: 'block', marginBottom: 8 }}>Nazwa użytkownika:</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid #ddd', fontSize: '1rem' }}
                autoFocus
                autoComplete="username"
              />
            </div>
            <div style={{ marginBottom: '2rem', position: 'relative' }}>
              <label style={{ color: 'white', fontWeight: 500, display: 'block', marginBottom: 8 }}>Hasło:</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 2.5rem 0.75rem 0.75rem', borderRadius: 8, border: '1px solid #ddd', fontSize: '1rem' }}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                tabIndex={-1}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: 38,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  margin: 0,
                  height: 24,
                  width: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label={showPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
              >
                {showPassword ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7b7be6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.06 10.06 0 0 1 12 20c-5.05 0-9.27-3.11-11-8 1.21-3.06 3.6-5.5 6.58-6.71M1 1l22 22" /><path d="M9.53 9.53A3.5 3.5 0 0 0 12 15.5c1.93 0 3.5-1.57 3.5-3.5 0-.47-.09-.92-.26-1.33" /></svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7b7be6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="12" rx="10" ry="6" /><circle cx="12" cy="12" r="3" /></svg>
                )}
              </button>
            </div>
            {error && <div style={{ color: '#fff', background: '#e57373', borderRadius: 8, padding: '0.75rem', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '0.9rem', borderRadius: 8, background: '#fff', color: '#7b7be6', fontWeight: 700, fontSize: '1.1rem', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              {loading ? 'Logowanie...' : 'Zaloguj się'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login; 