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
        token VARCHAR(255) UNIQUE NOT NULL,
        owner_participant_id INTEGER
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
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE
    );
`);

// Migration: update availability_blocks schema if old columns exist
try {
    const tableInfo = db.prepare("PRAGMA table_info(availability_blocks)").all();
    const hasDate = tableInfo.some(col => col.name === 'date');
    const hasStatus = tableInfo.some(col => col.name === 'status');
    const hasStartDate = tableInfo.some(col => col.name === 'start_date');
    
    if (hasDate && !hasStartDate) {
        console.log('Migrating availability_blocks table to new schema...');
        
        // Create new table with correct schema
        db.exec(`
            CREATE TABLE availability_blocks_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                participant_id INTEGER NOT NULL,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE
            );
        `);
        
        // Copy data from old table to new (map date -> start_date and end_date)
        db.exec(`
            INSERT INTO availability_blocks_new (id, participant_id, start_date, end_date, start_time, end_time)
            SELECT id, participant_id, date, date, start_time, end_time
            FROM availability_blocks;
        `);
        
        // Drop old table and rename new one
        db.exec(`
            DROP TABLE availability_blocks;
            ALTER TABLE availability_blocks_new RENAME TO availability_blocks;
        `);
        
        console.log('Migration completed successfully.');
    }
} catch (err) {
    console.error('Migration error (continuing anyway):', err);
}

export default db;