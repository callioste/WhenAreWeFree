import express from 'express';
import db from '../db.js';

const router = express.Router();

// Create a new availability block
router.post('/', (req, res) => {
    try {
        const { participant_id, start_date, start_time, end_date, end_time} = req.body;
        const requesterId = req.query.requester_id;

        if (!requesterId) {
            return res.status(400).json({ error: 'Missing requester_id query parameter' });
        }

        if (!participant_id || !start_date || !start_time || !end_date || !end_time) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const startDateTime = new Date(`${start_date}T${start_time}`);
        const endDateTime   = new Date(`${end_date}T${end_time}`);

        if (startDateTime >= endDateTime) {
            return res.status(400).json({ error: 'Start must be before end' });
        }

        const participant = db
            .prepare('SELECT id, calendar_id FROM participants WHERE id = ?')
            .get(participant_id);

        if (!participant) {
            return res.status(404).json({ error: 'Participant not found' });
        }

        const calendar = db
            .prepare('SELECT owner_participant_id FROM calendars WHERE id = ?')
            .get(participant.calendar_id);

        if (calendar &&
            String(calendar.owner_participant_id) !== String(requesterId) &&
            String(participant_id) !== String(requesterId)
        ) {
            return res.status(403).json({ error: 'Nie możesz tworzyć bloków dla innego uczestnika' });
        }

        const result = db.prepare(`
            INSERT INTO availability_blocks 
            (participant_id, start_date, start_time, end_date, end_time)
            VALUES (?, ?, ?, ?, ?)
        `).run(
            participant_id,
            start_date,
            start_time,
            end_date,
            end_time,
        );

        res.status(201).json({
            id: result.lastInsertRowid,
            participant_id,
            start_date,
            start_time,
            end_date,
            end_time,
        });
    } catch (err) {
        console.error('POST /availability-blocks error:', err);
        res.status(500).json({ error: err.message || 'Internal server error' });
    }
});

// Update an availability block
router.put('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { start_date, start_time, end_date, end_time} = req.body;
        const requesterId = req.query.requester_id;

        if (!requesterId) {
            return res.status(400).json({ error: 'Missing requester_id query parameter' });
        }

        if (!start_date || !start_time || !end_date || !end_time) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const startDateTime = new Date(`${start_date}T${start_time}`);
        const endDateTime   = new Date(`${end_date}T${end_time}`);

        if (startDateTime >= endDateTime) {
            return res.status(400).json({ error: 'Start must be before end' });
        }

        const block = db.prepare(`
            SELECT participant_id 
            FROM availability_blocks 
            WHERE id = ?
        `).get(id);

        if (!block) {
            return res.status(404).json({ error: 'availability block not found' });
        }

        const calendar = db.prepare(`
            SELECT owner_participant_id 
            FROM calendars 
            WHERE id = (SELECT calendar_id FROM participants WHERE id = ?)
        `).get(block.participant_id);

        if (
            String(calendar.owner_participant_id) !== String(requesterId) &&
            String(block.participant_id) !== String(requesterId)
        ) {
            return res.status(403).json({ error: 'Nie możesz edytować bloku innego uczestnika' });
        }

        const info = db.prepare(`
            UPDATE availability_blocks
            SET start_date = ?, start_time = ?, 
                end_date = ?, end_time = ?
            WHERE id = ?
        `).run(
            start_date,
            start_time,
            end_date,
            end_time,
            id
        );

        if (info.changes === 0) {
            return res.status(404).json({ error: 'availability block not found' });
        }

        res.json({
            id,
            start_date,
            start_time,
            end_date,
            end_time
        });
    } catch (err) {
        console.error('PUT /availability-blocks/:id error:', err);
        res.status(500).json({ error: err.message || 'Internal server error' });
    }
});

// Delete a availability block
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const requesterId = req.query.requester_id;

        if (!requesterId) {
            return res.status(400).json({ error: 'Missing requester_id query parameter' });
        }

        const block = db.prepare(`
            SELECT participant_id 
            FROM availability_blocks 
            WHERE id = ?
        `).get(id);

        if (!block) {
            return res.status(404).json({ error: 'availability block not found' });
        }

        const calendar = db.prepare(`
            SELECT owner_participant_id 
            FROM calendars 
            WHERE id = (SELECT calendar_id FROM participants WHERE id = ?)
        `).get(block.participant_id);

        if (
            String(calendar.owner_participant_id) !== String(requesterId) &&
            String(block.participant_id) !== String(requesterId)
        ) {
            return res.status(403).json({ error: 'Nie możesz usuwać bloku innego uczestnika' });
        }

        db.prepare('DELETE FROM availability_blocks WHERE id = ?').run(id);

        res.json({ success: true });
    } catch (err) {
        console.error('DELETE /availability-blocks/:id error:', err);
        res.status(500).json({ error: err.message || 'Internal server error' });
    }
});

export default router;