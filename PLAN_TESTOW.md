# Plan Testów - System Monitorowania Floty Pojazdów

## 1. Wprowadzenie

### 1.1 Cel dokumentu
Ten dokument opisuje strategię testowania dla Systemu Monitorowania Floty Pojazdów, zawierającą różne typy testów, ich zakres, narzędzia i procedury.

### 1.2 Zakres testowania
- Frontend (React/TypeScript)
- Backend (Node.js/Express)
- Baza danych (SQLite)
- API REST
- Komunikacja WebSocket
- Integracja między komponentami

## 2. Strategia testowania

### 2.1 Piramida testów
```
    /\
   /  \     Testy E2E (Cypress)
  /____\    Testy integracyjne (Supertest)
 /______\   Testy jednostkowe (Jest)
```

### 2.2 Priorytety testów
1. **WYSOKI**: Testy jednostkowe, testy integracyjne API
2. **ŚREDNI**: Testy E2E, testy wydajności
3. **NISKI**: Testy bezpieczeństwa, testy akceptacyjne

## 3. Typy testów

### 3.1 Testy jednostkowe (Unit Tests)

#### 3.1.1 Backend
- **Lokalizacja**: `server/__tests__/`
- **Narzędzia**: Jest, Supertest
- **Pokrycie**: 
  - Funkcje bazy danych (`connection.js`)
  - Endpointy API (`routes/`)
  - Logika biznesowa
  - Middleware

#### 3.1.2 Frontend
- **Lokalizacja**: `client/src/__tests__/`
- **Narzędzia**: Jest, React Testing Library
- **Pokrycie**:
  - Komponenty React
  - Hooki i konteksty
  - Funkcje pomocnicze
  - Walidacja danych

### 3.2 Testy integracyjne

#### 3.2.1 API Integration
- **Lokalizacja**: `server/__tests__/routes/`
- **Narzędzia**: Supertest, Jest
- **Testowane funkcje**:
  - Endpointy CRUD dla pojazdów
  - Endpointy lokalizacji
  - Endpointy tras
  - Autoryzacja i uwierzytelnianie

#### 3.2.2 Database Integration
- **Lokalizacja**: `server/__tests__/database/`
- **Narzędzia**: Jest, SQLite
- **Testowane funkcje**:
  - Połączenie z bazą danych
  - Zapytania SQL
  - Transakcje
  - Obsługa błędów

### 3.3 Testy end-to-end (E2E)

#### 3.3.1 Scenariusze użytkownika
- **Lokalizacja**: `cypress/e2e/`
- **Narzędzia**: Cypress
- **Testowane funkcje**:
  - Logowanie i wylogowanie
  - Nawigacja między stronami
  - Zarządzanie pojazdami
  - Wyświetlanie mapy
  - Dashboard i statystyki

## 4. Narzędzia testowe

### 4.1 Backend
```json
{
  "jest": "^29.7.0",
  "supertest": "^6.3.3"
}
```

### 4.2 Frontend
```json
{
  "@testing-library/jest-dom": "^5.17.0",
  "@testing-library/react": "^13.4.0",
  "@testing-library/user-event": "^14.5.1"
}
```

### 4.3 E2E
```json
{
  "cypress": "^13.6.0"
}
```

## 5. Konfiguracja testów

### 5.1 Backend (server/package.json)
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

### 5.2 Frontend (client/package.json)
```json
{
  "scripts": {
    "test": "react-scripts test",
    "test:coverage": "react-scripts test --coverage --watchAll=false"
  }
}
```

### 5.3 Główny projekt (package.json)
```json
{
  "scripts": {
    "test": "npm run test:server && npm run test:client",
    "test:e2e": "cypress run",
    "test:coverage": "npm run test:server:coverage && npm run test:client:coverage"
  }
}
```

## 6. Procedury testowe

### 6.1 Uruchamianie testów

#### 6.1.1 Testy jednostkowe
```bash
# Backend
cd server && npm test

# Frontend
cd client && npm test

# Wszystkie testy
npm test
```

#### 6.1.2 Testy E2E
```bash
# Uruchom serwer i aplikację
npm run dev

# W nowym terminalu
npm run test:e2e
```

#### 6.1.3 Pokrycie kodu
```bash
npm run test:coverage
```

### 6.2 Analiza wyników

#### 6.2.1 Raporty pokrycia
- Backend: `server/coverage/`
- Frontend: `client/coverage/`

#### 6.2.2 Raporty Cypress
- Screenshots: `cypress/screenshots/`
- Videos: `cypress/videos/`

## 7. Kryteria akceptacji

### 7.1 Pokrycie kodu
- **Minimum**: 80% pokrycia dla backendu i frontendu
- **Cel**: 90% pokrycia

### 7.2 Czas wykonania
- **Testy jednostkowe**: < 30 sekund
- **Testy integracyjne**: < 2 minuty
- **Testy E2E**: < 5 minut

### 7.3 Kryteria jakości
- Wszystkie testy muszą przechodzić
- Brak błędów w konsoli
- Poprawne działanie wszystkich funkcjonalności

## 8. Testy wydajności (opcjonalne)

### 8.1 API Performance
- **Narzędzia**: Artillery, Apache Bench
- **Metryki**:
  - Czas odpowiedzi < 200ms
  - Throughput > 100 req/s
  - Współczynnik błędów < 1%

### 8.2 Frontend Performance
- **Narzędzia**: Lighthouse, WebPageTest
- **Metryki**:
  - First Contentful Paint < 1.5s
  - Largest Contentful Paint < 2.5s
  - Cumulative Layout Shift < 0.1

## 9. Testy bezpieczeństwa (podstawowe)

### 9.1 Walidacja danych wejściowych
- Testy SQL Injection
- Testy XSS
- Walidacja typów danych

### 9.2 Autoryzacja
- Testy dostępu do chronionych endpointów
- Testy tokenów uwierzytelniających
- Testy sesji użytkownika

## 10. Utrzymanie testów

### 10.1 Regularne przeglądy
- Cotygodniowe sprawdzanie pokrycia kodu
- Miesięczne przeglądy testów E2E
- Aktualizacja testów przy zmianach w API

### 10.2 Dokumentacja
- Aktualizacja tego planu przy zmianach
- Dokumentowanie nowych testów
- Instrukcje dla nowych deweloperów

## 11. Automatyzacja

### 11.1 CI/CD Pipeline
```yaml
# Przykład dla GitHub Actions
- name: Run Tests
  run: |
    npm install
    npm run test
    npm run test:e2e
```

### 11.2 Pre-commit hooks
- Uruchamianie testów jednostkowych przed commit
- Sprawdzanie formatowania kodu
- Walidacja TypeScript

## 12. Podsumowanie

Ten plan testów zapewnia kompleksowe pokrycie funkcjonalności Systemu Monitorowania Floty Pojazdów, obejmując testy jednostkowe, integracyjne i end-to-end. Regularne wykonywanie tych testów gwarantuje wysoką jakość kodu i stabilność aplikacji. 