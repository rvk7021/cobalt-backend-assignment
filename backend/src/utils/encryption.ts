// Utility functions for encrypting and decrypting sensitive data using Node.js crypto module.

import crypto from 'crypto';
import config from '../config';

const ENCRYPTION_KEY = Buffer.from(config.ENCRYPTION_KEY.padEnd(32, '\0').substring(0, 32));
const IV_LENGTH = 16;

export const encrypt = (text: string): string => {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
};

export const decrypt = (text: string): string => {
    const parts = text.split(':');
    if (parts.length !== 2) {
        throw new Error('Invalid encrypted text format');
    }
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};
