// src/index.ts
// Main entry point for the Slack Connect backend application.
// Sets up the Express server, connects to MongoDB, and initializes routes and the scheduler.

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './db';
import slackRoutes from './routes/slack';
import apiRoutes from './routes/api';
import { startScheduler } from './scheduler';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// CORS configuration to allow both development and production origins
const corsOptions = {
    origin: [
        'http://localhost:3000',              // Local development
        'https://slack-connect.netlify.app'   // Production frontend
    ],
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json()); // Parse JSON request bodies

// Connect to MongoDB
connectDB();

// Routes
app.use('/slack', slackRoutes); // Routes for Slack OAuth
app.use('/api', apiRoutes);     // Routes for message sending and management

// Basic health check route
app.get('/', (req, res) => {
    res.send('Slack Connect Backend is running!');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    // Start the scheduled message sender after the server starts
    startScheduler();
});
