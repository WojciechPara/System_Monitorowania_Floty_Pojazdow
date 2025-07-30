# Instrukcja Uruchamiania Testów

## 🚀 Szybki start

### 1. Instalacja zależności
```bash
# Zainstaluj wszystkie zależności
npm run install-all
```

### 2. Uruchomienie testów
```bash
# Wszystkie testy (backend + frontend)
npm test

# Tylko testy backendu
npm run test:server

# Tylko testy frontendu
npm run test:client

# Testy E2E
npm run test:e2e

# Pokrycie kodu
npm run test:coverage
```

## 📋 Szczegółowe instrukcje

### Testy Backendu

#### Struktura testów
```
server/
├── __tests__/
│   ├── database/
│   │   └── connection.test.js
│   ├── routes/
│   │   └── vehicles.test.js
│   └── utils/
```

#### Uruchamianie
```bash
cd server

# Testy z watch mode
npm test

# Testy z pokryciem
npm run test:coverage

# Pojedynczy test
npm test -- --testNamePattern="should create new vehicle"
```

#### Przykładowe testy
- ✅ Połączenie z bazą danych
- ✅ Endpointy CRUD dla pojazdów
- ✅ Obsługa błędów
- ✅ Walidacja danych

### Testy Frontendu

#### Struktura testów
```
client/src/
├── __tests__/
│   ├── Login.test.tsx
│   └── VehicleContext.test.tsx
└── setupTests.ts
```

#### Uruchamianie
```bash
cd client

# Testy w trybie interaktywnym
npm test

# Testy z pokryciem
npm run test:coverage

# Testy bez watch mode
npm test -- --watchAll=false
```

#### Przykładowe testy
- ✅ Komponent logowania
- ✅ Kontekst pojazdów
- ✅ Interakcje użytkownika
- ✅ Obsługa stanów loading/error

### Testy E2E (Cypress)

#### Struktura testów
```
cypress/
├── e2e/
│   ├── login.cy.js
│   └── navigation.cy.js
├── support/
│   ├── commands.js
│   └── e2e.js
└── cypress.config.js
```

#### Uruchamianie
```bash
# Uruchom aplikację w tle
npm run dev

# W nowym terminalu - testy E2E
npm run test:e2e

# Interaktywny tryb Cypress
npm run test:e2e:open
```

#### Przykładowe testy
- ✅ Logowanie i wylogowanie
- ✅ Nawigacja między stronami
- ✅ Zarządzanie pojazdami
- ✅ Wyświetlanie mapy

## 🔧 Konfiguracja

### Backend (server/package.json)
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "jest": {
    "testEnvironment": "node",
    "collectCoverageFrom": [
      "**/*.js",
      "!**/node_modules/**",
      "!**/coverage/**"
    ]
  }
}
```

### Frontend (client/package.json)
```json
{
  "scripts": {
    "test": "react-scripts test",
    "test:coverage": "react-scripts test --coverage --watchAll=false"
  },
  "jest": {
    "collectCoverageFrom": [
      "src/**/*.{js,jsx,ts,tsx}",
      "!src/index.tsx"
    ]
  }
}
```

### Cypress (cypress.config.js)
```javascript
module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720
  }
});
```

## 📊 Raporty i analiza

### Pokrycie kodu
```bash
# Generuj raporty pokrycia
npm run test:coverage

# Otwórz raporty w przeglądarce
# Backend: server/coverage/lcov-report/index.html
# Frontend: client/coverage/lcov-report/index.html
```

### Raporty Cypress
```bash
# Screenshots błędów
cypress/screenshots/

# Nagrania testów
cypress/videos/
```

## 🐛 Rozwiązywanie problemów

### Częste problemy

#### 1. Błędy połączenia z bazą danych
```bash
# Sprawdź czy baza istnieje
cd server
node database/init.js
```

#### 2. Porty zajęte
```bash
# Sprawdź procesy na portach
netstat -ano | findstr :3000
netstat -ano | findstr :5001

# Zatrzymaj procesy
taskkill /PID <PID> /F
```

#### 3. Błędy Cypress
```bash
# Wyczyść cache Cypress
npx cypress cache clear

# Zainstaluj ponownie
npm install cypress
```

#### 4. Błędy testów React
```bash
# Wyczyść cache
cd client
npm run build
rm -rf node_modules
npm install
```

### Debugowanie testów

#### Backend
```bash
# Debug z Node.js
node --inspect-brk node_modules/.bin/jest --runInBand

# Verbose output
npm test -- --verbose
```

#### Frontend
```bash
# Debug w przeglądarce
npm test -- --debug

# Pojedynczy test
npm test -- --testNamePattern="Login Component"
```

#### Cypress
```bash
# Debug mode
npx cypress open --config video=false

# Pojedynczy test
npx cypress run --spec "cypress/e2e/login.cy.js"
```

## 📝 Dodawanie nowych testów

### Backend - nowy test
```javascript
// server/__tests__/routes/new-feature.test.js
const request = require('supertest');
const express = require('express');

describe('New Feature', () => {
  test('should work correctly', async () => {
    // Test implementation
  });
});
```

### Frontend - nowy test
```typescript
// client/src/__tests__/NewComponent.test.tsx
import { render, screen } from '@testing-library/react';
import NewComponent from '../components/NewComponent';

describe('NewComponent', () => {
  test('should render correctly', () => {
    render(<NewComponent />);
    expect(screen.getByText('Expected text')).toBeInTheDocument();
  });
});
```

### E2E - nowy test
```javascript
// cypress/e2e/new-feature.cy.js
describe('New Feature', () => {
  it('should work end-to-end', () => {
    cy.visit('/');
    // Test implementation
  });
});
```

## 🎯 Najlepsze praktyki

### 1. Organizacja testów
- Grupuj testy logicznie
- Używaj opisowych nazw testów
- Trzymaj testy blisko testowanego kodu

### 2. Mockowanie
- Mockuj zewnętrzne zależności
- Używaj realistycznych danych testowych
- Unikaj mockowania zbyt wielu rzeczy

### 3. Asercje
- Testuj jedną rzecz na raz
- Używaj precyzyjnych asercji
- Sprawdzaj zarówno pozytywne jak i negatywne scenariusze

### 4. Czyszczenie
- Resetuj stan między testami
- Czyść mocki po każdym teście
- Używaj `beforeEach` i `afterEach`

## 📞 Wsparcie

### Przydatne komendy
```bash
# Sprawdź wersje narzędzi
npx jest --version
npx cypress --version

# Pomoc
npm test -- --help
npx cypress --help
```

### Dokumentacja
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Cypress Documentation](https://docs.cypress.io/)

### Kontakt
W przypadku problemów z testami, sprawdź:
1. Logi błędów w konsoli
2. Raporty pokrycia kodu
3. Dokumentację narzędzi testowych
4. Pliki konfiguracyjne projektu 