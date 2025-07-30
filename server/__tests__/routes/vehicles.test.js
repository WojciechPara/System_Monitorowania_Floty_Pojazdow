const request = require('supertest');
const express = require('express');
const { createConnection, executeQuery, getQuery } = require('../../database/connection');

// Mock database module
jest.mock('../../database/connection', () => ({
  createConnection: jest.fn(),
  executeQuery: jest.fn(),
  getQuery: jest.fn()
}));

// Import routes after mocking
const vehiclesRouter = require('../../routes/vehicles');

describe('Vehicles API Routes', () => {
  let app;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create test app
    app = express();
    app.use(express.json());
    app.use('/api/vehicles', vehiclesRouter);
  });

  describe('GET /api/vehicles', () => {
    test('should return all vehicles', async () => {
      const mockVehicles = [
        {
          vehicle_id: 'V001',
          name: 'Truck 1',
          type: 'Ciężarówka',
          status: 'w ruchu',
          fuel_level: 85,
          location_count: 10,
          last_location_time: '2024-01-01 12:00:00',
          latitude: 52.2297,
          longitude: 21.0122,
          speed: 60,
          heading: 90
        }
      ];

      getQuery.mockResolvedValue(mockVehicles);

      const response = await request(app)
        .get('/api/vehicles')
        .expect(200);

      expect(response.body).toEqual(mockVehicles);
      expect(getQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT v.*'),
        []
      );
    });

    test('should handle database errors', async () => {
      getQuery.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/vehicles')
        .expect(500);

      expect(response.body).toEqual({ error: 'Błąd serwera' });
    });
  });

  describe('GET /api/vehicles/:id', () => {
    test('should return specific vehicle', async () => {
      const mockVehicle = {
        vehicle_id: 'V001',
        name: 'Truck 1',
        type: 'Ciężarówka',
        status: 'w ruchu',
        fuel_level: 85
      };

      getQuery.mockResolvedValue([mockVehicle]);

      const response = await request(app)
        .get('/api/vehicles/V001')
        .expect(200);

      expect(response.body).toEqual(mockVehicle);
      expect(getQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE v.vehicle_id = ?'),
        ['V001']
      );
    });

    test('should return 404 for non-existent vehicle', async () => {
      getQuery.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/vehicles/NONEXISTENT')
        .expect(404);

      expect(response.body).toEqual({ error: 'Pojazd nie znaleziony' });
    });
  });

  describe('POST /api/vehicles', () => {
    test('should create new vehicle', async () => {
      const newVehicle = {
        vehicle_id: 'V002',
        name: 'Truck 2',
        type: 'Ciężarówka',
        status: 'offline',
        fuel_level: 100
      };

      executeQuery.mockResolvedValue({ changes: 1, lastID: 2 });

      const response = await request(app)
        .post('/api/vehicles')
        .send(newVehicle)
        .expect(201);

      expect(response.body).toEqual({
        message: 'Pojazd dodany pomyślnie',
        vehicle: newVehicle
      });

      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO vehicles'),
        [newVehicle.vehicle_id, newVehicle.name, newVehicle.type, newVehicle.status, newVehicle.fuel_level]
      );
    });

    test('should return 400 for missing required fields', async () => {
      const invalidVehicle = {
        name: 'Truck 2',
        type: 'Ciężarówka'
        // Missing vehicle_id
      };

      const response = await request(app)
        .post('/api/vehicles')
        .send(invalidVehicle)
        .expect(400);

      expect(response.body).toEqual({ error: 'Brakujące wymagane pola' });
    });

    test('should use default values for optional fields', async () => {
      const vehicleWithDefaults = {
        vehicle_id: 'V003',
        name: 'Truck 3',
        type: 'Ciężarówka'
        // status and fuel_level should default
      };

      executeQuery.mockResolvedValue({ changes: 1 });

      const response = await request(app)
        .post('/api/vehicles')
        .send(vehicleWithDefaults)
        .expect(201);

      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO vehicles'),
        ['V003', 'Truck 3', 'Ciężarówka', 'offline', 100]
      );
    });
  });

  describe('PUT /api/vehicles/:id', () => {
    test('should update existing vehicle', async () => {
      const updateData = {
        name: 'Updated Truck',
        type: 'Ciężarówka',
        status: 'postój',
        fuel_level: 75
      };

      executeQuery.mockResolvedValue({ changes: 1 });

      const response = await request(app)
        .put('/api/vehicles/V001')
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual({
        message: 'Pojazd zaktualizowany pomyślnie',
        vehicle: { vehicle_id: 'V001', ...updateData }
      });
    });

    test('should return 404 for non-existent vehicle', async () => {
      executeQuery.mockResolvedValue({ changes: 0 });

      const response = await request(app)
        .put('/api/vehicles/NONEXISTENT')
        .send({ name: 'Test' })
        .expect(404);

      expect(response.body).toEqual({ error: 'Pojazd nie znaleziony' });
    });
  });

  describe('DELETE /api/vehicles/:id', () => {
    test('should delete vehicle and related locations', async () => {
      executeQuery
        .mockResolvedValueOnce({ changes: 5 }) // Delete locations
        .mockResolvedValueOnce({ changes: 1 }); // Delete vehicle

      const response = await request(app)
        .delete('/api/vehicles/V001')
        .expect(200);

      expect(response.body).toEqual({ message: 'Pojazd usunięty pomyślnie' });
      expect(executeQuery).toHaveBeenCalledTimes(2);
    });

    test('should return 404 for non-existent vehicle', async () => {
      executeQuery
        .mockResolvedValueOnce({ changes: 0 }) // No locations to delete
        .mockResolvedValueOnce({ changes: 0 }); // No vehicle to delete

      const response = await request(app)
        .delete('/api/vehicles/NONEXISTENT')
        .expect(404);

      expect(response.body).toEqual({ error: 'Pojazd nie znaleziony' });
    });
  });

  describe('GET /api/vehicles/stats/summary', () => {
    test('should return vehicle statistics', async () => {
      const mockStats = {
        total_vehicles: 10,
        active_vehicles: 5,
        stopped_vehicles: 3,
        offline_vehicles: 2,
        avg_fuel_level: 75.5,
        low_fuel_vehicles: 1
      };

      getQuery.mockResolvedValue([mockStats]);

      const response = await request(app)
        .get('/api/vehicles/stats/summary')
        .expect(200);

      expect(response.body).toEqual(mockStats);
      expect(getQuery).toHaveBeenCalledWith(
        expect.stringContaining('COUNT(*) as total_vehicles'),
        []
      );
    });
  });
}); 