// src/config.ts
// Centralized configuration for environment variables.

interface Config {
    SLACK_CLIENT_ID: string;
    SLACK_CLIENT_SECRET: string;
    SLACK_REDIRECT_URI: string;
    MONGO_URI: string;
    ENCRYPTION_KEY: string;
    FRONTEND_URL: string;
}

const config: Config = {
    SLACK_CLIENT_ID: process.env.SLACK_CLIENT_ID || '',
    SLACK_CLIENT_SECRET: process.env.SLACK_CLIENT_SECRET || '',
    SLACK_REDIRECT_URI: process.env.SLACK_REDIRECT_URI || '',
    MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/slack_connect',
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'a_very_secret_key_for_encryption_32_bytes_long', // Must be 32 bytes for AES-256
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
};

// Validate essential environment variables
if (!config.SLACK_CLIENT_ID || !config.SLACK_CLIENT_SECRET || !config.SLACK_REDIRECT_URI) {
    console.error('Missing Slack API credentials. Please set SLACK_CLIENT_ID, SLACK_CLIENT_SECRET, and SLACK_REDIRECT_URI in your .env file.');
    process.exit(1);
}
if (!config.ENCRYPTION_KEY || config.ENCRYPTION_KEY.length < 32) {
    console.warn('ENCRYPTION_KEY is missing or too short. Please set a strong 32-byte key in your .env file for production.');
    // For development, we'll proceed, but this is critical for security.
}

export default config;
