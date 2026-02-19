import express from 'express';
import db from '../db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Create a new calendar
router.post('/', (req, res) => {
    const { name, description, start_date, end_date, start_hour, end_hour } = req.body;
    const token = generateCode();

    if(!name || !start_date || !end_date) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const sHour = Number.isFinite(Number(start_hour)) ? parseInt(start_hour) : 0;
    const eHour = Number.isFinite(Number(end_hour)) ? parseInt(end_hour) : 23;

    const stmt = db.prepare(`
        INSERT INTO calendars (name, description, start_date, end_date, start_hour, end_hour, token)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(name, description, start_date, end_date, sHour, eHour, token);

    res.status(201).json({ id: info.lastInsertRowid, token });
});

// Get calendar details by token
router.get('/:token', (req, res) => {
    const { token } = req.params; 
    const stmt = db.prepare('SELECT * FROM calendars WHERE token = ?');
    const calendar = stmt.get(token);      
    
    if (!calendar) {
        return res.status(404).json({ error: 'Calendar not found' });
    }   

    res.json(calendar);
});

// Delete a calendar by token
router.delete('/:token', (req, res) => {
    const { token } = req.params;
    const stmt = db.prepare('DELETE FROM calendars WHERE token = ?');
    const info = stmt.run(token);

    if (info.changes === 0) {
        return res.status(404).json({ error: 'Calendar not found' });
    }   

    res.json({ success: true });
});

// Update calendar details by token
router.put('/:token', (req, res) => {
    const { token } = req.params;
    const { name, description, start_date, end_date, start_hour, end_hour } = req.body;
    const stmt = db.prepare('UPDATE calendars SET name = ?, description = ?, start_date = ?, end_date = ?, start_hour = ?, end_hour = ? WHERE token = ?');
    const info = stmt.run(name, description, start_date, end_date, start_hour, end_hour, token);

    if (info.changes === 0) {
        return res.status(404).json({ error: 'Calendar not found' });
    }

    res.json({ success: true });
});

// Get full calendar details including participants and availability blocks
router.get('/:token/full', (req, res) => {
    const { token } = req.params;
    const calendarStmt = db.prepare('SELECT * FROM calendars WHERE token = ?');
    const calendar = calendarStmt.get(token);

    if (!calendar) {
        return res.status(404).json({ error: 'Calendar not found' });
    }       

    const participantsStmt = db.prepare('SELECT * FROM participants WHERE calendar_id = ?');
    const participants = participantsStmt.all(calendar.id);     
    const availabilityBlocksStmt = db.prepare('SELECT * FROM availability_blocks WHERE participant_id IN (SELECT id FROM participants WHERE calendar_id = ?)');
    const availabilityBlocks = availabilityBlocksStmt.all(calendar.id);

    res.json({ calendar, participants, availabilityBlocks });
}
);

export default router;

function generateCode(length = 6) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }

    if (db.prepare('SELECT 1 FROM calendars WHERE token = ?').get(result)) {
        return generateCode(length); // Regenerate if code already exists   
    }       

    return result;
}