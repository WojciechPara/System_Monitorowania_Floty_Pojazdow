const express = require('express');
const { createConnection, executeQuery, getQuery } = require('../database/connection');
const router = express.Router();

// Pobierz wszystkie lokalizacje
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT l.*, v.name as vehicle_name, v.type as vehicle_type
      FROM locations l
      JOIN vehicles v ON l.vehicle_id = v.vehicle_id
      ORDER BY l.timestamp DESC
      LIMIT 1000
    `;
    
    const locations = await getQuery(query);
    res.json(locations);
  } catch (error) {
    console.error('Błąd podczas pobierania lokalizacji:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Pobierz lokalizacje dla konkretnego pojazdu
router.get('/vehicle/:vehicleId', async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { limit = 100, offset = 0 } = req.query;
    
    const query = `
      SELECT l.*, v.name as vehicle_name, v.type as vehicle_type
      FROM locations l
      JOIN vehicles v ON l.vehicle_id = v.vehicle_id
      WHERE l.vehicle_id = ?
      ORDER BY l.timestamp DESC
      LIMIT ? OFFSET ?
    `;
    
    const locations = await getQuery(query, [vehicleId, parseInt(limit), parseInt(offset)]);
    res.json(locations);
  } catch (error) {
    console.error('Błąd podczas pobierania lokalizacji pojazdu:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Pobierz najnowszą lokalizację dla konkretnego pojazdu
router.get('/vehicle/:vehicleId/latest', async (req, res) => {
  try {
    const { vehicleId } = req.params;
    
    const query = `
      SELECT l.*, v.name as vehicle_name, v.type as vehicle_type
      FROM locations l
      JOIN vehicles v ON l.vehicle_id = v.vehicle_id
      WHERE l.vehicle_id = ?
      ORDER BY l.timestamp DESC
      LIMIT 1
    `;
    
    const locations = await getQuery(query, [vehicleId]);
    
    if (locations.length === 0) {
      return res.status(404).json({ error: 'Nie znaleziono lokalizacji dla tego pojazdu' });
    }
    
    res.json(locations[0]);
  } catch (error) {
    console.error('Błąd podczas pobierania najnowszej lokalizacji:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Pobierz lokalizacje z określonego zakresu czasowego
router.get('/timeframe', async (req, res) => {
  try {
    const { start, end, vehicleId } = req.query;
    
    let query = `
      SELECT l.*, v.name as vehicle_name, v.type as vehicle_type
      FROM locations l
      JOIN vehicles v ON l.vehicle_id = v.vehicle_id
      WHERE l.timestamp BETWEEN ? AND ?
    `;
    
    const params = [start, end];
    
    if (vehicleId) {
      query += ' AND l.vehicle_id = ?';
      params.push(vehicleId);
    }
    
    query += ' ORDER BY l.timestamp DESC';
    
    const locations = await getQuery(query, params);
    res.json(locations);
  } catch (error) {
    console.error('Błąd podczas pobierania lokalizacji z zakresu czasowego:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Dodaj nową lokalizację
router.post('/', async (req, res) => {
  try {
    const { vehicle_id, latitude, longitude, speed, heading, fuel_level } = req.body;
    
    if (!vehicle_id || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Brakujące wymagane pola' });
    }
    
    const query = `
      INSERT INTO locations (vehicle_id, latitude, longitude, speed, heading, fuel_level, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `;
    
    await executeQuery(query, [vehicle_id, latitude, longitude, speed || 0, heading || 0, fuel_level || 100]);
    
    res.status(201).json({ 
      message: 'Lokalizacja dodana pomyślnie',
      location: { vehicle_id, latitude, longitude, speed, heading, fuel_level }
    });
  } catch (error) {
    console.error('Błąd podczas dodawania lokalizacji:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Usuń stare lokalizacje (starsze niż X dni)
router.delete('/cleanup', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const query = `
      DELETE FROM locations 
      WHERE timestamp < datetime('now', '-${days} days')
    `;
    
    const result = await executeQuery(query);
    
    res.json({ 
      message: `Usunięto ${result.changes} starych lokalizacji`,
      deleted_count: result.changes
    });
  } catch (error) {
    console.error('Błąd podczas czyszczenia starych lokalizacji:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

module.exports = router; 