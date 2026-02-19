# Project Idea - WhenAreWeFree

Aplikacja webowa umożliwiająca użytkownikom wybieranie najbardziej optymalnych dat na spotkania grupowe.

Views:
1. Użytkownik otwiera stronę i tworzy nowy kalendarz 
    Może być opcja tworzenia nowego lub otwarcia istniejącego za pomocą kodu (można też wygenerować link)
2. Opcje przy tworzeniu nowego kalendarza: nazwa, opis, zakres dat 
3. Inne osoby mogą wejść linkiem lub kodem na stronę i widzą ekran, który każe im wpisać imię, potem przenosi ich do kalendarza
4. Zaznaczają one w kalendarzu kiedy mają czas na spotkanie (STATUSY: available / maybe)

Każdy z linkiem może edytować nazwę, opis, zakres dat...

# Model danych

### Calendar
- id
- name
- description
- start_date
- end_date
- token

### Participants
- id
- name
- color
- calendar_id

### Busy Blocks (one block per day) - it's possible to select few whole days at once but it's saved as few seperate blocks
- id
- participant_id
- day
- start_time
- end_time
- status (available / maybe)