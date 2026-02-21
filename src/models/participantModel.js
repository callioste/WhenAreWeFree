import db from '../db.js';

const colors = ['#f94144', '#f3722c', '#f8961e', '#f9c74f', '#90be6d', '#43aa8b', '#4d908e', '#577590', '#277da1'];

export function getCalendarIdByToken(calendarToken) {
    return db.prepare('SELECT id FROM calendars WHERE token = ?').get(calendarToken);
}

export function createParticipant({ calendarId, name, color }) {
    return db.prepare(`
        INSERT INTO participants (calendar_id, name, color)
        VALUES (?, ?, ?)
    `).run(calendarId, name, color);
}

export function getUsedColors(calendarId) {
    return db
        .prepare('SELECT color FROM participants WHERE calendar_id = ?')
        .all(calendarId)
        .map(p => p.color);
}

export function pickParticipantColor(calendarId) {
    const usedColors = getUsedColors(calendarId);
    const availableColors = colors.filter(c => !usedColors.includes(c));

    if (availableColors.length > 0) {
        return availableColors[Math.floor(Math.random() * availableColors.length)];
    }

    return '#' + Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, '0');
}

export function setCalendarOwner({ participantId, calendarId }) {
    return db.prepare('UPDATE calendars SET owner_participant_id = ? WHERE id = ?').run(participantId, calendarId);
}

export function getParticipantById(id) {
    return db.prepare('SELECT * FROM participants WHERE id = ?').get(id);
}

export function getCalendarOwnerByCalendarId(calendarId) {
    return db.prepare('SELECT owner_participant_id FROM calendars WHERE id = ?').get(calendarId);
}

export function deleteParticipantById(id) {
    return db.prepare('DELETE FROM participants WHERE id = ?').run(id);
}
