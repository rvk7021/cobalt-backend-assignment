// Main entry point for the Slack Connect backend application.

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './db';
import slackRoutes from './routes/slack';
import apiRoutes from './routes/api';
import { startScheduler } from './scheduler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const corsOptions = {
    origin: [
        'http://localhost:3000',
        'https://slack-connect.netlify.app'
    ],
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

connectDB();

app.use('/slack', slackRoutes);
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
    res.send('Slack Connect Backend is running!');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    startScheduler();
});
