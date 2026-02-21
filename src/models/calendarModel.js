import db from '../db.js';

export function createCalendar({ name, description, start_date, end_date, start_hour, end_hour, token }) {
    const stmt = db.prepare(`
        INSERT INTO calendars (name, description, start_date, end_date, start_hour, end_hour, token)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    return stmt.run(name, description, start_date, end_date, start_hour, end_hour, token);
}

export function getCalendarByToken(token) {
    return db.prepare('SELECT * FROM calendars WHERE token = ?').get(token);
}

export function updateCalendarByToken(token, { name, description, start_date, end_date, start_hour, end_hour }) {
    return db.prepare(`
        UPDATE calendars
        SET name = ?, description = ?, start_date = ?, end_date = ?, start_hour = ?, end_hour = ?
        WHERE token = ?
    `).run(name, description, start_date, end_date, start_hour, end_hour, token);
}

export function deleteCalendarByToken(token) {
    return db.prepare('DELETE FROM calendars WHERE token = ?').run(token);
}

export function getFullCalendarByToken(token) {
    const calendar = getCalendarByToken(token);
    if (!calendar) return null;

    const participants = db.prepare('SELECT * FROM participants WHERE calendar_id = ?').all(calendar.id);
    const availabilityBlocks = db.prepare(`
        SELECT *
        FROM availability_blocks
        WHERE participant_id IN (
            SELECT id FROM participants WHERE calendar_id = ?
        )
    `).all(calendar.id);

    return { calendar, participants, availabilityBlocks };
}

export function calendarTokenExists(token) {
    return Boolean(db.prepare('SELECT 1 FROM calendars WHERE token = ?').get(token));
}
