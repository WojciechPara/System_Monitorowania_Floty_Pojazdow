const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'fleet.db');

// Pojedyncze połączenie z bazą danych
let db = null;

const createConnection = () => {
  if (!db) {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Błąd połączenia z bazą danych:', err.message);
      } else {
        console.log('Połączono z bazą danych SQLite');
        // Ustaw timeout na 30 sekund
        db.configure('busyTimeout', 30000);
      }
    });
  }
  return db;
};

// Funkcja do bezpiecznego wykonania zapytań z retry
const executeQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    const database = createConnection();
    
    const executeWithRetry = (retryCount = 0) => {
      database.run(query, params, function(err) {
        if (err) {
          if (err.code === 'SQLITE_BUSY' && retryCount < 3) {
            // Retry po 100ms
            setTimeout(() => {
              executeWithRetry(retryCount + 1);
            }, 100 * (retryCount + 1));
          } else {
            reject(err);
          }
        } else {
          resolve(this);
        }
      });
    };
    
    executeWithRetry();
  });
};

// Funkcja do bezpiecznego pobierania danych
const getQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    const database = createConnection();
    
    const executeWithRetry = (retryCount = 0) => {
      database.all(query, params, (err, rows) => {
        if (err) {
          if (err.code === 'SQLITE_BUSY' && retryCount < 3) {
            // Retry po 100ms
            setTimeout(() => {
              executeWithRetry(retryCount + 1);
            }, 100 * (retryCount + 1));
          } else {
            reject(err);
          }
        } else {
          resolve(rows);
        }
      });
    };
    
    executeWithRetry();
  });
};

module.exports = { createConnection, executeQuery, getQuery }; 