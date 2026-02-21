import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import db from './db.js';
import calendarRoutes from './routes/calendars.js';
import participantRoutes from './routes/participants.js';
import busyBlockRoutes from './routes/availabiltyBlocks.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const port = Number(process.env.PORT) || 3000;

const app = express();  

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '../public')));

app.use('/calendars', calendarRoutes);
app.use('/participants', participantRoutes);
app.use('/busy-blocks', busyBlockRoutes);
app.use('/availability-blocks', busyBlockRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});