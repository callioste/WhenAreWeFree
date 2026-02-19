import express from 'express';
import db from '../db.js';

const router = express.Router();

// Create a new availability block
router.post('/', (req, res) => {
    const { participant_id, date, start_time, end_time, status } = req.body;

    if (!participant_id || !date || !start_time || !end_time || !status) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['available', 'maybe'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });   
    }

    const participant = db
        .prepare('SELECT id FROM participants WHERE id = ?')
        .get(participant_id);

    if (!participant) {
        return res.status(404).json({ error: 'Participant not found' });
    }

    const result = db.prepare(`
        INSERT INTO availability_blocks (participant_id, date, start_time, end_time, status)
        VALUES (?, ?, ?, ?, ?)`)
    .run(participant_id, date, start_time, end_time, status);

    res.status(201).json({ id: result.lastInsertRowid, participant_id, date, start_time, end_time, status });
});

// Update an availability block
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { date, start_time, end_time, status } = req.body; 

    if (!date || !start_time || !end_time || !status) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const block = db.prepare('SELECT id FROM availability_blocks WHERE id = ?').get(id);

    if (!block) {
        return res.status(404).json({ error: 'availability block not found' });
    }

    const stmt = db.prepare(`
        UPDATE availability_blocks
        SET date = ?, start_time = ?, end_time = ?, status = ?
        WHERE id = ?`);
    const info = stmt.run(date, start_time, end_time, status, id);   

    if (info.changes === 0) {
        return res.status(404).json({ error: 'availability block not found' });
    }

    res.json({ id, date, start_time, end_time, status });
});

// Delete a availability block
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM availability_blocks WHERE id = ?');
    const info = stmt.run(id);      

    if (info.changes === 0) {   
        return res.status(404).json({ error: 'availability block not found' });
    }   
    res.json({ success: true });
});

export default router;