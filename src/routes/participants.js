import express from 'express';
import db from '../db.js';

const colors = ["#f94144","#f3722c","#f8961e","#f9844a","#f9c74f","#90be6d","#43aa8b","#4d908e","#577590","#277da1"]

const router = express.Router();

// Create a new participant
router.post('/', (req, res) => {
    const { name, calendar_token } = req.body;

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

    res.status(201).json({ id: result.lastInsertRowid, name, color });
});

// Delete a participant
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const result = db.prepare('DELETE FROM participants WHERE id = ?').run(id);

    if (result.changes === 0) {
        return res.status(404).json({ error: 'Participant not found' });
    }

    res.json({ success: true });
});

export default router;