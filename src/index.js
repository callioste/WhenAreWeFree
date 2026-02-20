import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import db from './db.js';
import calendarRoutes from './routes/calendars.js';
import participantRoutes from './routes/participants.js';
import busyBlockRoutes from './routes/availabiltyBlocks.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();  

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '../public')));

app.use('/calendars', calendarRoutes);
app.use('/participants', participantRoutes);
app.use('/busy-blocks', busyBlockRoutes);
// Mount the same router on the expected frontend path to avoid 404s
app.use('/availability-blocks', busyBlockRoutes);

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});