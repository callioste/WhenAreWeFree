import express from 'express';
import {
    createCalendar,
    getCalendarByToken,
    deleteCalendarByToken,
    updateCalendarByToken,
    getFullCalendarByToken,
    calendarTokenExists
} from '../models/calendarModel.js';
import asyncHandler from '../middleware/asyncHandler.js';

const router = express.Router();

// Create a new calendar
router.post('/', asyncHandler(async (req, res) => {
    const { name, description, start_date, end_date, start_hour, end_hour } = req.body;
    const token = generateCode();

    if(!name || !start_date || !end_date || start_hour === undefined || end_hour === undefined) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const sHour = Number.isFinite(Number(start_hour)) ? parseInt(start_hour, 10) : NaN;
    const eHour = Number.isFinite(Number(end_hour)) ? parseInt(end_hour, 10) : NaN;

    if (!Number.isInteger(sHour) || !Number.isInteger(eHour)) {
        return res.status(400).json({ error: 'Meeting hours are required and must be integers' });
    }

    if (sHour < 0 || sHour > 23 || eHour < 0 || eHour > 23) {
        return res.status(400).json({ error: 'Meeting hours must be between 0 and 23' });
    }

    if (eHour <= sHour) {
        return res.status(400).json({ error: 'Meeting hours end must be after meeting hours start' });
    }

    const info = createCalendar({
        name,
        description,
        start_date,
        end_date,
        start_hour: sHour,
        end_hour: eHour,
        token
    });

    res.status(201).json({ id: info.lastInsertRowid, token });
}));

// Get calendar details by token
router.get('/:token', asyncHandler(async (req, res) => {
    const { token } = req.params; 
    const calendar = getCalendarByToken(token);
    
    if (!calendar) {
        return res.status(404).json({ error: 'Calendar not found' });
    }   

    res.json(calendar);
}));

// Delete a calendar by token
router.delete('/:token', asyncHandler(async (req, res) => {
    const { token } = req.params;
    const info = deleteCalendarByToken(token);

    if (info.changes === 0) {
        return res.status(404).json({ error: 'Calendar not found' });
    }   

    res.json({ success: true });
}));

// Update calendar details by token
router.put('/:token', asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { name, description, start_date, end_date, start_hour, end_hour } = req.body;
    const info = updateCalendarByToken(token, {
        name,
        description,
        start_date,
        end_date,
        start_hour,
        end_hour
    });

    if (info.changes === 0) {
        return res.status(404).json({ error: 'Calendar not found' });
    }

    res.json({ success: true });
}));

// Get full calendar details including participants and availability blocks
router.get('/:token/full', asyncHandler(async (req, res) => {
    const { token } = req.params;
    const fullCalendar = getFullCalendarByToken(token);

    if (!fullCalendar) {
        return res.status(404).json({ error: 'Calendar not found' });
    }

    res.json(fullCalendar);
}));

export default router;

function generateCode(length = 6) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }

    if (calendarTokenExists(result)) {
        return generateCode(length); // Regenerate if code already exists   
    }       

    return result;
}