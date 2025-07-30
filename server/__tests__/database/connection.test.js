const { createConnection, executeQuery, getQuery } = require('../../database/connection');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Mock dla sqlite3
jest.mock('sqlite3', () => ({
  verbose: jest.fn(() => ({
    Database: jest.fn()
  }))
}));

describe('Database Connection', () => {
  let mockDb;
  let mockRun;
  let mockAll;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock database
    mockRun = jest.fn();
    mockAll = jest.fn();
    
    mockDb = {
      run: mockRun,
      all: mockAll,
      configure: jest.fn()
    };
    
    sqlite3.verbose().Database.mockImplementation((path, callback) => {
      callback(null); // Simulate successful connection
      return mockDb;
    });
  });

  describe('createConnection', () => {
    test('should create a new database connection', () => {
      const db = createConnection();
      
      expect(sqlite3.verbose).toHaveBeenCalled();
      expect(sqlite3.verbose().Database).toHaveBeenCalledWith(
        expect.stringContaining('fleet_management.db'),
        expect.any(Function)
      );
      expect(db).toBe(mockDb);
    });

    test('should reuse existing connection', () => {
      const db1 = createConnection();
      const db2 = createConnection();
      
      expect(db1).toBe(db2);
      expect(sqlite3.verbose().Database).toHaveBeenCalledTimes(1);
    });
  });

  describe('executeQuery', () => {
    test('should execute query successfully', async () => {
      const mockResult = { changes: 1, lastID: 123 };
      mockRun.mockImplementation((query, params, callback) => {
        callback(null, mockResult);
      });

      const result = await executeQuery('INSERT INTO test VALUES (?)', ['test']);
      
      expect(mockRun).toHaveBeenCalledWith('INSERT INTO test VALUES (?)', ['test'], expect.any(Function));
      expect(result).toBe(mockResult);
    });

    test('should handle database errors', async () => {
      const mockError = new Error('Database error');
      mockRun.mockImplementation((query, params, callback) => {
        callback(mockError);
      });

      await expect(executeQuery('INVALID QUERY')).rejects.toThrow('Database error');
    });

    test('should retry on SQLITE_BUSY error', async () => {
      const mockResult = { changes: 1 };
      let callCount = 0;
      
      mockRun.mockImplementation((query, params, callback) => {
        callCount++;
        if (callCount === 1) {
          const error = new Error('SQLITE_BUSY');
          error.code = 'SQLITE_BUSY';
          callback(error);
        } else {
          callback(null, mockResult);
        }
      });

      const result = await executeQuery('INSERT INTO test VALUES (?)', ['test']);
      
      expect(mockRun).toHaveBeenCalledTimes(2);
      expect(result).toBe(mockResult);
    });
  });

  describe('getQuery', () => {
    test('should get query results successfully', async () => {
      const mockRows = [{ id: 1, name: 'test' }];
      mockAll.mockImplementation((query, params, callback) => {
        callback(null, mockRows);
      });

      const result = await getQuery('SELECT * FROM test WHERE id = ?', [1]);
      
      expect(mockAll).toHaveBeenCalledWith('SELECT * FROM test WHERE id = ?', [1], expect.any(Function));
      expect(result).toEqual(mockRows);
    });

    test('should handle database errors in getQuery', async () => {
      const mockError = new Error('Database error');
      mockAll.mockImplementation((query, params, callback) => {
        callback(mockError);
      });

      await expect(getQuery('INVALID QUERY')).rejects.toThrow('Database error');
    });

    test('should retry on SQLITE_BUSY error in getQuery', async () => {
      const mockRows = [{ id: 1 }];
      let callCount = 0;
      
      mockAll.mockImplementation((query, params, callback) => {
        callCount++;
        if (callCount === 1) {
          const error = new Error('SQLITE_BUSY');
          error.code = 'SQLITE_BUSY';
          callback(error);
        } else {
          callback(null, mockRows);
        }
      });

      const result = await getQuery('SELECT * FROM test');
      
      expect(mockAll).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockRows);
    });
  });
}); 