import Database from 'better-sqlite3';

const db = new Database('data.db');

db.exec(`
    CREATE TABLE IF NOT EXISTS calendars (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(50) NOT NULL,
        description VARCHAR(255),
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        start_hour INTEGER NOT NULL DEFAULT 0,
        end_hour INTEGER NOT NULL DEFAULT 23,
        token VARCHAR(255) UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS participants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        calendar_id INTEGER NOT NULL,
        name VARCHAR(50) NOT NULL,
        color VARCHAR(7) NOT NULL,
        FOREIGN KEY (calendar_id) REFERENCES calendars(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS availability_blocks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        participant_id INTEGER NOT NULL,
        date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        status VARCHAR(20) CHECK(status IN ('available','maybe')) NOT NULL,
        FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE
    );
`);

export default db;