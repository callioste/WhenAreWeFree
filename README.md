# WhenAreWeFree

Aplikacja do tworzenia i współdzielenia kalendarza dostępności. Umożliwia wybranie dogodnego dla wszsyt

## Wymagania

- Node.js
- npm

## Instalacja

### 1) Zainstaluj zależności backendu

```bash
cd src
npm install
```

## Konfiguracja `.env`

Plik w katalogu głównym projektu:

```dotenv
PORT=3000
DB_PATH=data.db
```

- `PORT` – port serwera Express
- `DB_PATH` – ścieżka do pliku SQLite

## Uruchomienie

Z katalogu root:

```bash
node src/index.js
```

Po starcie serwer działa na:

- `http://localhost:3000` (lub inny port z `.env`)

Frontend jest serwowany statycznie z katalogu `public`.

## Jak to działa

1. Użytkownik tworzy kalendarz (strona `create-calendar.html`).
2. Backend zapisuje rekord w tabeli `calendars` i generuje `token`.
3. Uczestnicy dołączają po kodzie (`token`) i są zapisywani w tabeli `participants`.
4. Uczestnicy dodają bloki dostępności do tabeli `availability_blocks`.
5. Widok kalendarza (`calendar.html`) pobiera pełne dane z API i renderuje siatkę z dostępnością. Zbieżności dostępności wszystkich użytkowników zaznaczają się na kolor zielony.

## Struktura projektu

- `public/` – frontend (HTML/CSS/JS)
- `src/routes/` – endpointy API
- `src/models/` – operacje na bazie danych
- `src/middleware/` – middleware (obsługa async + błędów)
- `src/db.js` – inicjalizacja SQLite

## API (przykładowe endpointy)

- `POST /calendars`
- `GET /calendars/:token`
- `PUT /calendars/:token`
- `DELETE /calendars/:token`
- `GET /calendars/:token/full`
- `POST /participants`
- `DELETE /participants/:id`
- `POST /availability-blocks`
- `PUT /availability-blocks/:id`
- `DELETE /availability-blocks/:id`

## Obsługa błędów

- Walidacja danych wejściowych w trasach (`400`, `403`, `404`)
- Globalny middleware błędów w Express (`src/middleware/errorHandler.js`)
- Middleware `asyncHandler` do przechwytywania błędów asynchronicznych
