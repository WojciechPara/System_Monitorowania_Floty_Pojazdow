const { createConnection, executeQuery } = require('../database/connection');
const moment = require('moment');
const fs = require('fs');
const path = require('path');

class DataSimulator {
  constructor(io) {
    this.io = io;
    this.isRunning = false;
    this.interval = null;
    this.vehicles = [];
    this.positions = new Map();
    this.vehicleStates = {};
    this.offlineVehicles = new Set(); // Śledzenie pojazdów offline
    this.routes = []; // Trasy z pliku JSON
    this.vehicleSpeeds = new Map(); // Przechowuje prędkości bazowe dla każdego pojazdu
  }

  // Ładowanie tras z pliku JSON
  loadRoutes() {
    try {
      const routesPath = path.join(__dirname, 'Trasy.json');
      const routesData = fs.readFileSync(routesPath, 'utf8');
      this.routes = JSON.parse(routesData);
      console.log(`Załadowano ${this.routes.length} tras z pliku JSON`);
    } catch (error) {
      console.error('Błąd podczas ładowania tras:', error);
      // Fallback do starych tras jeśli plik nie istnieje
      this.routes = [
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [
              [17.05101, 51.08308],
              [17.05064, 51.08309],
              [17.0504, 51.0831],
              [17.05015, 51.0831],
              [17.05008, 51.0831],
              [17.05003, 51.0831],
              [17.04998, 51.08311],
              [17.04996, 51.08311],
              [17.04994, 51.08311],
              [17.04951, 51.08311]
            ]
          }
        }
      ];
      console.log('Użyto domyślnej trasy');
    }
  }

  // Konwersja współrzędnych GeoJSON na format używany przez symulator
  convertGeoJSONToRoute(geoJsonFeature) {
    const coordinates = geoJsonFeature.geometry.coordinates;
    return coordinates.map(coord => ({
      lng: coord[0],
      lat: coord[1]
    }));
  }

  // Sprawdzenie i utworzenie tabel jeśli nie istnieją
  async ensureTablesExist() {
    try {
      // Tabela pojazdów
      await executeQuery(`
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
      await executeQuery(`
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
      await executeQuery(`
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

      console.log('Tabele bazy danych sprawdzone/utworzone');
    } catch (error) {
      console.error('Błąd podczas tworzenia tabel:', error);
    }
  }

  // Wstawianie domyślnych pojazdów do bazy danych
  async insertDefaultVehicles() {
    const defaultVehicles = [
      { vehicle_id: 'V001', name: 'Mercedes Sprinter', type: 'dostawczy', model: 'Sprinter 316', year: 2020, license_plate: 'RZ 27361' },
      { vehicle_id: 'V002', name: 'Mercedes Actros', type: 'ciężarowy', model: 'Actros 1845', year: 2021, license_plate: 'RZ 45678' },
      { vehicle_id: 'V003', name: 'Ford Transit', type: 'dostawczy', model: 'Transit Custom', year: 2021, license_plate: 'RZ 34567' },
      { vehicle_id: 'V004', name: 'Ford Transit', type: 'dostawczy', model: 'Transit Custom', year: 2022, license_plate: 'RZ 78901' },
      { vehicle_id: 'V005', name: 'Volkswagen Crafter', type: 'dostawczy', model: 'Crafter 35', year: 2019, license_plate: 'RZ 23456' },
      { vehicle_id: 'V006', name: 'Volkswagen Crafter', type: 'dostawczy', model: 'Crafter 35', year: 2020, license_plate: 'RZ 56789' },
      { vehicle_id: 'V007', name: 'Renault Master', type: 'dostawczy', model: 'Master L3H2', year: 2022, license_plate: 'RZ 12345' },
      { vehicle_id: 'V008', name: 'Renault Kangoo', type: 'dostawczy', model: 'Kangoo Express', year: 2021, license_plate: 'RZ 67890' },
      { vehicle_id: 'V009', name: 'Iveco Daily', type: 'dostawczy', model: 'Daily 35S15', year: 2020, license_plate: 'RZ 98765' },
      { vehicle_id: 'V010', name: 'Iveco Stralis', type: 'ciężarowy', model: 'Stralis NP 460', year: 2021, license_plate: 'RZ 54321' }
    ];

    try {
      for (const vehicle of defaultVehicles) {
        await executeQuery(`
          INSERT OR IGNORE INTO vehicles (vehicle_id, name, type, model, year, license_plate, status, fuel_level)
          VALUES (?, ?, ?, ?, ?, ?, 'offline', ?)
        `, [
          vehicle.vehicle_id,
          vehicle.name,
          vehicle.type,
          vehicle.model,
          vehicle.year,
          vehicle.license_plate,
          60 + Math.random() * 39 // Losowy poziom paliwa 60-99%
        ]);
      }
      console.log('Domyślne pojazdy dodane do bazy danych');
    } catch (error) {
      console.error('Błąd podczas dodawania domyślnych pojazdów:', error);
    }
  }

  // Inicjalizacja symulatora
  async init() {
    const db = createConnection();
    
    // Ładuj trasy z pliku JSON
    this.loadRoutes();
    
    // Sprawdź i utwórz tabele jeśli nie istnieją
    await this.ensureTablesExist();
    
    return new Promise((resolve, reject) => {
      db.all('SELECT vehicle_id, name, type FROM vehicles', [], (err, rows) => {
        if (err) {
          console.error('Błąd podczas pobierania pojazdów z bazy danych:', err);
          console.log('Używam domyślnych pojazdów...');
          // Fallback - domyślne pojazdy jeśli baza danych nie działa
          this.vehicles = [
            { vehicle_id: 'V001', name: 'Mercedes Sprinter', type: 'dostawczy' },
            { vehicle_id: 'V002', name: 'Mercedes Actros', type: 'ciężarowy' },
            { vehicle_id: 'V003', name: 'Ford Transit', type: 'dostawczy' },
            { vehicle_id: 'V004', name: 'Ford Transit', type: 'dostawczy' },
            { vehicle_id: 'V005', name: 'Volkswagen Crafter', type: 'dostawczy' },
            { vehicle_id: 'V006', name: 'Volkswagen Crafter', type: 'dostawczy' },
            { vehicle_id: 'V007', name: 'Renault Master', type: 'dostawczy' },
            { vehicle_id: 'V008', name: 'Renault Kangoo', type: 'dostawczy' },
            { vehicle_id: 'V009', name: 'Iveco Daily', type: 'dostawczy' },
            { vehicle_id: 'V010', name: 'Iveco Stralis', type: 'ciężarowy' }
          ];
        } else {
          this.vehicles = rows;
          
          // Jeśli baza danych jest pusta, dodaj domyślne pojazdy
          if (this.vehicles.length === 0) {
            console.log('Baza danych jest pusta, dodaję domyślne pojazdy...');
            this.insertDefaultVehicles().then(() => {
              this.vehicles = [
                { vehicle_id: 'V001', name: 'Mercedes Sprinter', type: 'dostawczy' },
                { vehicle_id: 'V002', name: 'Mercedes Actros', type: 'ciężarowy' },
                { vehicle_id: 'V003', name: 'Ford Transit', type: 'dostawczy' },
                { vehicle_id: 'V004', name: 'Ford Transit', type: 'dostawczy' },
                { vehicle_id: 'V005', name: 'Volkswagen Crafter', type: 'dostawczy' },
                { vehicle_id: 'V006', name: 'Volkswagen Crafter', type: 'dostawczy' },
                { vehicle_id: 'V007', name: 'Renault Master', type: 'dostawczy' },
                { vehicle_id: 'V008', name: 'Renault Kangoo', type: 'dostawczy' },
                { vehicle_id: 'V009', name: 'Iveco Daily', type: 'dostawczy' },
                { vehicle_id: 'V010', name: 'Iveco Stralis', type: 'ciężarowy' }
              ];
            }).catch(error => {
              console.error('Błąd podczas dodawania domyślnych pojazdów:', error);
            });
          }
          
          // Losowo wybierz 1-3 pojazdy do statusu offline przy uruchomieniu
          const offlineCount = Math.floor(Math.random() * 3) + 1; // 1-3 pojazdy
          const offlineIndexes = [];
          while (offlineIndexes.length < offlineCount) {
            const idx = Math.floor(Math.random() * this.vehicles.length);
            if (!offlineIndexes.includes(idx)) {
              offlineIndexes.push(idx);
              this.offlineVehicles.add(this.vehicles[idx].vehicle_id);
            }
          }
          console.log(`🚨 ${offlineCount} pojazd(y) ustawione jako OFFLINE przy uruchomieniu:`, 
            offlineIndexes.map(idx => this.vehicles[idx].vehicle_id).join(', '));
          
          this.vehicles.forEach((vehicle) => {
            // Losowo wybierz trasę dla każdego pojazdu
            const randomRouteIndex = Math.floor(Math.random() * this.routes.length);
            const selectedRoute = this.routes[randomRouteIndex];
            const route = this.convertGeoJSONToRoute(selectedRoute);
            
            // Losowa pozycja między 20% a 80% trasy
            const routeProgress = 0.2 + Math.random() * 0.6; // 20% - 80%
            const totalPoints = route.length;
            const currentPointIndex = Math.floor(routeProgress * totalPoints);
            
            // Upewnij się, że nie przekraczamy granic tablicy
            const seg = Math.min(currentPointIndex, totalPoints - 2);
            const t = routeProgress * totalPoints - seg;
            
            const start = route[seg];
            const end = route[seg + 1];
            const lat = start.lat + (end.lat - start.lat) * t;
            const lng = start.lng + (end.lng - start.lng) * t;
            
            // Generuj prędkość bazową w zależności od typu pojazdu
            let baseSpeed;
            if (vehicle.type === 'ciężarowy') {
              baseSpeed = 80 + Math.random() * 10; // 80-90 km/h
            } else if (vehicle.type === 'dostawczy') {
              baseSpeed = 80 + Math.random() * 50; // 80-130 km/h
            } else {
              baseSpeed = 80 + Math.random() * 90; // Domyślna prędkość dla innych typów
            }
            this.vehicleSpeeds.set(vehicle.vehicle_id, baseSpeed);
            
            // Początkowy stan paliwa 60-99%
            const fuel_level = 60 + Math.random() * 39;
            // Losowo zdecyduj, czy pojazd startuje w ruchu czy na postoju (90% w ruchu, 10% postój)
            const startStopped = Math.random() < 0.1;
            // Prędkość początkowa: jeśli postój to 0, jeśli ruch to bazowa + losowa zmiana 0-3 km/h
            let speed;
            if (startStopped || this.offlineVehicles.has(vehicle.vehicle_id)) {
              speed = 0;
            } else {
              speed = baseSpeed + Math.random() * 3;
            }
            this.positions.set(vehicle.vehicle_id, { lat, lng, speed, heading: Math.random() * 360, fuel_level });
            this.vehicleStates[vehicle.vehicle_id] = {
              route,
              seg,
              t,
              stopped: startStopped || this.offlineVehicles.has(vehicle.vehicle_id),
              stopCounter: 0,
              reversed: false
            };
          });

          console.log(`Symulator zainicjalizowany dla ${this.vehicles.length} pojazdów z trasami z pliku JSON`);
          resolve();
        }
        // db.close(); // Usunięte - używamy pojedynczego połączenia
      });
    });
  }

  // Generowanie ruchu po drogach
  generateMovement(vehicleId, currentPos) {
    const state = this.vehicleStates[vehicleId];
    if (!state) return currentPos;
    let { route, seg, t, stopped, stopCounter } = state;
    
    // Sprawdź czy pojazd jest offline
    if (this.offlineVehicles.has(vehicleId)) {
      return { ...currentPos, speed: 0 }; // Pojazd offline - nie porusza się
    }
    
    // Losowa szansa na postój lub ruszenie
    if (!stopped && Math.random() < 0.0025){
      stopped = true;
      stopCounter = 20 + Math.floor(Math.random() * 100); // 20-110 cykli postoju
    } else if (stopped && stopCounter > 0) {
      stopCounter--;
      if (stopCounter === 0) {
        stopped = false;
        // 1% szans na przejście w tryb offline po zakończeniu postoju (awaria)
        if (Math.random() < 0.01) {
          this.offlineVehicles.add(vehicleId);
          console.log(`🚨 Pojazd ${vehicleId} przeszedł w tryb OFFLINE po awarii (postój -> awaria silnika)`);
        }
      }
    }
    
    // Generowanie prędkości w zależności od stanu i typu pojazdu
    let speed;
    if (stopped) {
      speed = 0; // Postój - prędkość 0 km/h
    } else {
      // Pobierz prędkość bazową dla pojazdu
      const baseSpeed = this.vehicleSpeeds.get(vehicleId) || 50;
      // Dodaj losową zmianę w zakresie 0-3 km/h
      const speedVariation = Math.random() * 3;
      speed = baseSpeed + speedVariation;
    }
    
    // Przesuwamy się po trasie
    let dt = stopped ? 0 : 0.35 + Math.random() * 0.05; // 35-40% segmentu na cykl
    t += dt;
    
    while (t > 1 && seg < route.length - 2) {
      t -= 1;
      seg++;
    }
    
    // Jeśli dotarliśmy do końca trasy, wybierz nową trasę
    if (t > 1) {
      const currentRouteIndex = this.getCurrentRouteIndex(vehicleId);
      const currentRoute = this.routes[currentRouteIndex];
      const destinationCity = this.getDestinationCity(currentRoute);
      
      // Losowanie 50/50: powrót tą samą trasą czy nowa trasa
      const shouldReturnSameRoute = Math.random() < 0.5;
      
      let newRouteIndex;
      if (shouldReturnSameRoute) {
        // Powrót tą samą trasą (odwrócone segmenty)
        newRouteIndex = currentRouteIndex;
        const reversedRoute = this.convertGeoJSONToRoute(currentRoute).reverse();
        this.vehicleStates[vehicleId].route = reversedRoute;
        this.vehicleStates[vehicleId].reversed = true;
      } else {
        // Znajdź trasę z punktem początkowym w mieście docelowym
        const availableRoutes = this.findRoutesFromCity(destinationCity);
        
        if (availableRoutes.length > 0) {
          // Losuj trasę jeśli jest kilka dostępnych
          const randomIndex = Math.floor(Math.random() * availableRoutes.length);
          newRouteIndex = availableRoutes[randomIndex];
        } else {
          // Jeśli nie ma tras z tego miasta, odwróć obecną trasę
          newRouteIndex = currentRouteIndex;
          const reversedRoute = this.convertGeoJSONToRoute(currentRoute).reverse();
          this.vehicleStates[vehicleId].route = reversedRoute;
          this.vehicleStates[vehicleId].reversed = true;
        }
      }
      
      // Ustaw nową trasę
      const selectedRoute = this.routes[newRouteIndex];
      const route = this.convertGeoJSONToRoute(selectedRoute);
      
      // Sprawdź czy trasa jest odwrócona
      if (shouldReturnSameRoute && this.vehicleStates[vehicleId].reversed) {
        // Trasa już odwrócona, nie odwracaj ponownie
        this.vehicleStates[vehicleId].reversed = false;
      }
      
      this.vehicleStates[vehicleId].route = route;
      seg = 0;
      t = 0;
    }
    
    const start = route[seg];
    const end = route[seg + 1];
    const lat = start.lat + (end.lat - start.lat) * t;
    const lng = start.lng + (end.lng - start.lng) * t;
    

    let fuel_level = currentPos.fuel_level;
    if (!stopped && fuel_level > 0) {
      fuel_level -= speed * 0.0008;
    }
    // Losowe tankowanie pomiędzy 5% a 25%
    if (fuel_level <= 5 + Math.random() * 20) {
      fuel_level = 100;
    }
    
    // Zapisz stan
    this.vehicleStates[vehicleId] = { route, seg, t, stopped, stopCounter, reversed: state.reversed || false };
    return { lat, lng, speed, heading: Math.random() * 360, fuel_level };
  }

  // Zapisywanie lokalizacji do bazy danych
  async saveLocation(vehicleId, position) {
    const query = `
      INSERT INTO locations (vehicle_id, latitude, longitude, speed, heading, fuel_level)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    try {
      await executeQuery(query, [
        vehicleId,
        position.lat,
        position.lng,
        position.speed,
        position.heading,
        position.fuel_level
      ]);
    } catch (err) {
      console.error('Błąd podczas zapisywania lokalizacji:', err);
      throw err;
    }
  }

  // Aktualizacja statusu pojazdu
  async updateVehicleStatus(vehicleId, position) {
    // Sprawdź czy pojazd jest offline
    let status;
    if (this.offlineVehicles.has(vehicleId)) {
      status = 'offline';
    } else {
      // Status: 'w ruchu' jeśli prędkość > 0, 'postój' jeśli prędkość = 0
      status = position.speed > 0 ? 'w ruchu' : 'postój';
    }
    
    const query = `
      UPDATE vehicles 
      SET status = ?, last_seen = datetime('now'), fuel_level = ?
      WHERE vehicle_id = ?
    `;
    
    try {
      await executeQuery(query, [status, position.fuel_level, vehicleId]);
    } catch (err) {
      console.error('Błąd podczas aktualizacji statusu pojazdu:', err);
      throw err;
    }
  }

  // Główna pętla symulatora
  async simulateStep() {
    for (const vehicle of this.vehicles) {
      const currentPos = this.positions.get(vehicle.vehicle_id);
      if (!currentPos) continue;

      // Generuj nową pozycję
      const newPos = this.generateMovement(vehicle.vehicle_id, currentPos);
      this.positions.set(vehicle.vehicle_id, newPos);

      try {
        // Zapisz do bazy danych
        await this.saveLocation(vehicle.vehicle_id, newPos);
        await this.updateVehicleStatus(vehicle.vehicle_id, newPos);

        // Wyślij aktualizację przez Socket.IO tylko dla pojazdów online
        if (this.io && !this.offlineVehicles.has(vehicle.vehicle_id)) {
          this.io.emit('location_update', {
            vehicle_id: vehicle.vehicle_id,
            name: vehicle.name,
            type: vehicle.type,
            latitude: newPos.lat,
            longitude: newPos.lng,
            speed: newPos.speed,
            heading: newPos.heading,
            fuel_level: newPos.fuel_level,
            timestamp: moment().toISOString()
          });
        }
      } catch (error) {
        console.error(`Błąd podczas symulacji dla pojazdu ${vehicle.vehicle_id}:`, error);
      }
    }
  }

  // Uruchomienie symulatora
  start(intervalMs = 5000) {
    if (this.isRunning) {
      console.log('Symulator już działa');
      return;
    }

    this.isRunning = true;
    console.log(`Symulator uruchomiony (aktualizacja co ${intervalMs}ms)`);
    
    this.interval = setInterval(async () => {
      await this.simulateStep();
    }, intervalMs);
  }

  // Zatrzymanie symulatora
  stop() {
    if (!this.isRunning) {
      console.log('Symulator nie działa');
      return;
    }

    this.isRunning = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    console.log('Symulator zatrzymany');
  }

  // Pobranie aktualnych pozycji
  getCurrentPositions() {
    const positions = [];
    for (const [vehicleId, pos] of this.positions) {
      const vehicle = this.vehicles.find(v => v.vehicle_id === vehicleId);
      if (vehicle && !this.offlineVehicles.has(vehicleId)) {
        positions.push({
          vehicle_id,
          name: vehicle.name,
          type: vehicle.type,
          ...pos
        });
      }
    }
    return positions;
  }

  // Pobranie indeksu obecnej trasy dla pojazdu
  getCurrentRouteIndex(vehicleId) {
    const state = this.vehicleStates[vehicleId];
    if (!state) return 0;
    
    // Znajdź trasę, która pasuje do obecnej trasy pojazdu
    for (let i = 0; i < this.routes.length; i++) {
      const route = this.convertGeoJSONToRoute(this.routes[i]);
      if (this.arraysEqual(route, state.route) || this.arraysEqual(route, state.route.slice().reverse())) {
        return i;
      }
    }
    return 0; // Fallback
  }

  // Pobranie miasta docelowego z trasy
  getDestinationCity(route) {
    if (route.properties && route.properties.miasto_koniec) {
      return route.properties.miasto_koniec;
    }
    // Fallback - użyj ostatniego punktu trasy
    const coordinates = route.geometry.coordinates;
    const lastPoint = coordinates[coordinates.length - 1];
    return `Punkt_${lastPoint[0].toFixed(2)}_${lastPoint[1].toFixed(2)}`;
  }

  // Znalezienie tras z punktem początkowym w danym mieście
  findRoutesFromCity(city) {
    const availableRoutes = [];
    
    for (let i = 0; i < this.routes.length; i++) {
      const route = this.routes[i];
      if (route.properties) {
        // Sprawdź czy miasto jest punktem początkowym lub końcowym
        if (route.properties.miasto_start === city || route.properties.miasto_koniec === city) {
          availableRoutes.push(i);
        }
      }
    }
    
    return availableRoutes;
  }

  // Porównanie dwóch tablic
  arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i].lat !== b[i].lat || a[i].lng !== b[i].lng) {
        return false;
      }
    }
    return true;
  }
}

module.exports = DataSimulator; 