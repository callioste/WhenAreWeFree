import express from 'express';
import {
    createAvailabilityBlock,
    updateAvailabilityBlockById,
    getAvailabilityBlockById,
    deleteAvailabilityBlockById,
    getCalendarOwnerByParticipantId
} from '../models/availabilityBlockModel.js';
import { getParticipantById } from '../models/participantModel.js';
import asyncHandler from '../middleware/asyncHandler.js';

const router = express.Router();

// Create a new availability block
router.post('/', asyncHandler(async (req, res) => {
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

    const participant = getParticipantById(participant_id);

    if (!participant) {
        return res.status(404).json({ error: 'Participant not found' });
    }

    const calendar = getCalendarOwnerByParticipantId(participant.id);

    if (calendar &&
        String(calendar.owner_participant_id) !== String(requesterId) &&
        String(participant_id) !== String(requesterId)
    ) {
        return res.status(403).json({ error: 'You are not allowed to create availability blocks for another participant' });
    }

    const result = createAvailabilityBlock({
        participant_id,
        start_date,
        start_time,
        end_date,
        end_time,
    });

    res.status(201).json({
        id: result.lastInsertRowid,
        participant_id,
        start_date,
        start_time,
        end_date,
        end_time,
    });
}));

// Update an availability block
router.put('/:id', asyncHandler(async (req, res) => {
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

    const block = getAvailabilityBlockById(id);

    if (!block) {
        return res.status(404).json({ error: 'availability block not found' });
    }

    const calendar = getCalendarOwnerByParticipantId(block.participant_id);

    if (
        String(calendar.owner_participant_id) !== String(requesterId) &&
        String(block.participant_id) !== String(requesterId)
    ) {
        return res.status(403).json({ error: 'You are not allowed to edit this availability block' });
    }

    const info = updateAvailabilityBlockById(id, {
        start_date,
        start_time,
        end_date,
        end_time
    });

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
}));

// Delete a availability block
router.delete('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const requesterId = req.query.requester_id;

    if (!requesterId) {
        return res.status(400).json({ error: 'Missing requester_id query parameter' });
    }

    const block = getAvailabilityBlockById(id);

    if (!block) {
        return res.status(404).json({ error: 'availability block not found' });
    }

    const calendar = getCalendarOwnerByParticipantId(block.participant_id);

    if (
        String(calendar.owner_participant_id) !== String(requesterId) &&
        String(block.participant_id) !== String(requesterId)
    ) {
        return res.status(403).json({ error: 'You are not allowed to delete this availability block' });
    }

    deleteAvailabilityBlockById(id);

    res.json({ success: true });
}));

export default router;