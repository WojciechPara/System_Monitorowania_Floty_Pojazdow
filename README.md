# System Monitorowania Floty Pojazdów

Podstawowa wersja systemu do monitorowania floty pojazdów z funkcjonalnościami:
- Dashboard z przeglądem floty
- Mapa z lokalizacją pojazdów w czasie rzeczywistym
- Lista pojazdów z podstawowymi informacjami
- Historia tras
- Status pojazdów (online/offline, prędkość, paliwo)

## Technologie

- **Frontend**: React.js + TypeScript + Leaflet.js
- **Backend**: Node.js + Express
- **Baza danych**: SQLite
- **Mapy**: OpenStreetMap

## Instalacja i uruchomienie

1. Zainstaluj wszystkie zależności:
```bash
npm run install-all
```

2. Uruchom system w trybie deweloperskim:
```bash
npm run dev
```

3. Otwórz przeglądarkę i przejdź do: `http://localhost:3000`

## Struktura projektu

```
├── client/          # Frontend React
├── server/          # Backend Node.js
├── database/        # Baza danych SQLite
└── docs/           # Dokumentacja
```

## Funkcjonalności

- **Dashboard**: Przegląd całej floty z kluczowymi metrykami
- **Mapa**: Interaktywna mapa z lokalizacją pojazdów
- **Pojazdy**: Lista wszystkich pojazdów z możliwością filtrowania
- **Szczegóły pojazdu**: Szczegółowe informacje o wybranym pojeździe
- **Historia**: Przegląd tras i aktywności pojazdów 