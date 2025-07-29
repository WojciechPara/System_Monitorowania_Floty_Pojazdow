const express = require('express');
const { createConnection, executeQuery, getQuery } = require('../database/connection');
const router = express.Router();

// Pobierz wszystkie trasy
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT * FROM routes 
      ORDER BY name
    `;
    
    const routes = await getQuery(query);
    res.json(routes);
  } catch (error) {
    console.error('Błąd podczas pobierania tras:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Pobierz trasę po ID
router.get('/:id', async (req, res) => {
  try {
    const query = `
      SELECT * FROM routes 
      WHERE id = ?
    `;
    
    const routes = await getQuery(query, [req.params.id]);
    
    if (routes.length === 0) {
      return res.status(404).json({ error: 'Trasa nie znaleziona' });
    }
    
    res.json(routes[0]);
  } catch (error) {
    console.error('Błąd podczas pobierania trasy:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Dodaj nową trasę
router.post('/', async (req, res) => {
  try {
    const { name, description, start_point, end_point, distance, estimated_time, geojson_data } = req.body;
    
    if (!name || !start_point || !end_point) {
      return res.status(400).json({ error: 'Brakujące wymagane pola' });
    }
    
    const query = `
      INSERT INTO routes (name, description, start_point, end_point, distance, estimated_time, geojson_data, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `;
    
    await executeQuery(query, [name, description, start_point, end_point, distance, estimated_time, geojson_data]);
    
    res.status(201).json({ 
      message: 'Trasa dodana pomyślnie',
      route: { name, start_point, end_point, distance, estimated_time }
    });
  } catch (error) {
    console.error('Błąd podczas dodawania trasy:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Aktualizuj trasę
router.put('/:id', async (req, res) => {
  try {
    const { name, description, start_point, end_point, distance, estimated_time, geojson_data } = req.body;
    
    const query = `
      UPDATE routes 
      SET name = ?, description = ?, start_point = ?, end_point = ?, 
          distance = ?, estimated_time = ?, geojson_data = ?, updated_at = datetime('now')
      WHERE id = ?
    `;
    
    const result = await executeQuery(query, [name, description, start_point, end_point, distance, estimated_time, geojson_data, req.params.id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Trasa nie znaleziona' });
    }
    
    res.json({ 
      message: 'Trasa zaktualizowana pomyślnie',
      route: { id: req.params.id, name, start_point, end_point, distance, estimated_time }
    });
  } catch (error) {
    console.error('Błąd podczas aktualizacji trasy:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Usuń trasę
router.delete('/:id', async (req, res) => {
  try {
    const result = await executeQuery('DELETE FROM routes WHERE id = ?', [req.params.id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Trasa nie znaleziona' });
    }
    
    res.json({ message: 'Trasa usunięta pomyślnie' });
  } catch (error) {
    console.error('Błąd podczas usuwania trasy:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Pobierz trasy z określonego punktu startowego
router.get('/from/:startPoint', async (req, res) => {
  try {
    const { startPoint } = req.params;
    
    const query = `
      SELECT * FROM routes 
      WHERE start_point LIKE ? OR start_point = ?
      ORDER BY name
    `;
    
    const routes = await getQuery(query, [`%${startPoint}%`, startPoint]);
    res.json(routes);
  } catch (error) {
    console.error('Błąd podczas pobierania tras z punktu startowego:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Pobierz trasy do określonego punktu docelowego
router.get('/to/:endPoint', async (req, res) => {
  try {
    const { endPoint } = req.params;
    
    const query = `
      SELECT * FROM routes 
      WHERE end_point LIKE ? OR end_point = ?
      ORDER BY name
    `;
    
    const routes = await getQuery(query, [`%${endPoint}%`, endPoint]);
    res.json(routes);
  } catch (error) {
    console.error('Błąd podczas pobierania tras do punktu docelowego:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Pobierz trasy dla danego pojazdu
router.get('/vehicle/:vehicle_id', async (req, res) => {
  try {
    const query = `
      SELECT * FROM routes
      WHERE vehicle_id = ?
      ORDER BY start_time DESC
    `;
    const routes = await getQuery(query, [req.params.vehicle_id]);
    res.json(routes);
  } catch (error) {
    console.error('Błąd podczas pobierania tras pojazdu:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

module.exports = router; 