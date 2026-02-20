import express from 'express';
import db from '../db.js';

const colors = ["#f94144","#f3722c","#f8961e","#f9c74f","#90be6d","#43aa8b","#4d908e","#577590","#277da1"]

const router = express.Router();

// Create a new participant
router.post('/', (req, res) => {
    const { name, calendar_token, set_as_owner } = req.body;

    if (!name || !calendar_token) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const calendar = db
        .prepare('SELECT id FROM calendars WHERE token = ?')
        .get(calendar_token);

    if (!calendar) {
        return res.status(404).json({ error: 'Calendar not found' });
    }

    const usedColors = db
        .prepare('SELECT color FROM participants WHERE calendar_id = ?')
        .all(calendar.id)
        .map(p => p.color);

    const availableColors = colors.filter(c => !usedColors.includes(c));

    let color;

    if (availableColors.length > 0) {
        color = availableColors[
            Math.floor(Math.random() * availableColors.length)
        ];
    } else {
        color = "#" + Math.floor(Math.random() * 16777215)
            .toString(16)
            .padStart(6, "0");
    }

    const result = db.prepare(`
        INSERT INTO participants (calendar_id, name, color) 
        VALUES (?, ?, ?)
    `).run(calendar.id, name, color);

    const newId = result.lastInsertRowid;

    if (set_as_owner) {
        db.prepare('UPDATE calendars SET owner_participant_id = ? WHERE id = ?').run(newId, calendar.id);
    }

    res.status(201).json({ id: newId, name, color });
});

// Delete a participant (only calendar owner can delete participants)
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const requesterId = req.query.requester_id;

    if (!requesterId) {
        return res.status(400).json({ error: 'Missing requester_id query parameter' });
    }

    const participant = db.prepare('SELECT calendar_id FROM participants WHERE id = ?').get(id);

    if (!participant) {
        return res.status(404).json({ error: 'Participant not found' });
    }

    const calendar = db.prepare('SELECT owner_participant_id FROM calendars WHERE id = ?').get(participant.calendar_id);

    if (!calendar) {
        return res.status(404).json({ error: 'Calendar not found' });
    }

    // Only calendar owner may delete participants
    if (String(calendar.owner_participant_id) !== String(requesterId)) {
        return res.status(403).json({ error: 'Tylko twórca kalendarza może usuwać uczestników' });
    }

    const result = db.prepare('DELETE FROM participants WHERE id = ?').run(id);

    if (result.changes === 0) {
        return res.status(404).json({ error: 'Participant not found' });
    }

    res.json({ success: true });
});

export default router;