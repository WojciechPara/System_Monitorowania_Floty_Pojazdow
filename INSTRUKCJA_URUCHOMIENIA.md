# Instrukcja Uruchomienia Systemu Monitorowania Floty Pojazdów

## Wymagania systemowe

- Node.js (wersja 14 lub nowsza)
- npm (wersja 6 lub nowsza)
- Przeglądarka internetowa (Chrome, Firefox, Safari, Edge)

## Krok 1: Instalacja zależności

Otwórz terminal w głównym katalogu projektu i wykonaj:

```bash
# Instalacja wszystkich zależności (backend + frontend)
npm run install-all
```

To polecenie zainstaluje zależności dla:
- Głównego projektu
- Serwera backend (Node.js + Express)
- Klienta frontend (React + TypeScript)

## Krok 2: Inicjalizacja bazy danych

```bash
# Przejdź do katalogu serwera
cd server

# Zainicjalizuj bazę danych z przykładowymi danymi
npm run init-db
```

To utworzy bazę danych SQLite z przykładowymi pojazdami i lokalizacjami.

## Krok 3: Uruchomienie systemu

W głównym katalogu projektu:

```bash
# Uruchom serwer i klienta jednocześnie
npm run dev
```

To polecenie uruchomi:
- **Backend** na porcie 5000 (http://localhost:5000)
- **Frontend** na porcie 3000 (http://localhost:3000)
- **Symulator danych** - automatycznie generuje ruch pojazdów

## Krok 4: Dostęp do aplikacji

Otwórz przeglądarkę i przejdź do:
**http://localhost:3000**

## Funkcjonalności systemu

### 🏠 Dashboard
- Przegląd całej floty
- Statystyki w czasie rzeczywistym
- Status pojazdów (online/offline)
- Poziom paliwa

### 🗺️ Mapa
- Interaktywna mapa z lokalizacją pojazdów
- Aktualizacje w czasie rzeczywistym
- Szczegółowe informacje o pojazdach
- Różne kolory dla różnych typów pojazdów

### 🚛 Lista pojazdów
- Wszystkie pojazdy w systemie
- Filtrowanie i wyszukiwanie
- Status i podstawowe informacje
- Linki do szczegółów

### 📊 Szczegóły pojazdu
- Pełne informacje o pojeździe
- Historia tras
- Statystyki użytkowania
- Aktualna lokalizacja

## Symulator danych

System automatycznie uruchamia symulator, który:
- Generuje ruch 5 przykładowych pojazdów w Warszawie
- Aktualizuje pozycje co 5 sekund
- Symuluje zużycie paliwa
- Wysyła aktualizacje przez WebSocket

## Struktura API

### Endpointy pojazdów
- `GET /api/vehicles` - Lista wszystkich pojazdów
- `GET /api/vehicles/:id` - Szczegóły pojazdu
- `POST /api/vehicles` - Dodaj nowy pojazd
- `PUT /api/vehicles/:id` - Aktualizuj pojazd
- `DELETE /api/vehicles/:id` - Usuń pojazd

### Endpointy lokalizacji
- `GET /api/locations` - Aktualne lokalizacje
- `GET /api/locations/:vehicleId` - Historia lokalizacji
- `POST /api/locations` - Dodaj lokalizację

### Endpointy tras
- `GET /api/routes` - Wszystkie trasy
- `GET /api/routes/:vehicleId` - Trasy pojazdu
- `GET /api/routes/stats/overview` - Statystyki floty

## Rozwiązywanie problemów

### Problem: Błąd "Port already in use"
```bash
# Sprawdź, które procesy używają portów
netstat -ano | findstr :3000
netstat -ano | findstr :5000

# Zatrzymaj procesy lub zmień porty w package.json
```

### Problem: Błąd bazy danych
```bash
# Usuń starą bazę i zainicjalizuj ponownie
cd server
rm database/fleet.db
npm run init-db
```

### Problem: Błędy TypeScript
```bash
# Wyczyść cache i zainstaluj ponownie
cd client
rm -rf node_modules
npm install
```

## Zatrzymanie systemu

W terminalu naciśnij `Ctrl+C` aby zatrzymać serwer i klienta.

## Dodatkowe informacje

- **Baza danych**: SQLite (plik `server/database/fleet.db`)
- **Mapy**: OpenStreetMap (darmowe)
- **Komunikacja w czasie rzeczywistym**: Socket.IO
- **Frontend**: React 18 + TypeScript
- **Backend**: Node.js + Express

## Rozszerzenie systemu

System można łatwo rozszerzyć o:
- Dodanie nowych typów pojazdów
- Integrację z rzeczywistymi urządzeniami GPS
- Dodanie systemu powiadomień
- Eksport danych do Excel/PDF
- Dodanie systemu użytkowników i uprawnień 