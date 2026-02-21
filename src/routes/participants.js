import express from 'express';
import {
    getCalendarIdByToken,
    createParticipant,
    pickParticipantColor,
    setCalendarOwner,
    getParticipantById,
    getCalendarOwnerByCalendarId,
    deleteParticipantById
} from '../models/participantModel.js';
import asyncHandler from '../middleware/asyncHandler.js';

const router = express.Router();

// Create a new participant
router.post('/', asyncHandler(async (req, res) => {
    const { name, calendar_token, set_as_owner } = req.body;

    if (!name || !calendar_token) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const calendar = getCalendarIdByToken(calendar_token);

    if (!calendar) {
        return res.status(404).json({ error: 'Calendar not found' });
    }

    const color = pickParticipantColor(calendar.id);
    const result = createParticipant({
        calendarId: calendar.id,
        name,
        color
    });

    const newId = result.lastInsertRowid;

    if (set_as_owner) {
        setCalendarOwner({ participantId: newId, calendarId: calendar.id });
    }

    res.status(201).json({ id: newId, name, color });
}));

// Delete a participant (only calendar owner can delete participants)
router.delete('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const requesterId = req.query.requester_id;

    if (!requesterId) {
        return res.status(400).json({ error: 'Missing requester_id query parameter' });
    }

    const participant = getParticipantById(id);

    if (!participant) {
        return res.status(404).json({ error: 'Participant not found' });
    }

    const calendar = getCalendarOwnerByCalendarId(participant.calendar_id);

    if (!calendar) {
        return res.status(404).json({ error: 'Calendar not found' });
    }

    if (String(calendar.owner_participant_id) !== String(requesterId)) {
        return res.status(403).json({ error: 'Only calendar owner may delete participants' });
    }

    const result = deleteParticipantById(id);

    if (result.changes === 0) {
        return res.status(404).json({ error: 'Participant not found' });
    }

    res.json({ success: true });
}));

export default router;