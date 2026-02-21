import db from '../db.js';

export function createAvailabilityBlock({ participant_id, start_date, start_time, end_date, end_time }) {
    return db.prepare(`
        INSERT INTO availability_blocks (participant_id, start_date, start_time, end_date, end_time)
        VALUES (?, ?, ?, ?, ?)
    `).run(participant_id, start_date, start_time, end_date, end_time);
}

export function updateAvailabilityBlockById(id, { start_date, start_time, end_date, end_time }) {
    return db.prepare(`
        UPDATE availability_blocks
        SET start_date = ?, start_time = ?, end_date = ?, end_time = ?
        WHERE id = ?
    `).run(start_date, start_time, end_date, end_time, id);
}

export function getAvailabilityBlockById(id) {
    return db.prepare(`
        SELECT participant_id
        FROM availability_blocks
        WHERE id = ?
    `).get(id);
}

export function deleteAvailabilityBlockById(id) {
    return db.prepare('DELETE FROM availability_blocks WHERE id = ?').run(id);
}

export function getCalendarOwnerByParticipantId(participantId) {
    return db.prepare(`
        SELECT owner_participant_id
        FROM calendars
        WHERE id = (SELECT calendar_id FROM participants WHERE id = ?)
    `).get(participantId);
}
