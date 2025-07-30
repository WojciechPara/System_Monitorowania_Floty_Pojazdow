const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

// Import routes
const vehiclesRoutes = require('./routes/vehicles');
const locationsRoutes = require('./routes/locations');
const routesRoutes = require('./routes/routes');

// Import simulator
const DataSimulator = require('./simulator/dataSimulator');
const { createConnection } = require('./database/connection');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/vehicles', vehiclesRoutes);
app.use('/api/locations', locationsRoutes);
app.use('/api/routes', routesRoutes);

// Endpoint logowania
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin') {
    // Można zwrócić prosty token lub flagę
    return res.json({ success: true, token: 'mock-token-admin' });
  } else {
    return res.status(401).json({ success: false, message: 'Nieprawidłowy login lub hasło' });
  }
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('Klient połączony:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Klient rozłączony:', socket.id);
  });
});

// Make io available to routes
app.set('io', io);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'System Zarządzania Floty Pojazdów - API' });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    port: PORT 
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Coś poszło nie tak!' });
});

// Initialize and start data simulator
let simulator = null;

const initSimulator = async () => {
  try {
    simulator = new DataSimulator(io);
    await simulator.init();
    
    // Start simulator after 3.5 seconds
    setTimeout(() => {
      simulator.start(3500); // Update every 3.5 seconds
      console.log('Symulator danych uruchomiony');
    }, 3500);
    
  } catch (error) {
    console.error('Błąd podczas inicjalizacji symulatora:', error);
  }
};

server.listen(PORT, async () => {
  console.log(`Serwer uruchomiony na porcie ${PORT}`);
  console.log(`API dostępne pod adresem: http://localhost:${PORT}`);
  
  // Inicjalizacja połączenia z bazą danych
  createConnection();
  
  // Initialize simulator after server starts
  await initSimulator();
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Zatrzymywanie serwera...');
  if (simulator) {
    simulator.stop();
  }
  server.close(() => {
    console.log('Serwer zatrzymany');
    process.exit(0);
  });
});

module.exports = { app, io }; 