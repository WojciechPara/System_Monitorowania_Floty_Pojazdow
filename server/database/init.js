const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'fleet.db');
const db = new sqlite3.Database(dbPath);

console.log('Inicjalizacja bazy danych...');

// Tworzenie tabel
const createTables = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Tabela pojazdów
      db.run(`
        CREATE TABLE IF NOT EXISTS vehicles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          vehicle_id TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          model TEXT,
          year INTEGER,
          license_plate TEXT,
          status TEXT DEFAULT 'offline',
          fuel_level REAL DEFAULT 100,
          last_seen DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Tabela lokalizacji
      db.run(`
        CREATE TABLE IF NOT EXISTS locations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          vehicle_id TEXT NOT NULL,
          latitude REAL NOT NULL,
          longitude REAL NOT NULL,
          speed REAL DEFAULT 0,
          heading REAL DEFAULT 0,
          fuel_level REAL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (vehicle_id) REFERENCES vehicles (vehicle_id)
        )
      `);

      // Tabela tras
      db.run(`
        CREATE TABLE IF NOT EXISTS routes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          vehicle_id TEXT NOT NULL,
          start_time DATETIME,
          end_time DATETIME,
          distance REAL DEFAULT 0,
          avg_speed REAL DEFAULT 0,
          max_speed REAL DEFAULT 0,
          fuel_consumed REAL DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (vehicle_id) REFERENCES vehicles (vehicle_id)
        )
      `);

      console.log('Tabele utworzone pomyślnie');
      resolve();
    });
  });
};

// Wstawianie przykładowych danych
const insertSampleData = () => {
  return new Promise((resolve, reject) => {
    let vehicles = [
      // Mercedes - 2 pojazdy
      {
        vehicle_id: 'V001', name: 'Mercedes Sprinter', type: 'dostawczy', model: 'Sprinter 316', year: 2020, license_plate: 'RZ 27361', fuel_level: 85
      },
      {
        vehicle_id: 'V002', name: 'Mercedes Actros', type: 'ciężarowy', model: 'Actros 1845', year: 2021, license_plate: 'RZ 45678', fuel_level: 92
      },
      // Ford - 2 pojazdy
      {
        vehicle_id: 'V003', name: 'Ford Transit', type: 'dostawczy', model: 'Transit Custom', year: 2021, license_plate: 'RZ 34567', fuel_level: 78
      },
      {
        vehicle_id: 'V004', name: 'Ford Transit', type: 'dostawczy', model: 'Transit Custom', year: 2022, license_plate: 'RZ 78901', fuel_level: 45
      },
      // Volkswagen - 2 pojazdy
      {
        vehicle_id: 'V005', name: 'Volkswagen Crafter', type: 'dostawczy', model: 'Crafter 35', year: 2019, license_plate: 'RZ 23456', fuel_level: 65
      },
      {
        vehicle_id: 'V006', name: 'Volkswagen Crafter', type: 'dostawczy', model: 'Crafter 35', year: 2020, license_plate: 'RZ 56789', fuel_level: 88
      },
      // Renault - 2 pojazdy
      {
        vehicle_id: 'V007', name: 'Renault Master', type: 'dostawczy', model: 'Master L3H2', year: 2022, license_plate: 'RZ 12345', fuel_level: 72
      },
      {
        vehicle_id: 'V008', name: 'Renault Kangoo', type: 'dostawczy', model: 'Kangoo Express', year: 2021, license_plate: 'RZ 67890', fuel_level: 30
      },
      // Iveco - 2 pojazdy
      {
        vehicle_id: 'V009', name: 'Iveco Daily', type: 'ciężarowy', model: 'Daily 35S15', year: 2021, license_plate: 'RZ 45678', fuel_level: 95
      },
      {
        vehicle_id: 'V010', name: 'Iveco Stralis', type: 'ciężarowy', model: 'Stralis Hi-Way', year: 2020, license_plate: 'RZ 98765', fuel_level: 82
      },
      // MAN - 2 pojazdy
      {
        vehicle_id: 'V011', name: 'MAN TGS', type: 'ciężarowy', model: 'TGS 18.400', year: 2022, license_plate: 'RZ 54321', fuel_level: 90
      },
      {
        vehicle_id: 'V012', name: 'MAN TGM', type: 'ciężarowy', model: 'TGM 13.290', year: 2021, license_plate: 'RZ 87654', fuel_level: 25
      },
      // Scania - 2 pojazdy
      {
        vehicle_id: 'V013', name: 'Scania R', type: 'ciężarowy', model: 'R 450', year: 2020, license_plate: 'RZ 13579', fuel_level: 87
      },
      {
        vehicle_id: 'V014', name: 'Scania P', type: 'ciężarowy', model: 'P 320', year: 2021, license_plate: 'RZ 24680', fuel_level: 76
      },
      // Volvo - 2 pojazdy
      {
        vehicle_id: 'V015', name: 'Volvo FH', type: 'ciężarowy', model: 'FH 460', year: 2022, license_plate: 'RZ 36925', fuel_level: 93
      },
      {
        vehicle_id: 'V016', name: 'Volvo FL', type: 'ciężarowy', model: 'FL 220', year: 2020, license_plate: 'RZ 74185', fuel_level: 40
      }
    ];

    // Losowanie statusów online/offline
    const allOnline = Math.random() < 0.66;
    let offlineIndexes = [];
    if (!allOnline) {
      const offlineCount = Math.floor(Math.random() * 3) + 1; // 1-3 pojazdy offline
      // Losuj unikalne indeksy pojazdów, które będą offline
      while (offlineIndexes.length < offlineCount) {
        const idx = Math.floor(Math.random() * vehicles.length);
        if (!offlineIndexes.includes(idx)) offlineIndexes.push(idx);
      }
    }
    vehicles = vehicles.map((v, idx) => ({
      ...v,
      status: offlineIndexes.includes(idx) ? 'offline' : 'online'
    }));

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO vehicles 
      (vehicle_id, name, type, model, year, license_plate, status, fuel_level, last_seen)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    vehicles.forEach(vehicle => {
      stmt.run([
        vehicle.vehicle_id,
        vehicle.name,
        vehicle.type,
        vehicle.model,
        vehicle.year,
        vehicle.license_plate,
        vehicle.status,
        vehicle.fuel_level
      ]);
    });

    stmt.finalize();
    console.log('Przykładowe dane pojazdów wstawione');

    // Przykładowe lokalizacje rozproszone po głównych drogach w Polsce - tylko dla pojazdów online
    const locations = [
      // A1 - Gdańsk - Łódź - Katowice
      { vehicle_id: 'V001', lat: 54.3520, lng: 18.6466, speed: 85, fuel: 85 }, // Gdańsk
      { vehicle_id: 'V002', lat: 53.1235, lng: 18.0084, speed: 92, fuel: 92 }, // Toruń
      
      // A2 - Świecko - Warszawa - Terespol
      { vehicle_id: 'V003', lat: 52.2297, lng: 21.0122, speed: 78, fuel: 78 }, // Warszawa
      { vehicle_id: 'V005', lat: 52.4064, lng: 16.9252, speed: 65, fuel: 65 }, // Poznań
      
      // A4 - Zgorzelec - Wrocław - Kraków - Rzeszów
      { vehicle_id: 'V006', lat: 51.1079, lng: 17.0385, speed: 88, fuel: 88 }, // Wrocław
      { vehicle_id: 'V007', lat: 50.0647, lng: 19.9450, speed: 72, fuel: 72 }, // Kraków
      
      // A6 - Szczecin - Poznań
      { vehicle_id: 'V009', lat: 53.4285, lng: 14.5528, speed: 95, fuel: 95 }, // Szczecin
      
      // A8 - Wrocław - Łódź
      { vehicle_id: 'V010', lat: 51.7592, lng: 19.4559, speed: 82, fuel: 82 }, // Łódź
      
      // S1 - Pyrzowice - Bielsko-Biała
      { vehicle_id: 'V011', lat: 50.2613, lng: 19.0239, speed: 90, fuel: 90 }, // Katowice
      
      // S3 - Szczecin - Zielona Góra - Legnica
      { vehicle_id: 'V013', lat: 51.9355, lng: 15.5064, speed: 87, fuel: 87 }, // Zielona Góra
      
      // S5 - Gdańsk - Poznań - Wrocław
      { vehicle_id: 'V014', lat: 54.5189, lng: 18.5305, speed: 76, fuel: 76 }, // Gdynia
      
      // S7 - Gdańsk - Warszawa - Kraków
      { vehicle_id: 'V015', lat: 53.7767, lng: 20.4904, speed: 93, fuel: 93 }  // Olsztyn
    ];

    const locationStmt = db.prepare(`
      INSERT INTO locations (vehicle_id, latitude, longitude, speed, fuel_level)
      VALUES (?, ?, ?, ?, ?)
    `);

    locations.forEach(loc => {
      locationStmt.run([loc.vehicle_id, loc.lat, loc.lng, loc.speed, loc.fuel]);
    });

    locationStmt.finalize();
    console.log('Przykładowe lokalizacje wstawione');
    resolve();
  });
};

// Główna funkcja inicjalizacji
const initDatabase = async () => {
  try {
    await createTables();
    await insertSampleData();
    console.log('Baza danych zainicjalizowana pomyślnie!');
    db.close();
  } catch (error) {
    console.error('Błąd podczas inicjalizacji bazy danych:', error);
    db.close();
  }
};

initDatabase(); 