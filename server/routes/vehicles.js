const express = require('express');
const { createConnection, executeQuery, getQuery } = require('../database/connection');
const router = express.Router();

// Pobierz wszystkie pojazdy
router.get('/', async (req, res) => {
  try {
  const query = `
    SELECT v.*, 
             COUNT(l.id) as location_count,
             MAX(l.timestamp) as last_location_time,
             latest_loc.latitude,
             latest_loc.longitude,
             latest_loc.speed,
             latest_loc.heading
    FROM vehicles v
      LEFT JOIN locations l ON v.vehicle_id = l.vehicle_id
    LEFT JOIN (
        SELECT vehicle_id, latitude, longitude, speed, heading, timestamp,
             ROW_NUMBER() OVER (PARTITION BY vehicle_id ORDER BY timestamp DESC) as rn
      FROM locations
      ) latest_loc ON v.vehicle_id = latest_loc.vehicle_id AND latest_loc.rn = 1
      GROUP BY v.vehicle_id
      ORDER BY v.vehicle_id
    `;
    
    const vehicles = await getQuery(query);
    res.json(vehicles);
  } catch (error) {
    console.error('Błąd podczas pobierania pojazdów:', error);
      res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Pobierz pojazd po ID
router.get('/:id', async (req, res) => {
  try {
  const query = `
    SELECT v.*, 
             COUNT(l.id) as location_count,
             MAX(l.timestamp) as last_location_time,
             latest_loc.latitude,
             latest_loc.longitude,
             latest_loc.speed,
             latest_loc.heading
    FROM vehicles v
      LEFT JOIN locations l ON v.vehicle_id = l.vehicle_id
    LEFT JOIN (
        SELECT vehicle_id, latitude, longitude, speed, heading, timestamp,
             ROW_NUMBER() OVER (PARTITION BY vehicle_id ORDER BY timestamp DESC) as rn
      FROM locations
      ) latest_loc ON v.vehicle_id = latest_loc.vehicle_id AND latest_loc.rn = 1
    WHERE v.vehicle_id = ?
      GROUP BY v.vehicle_id
    `;
    
    const vehicles = await getQuery(query, [req.params.id]);
    
    if (vehicles.length === 0) {
      return res.status(404).json({ error: 'Pojazd nie znaleziony' });
    }
    
    res.json(vehicles[0]);
  } catch (error) {
    console.error('Błąd podczas pobierania pojazdu:', error);
      res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Dodaj nowy pojazd
router.post('/', async (req, res) => {
  try {
    const { vehicle_id, name, type, status = 'offline', fuel_level = 100 } = req.body;

  if (!vehicle_id || !name || !type) {
      return res.status(400).json({ error: 'Brakujące wymagane pola' });
  }

  const query = `
      INSERT INTO vehicles (vehicle_id, name, type, status, fuel_level, last_seen)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
  `;

    await executeQuery(query, [vehicle_id, name, type, status, fuel_level]);
    
    res.status(201).json({ 
      message: 'Pojazd dodany pomyślnie',
      vehicle: { vehicle_id, name, type, status, fuel_level }
    });
  } catch (error) {
    console.error('Błąd podczas dodawania pojazdu:', error);
        res.status(500).json({ error: 'Błąd serwera' });
      }
});

// Aktualizuj pojazd
router.put('/:id', async (req, res) => {
  try {
    const { name, type, status, fuel_level } = req.body;

  const query = `
    UPDATE vehicles 
      SET name = ?, type = ?, status = ?, fuel_level = ?, last_seen = datetime('now')
    WHERE vehicle_id = ?
  `;

    const result = await executeQuery(query, [name, type, status, fuel_level, req.params.id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Pojazd nie znaleziony' });
    }
    
    res.json({ 
      message: 'Pojazd zaktualizowany pomyślnie',
      vehicle: { vehicle_id: req.params.id, name, type, status, fuel_level }
    });
  } catch (error) {
    console.error('Błąd podczas aktualizacji pojazdu:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Usuń pojazd
router.delete('/:id', async (req, res) => {
  try {
    // Najpierw usuń powiązane lokalizacje
    await executeQuery('DELETE FROM locations WHERE vehicle_id = ?', [req.params.id]);
    
    // Następnie usuń pojazd
    const result = await executeQuery('DELETE FROM vehicles WHERE vehicle_id = ?', [req.params.id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Pojazd nie znaleziony' });
    }
    
    res.json({ message: 'Pojazd usunięty pomyślnie' });
  } catch (error) {
    console.error('Błąd podczas usuwania pojazdu:', error);
      res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Pobierz statystyki pojazdów
router.get('/stats/summary', async (req, res) => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_vehicles,
        COUNT(CASE WHEN status = 'w ruchu' THEN 1 END) as active_vehicles,
        COUNT(CASE WHEN status = 'postój' THEN 1 END) as stopped_vehicles,
        COUNT(CASE WHEN status = 'offline' THEN 1 END) as offline_vehicles,
        AVG(fuel_level) as avg_fuel_level,
        COUNT(CASE WHEN fuel_level < 20 THEN 1 END) as low_fuel_vehicles
      FROM vehicles
    `;
    
    const stats = await getQuery(query);
    res.json(stats[0]);
  } catch (error) {
    console.error('Błąd podczas pobierania statystyk:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

module.exports = router; 