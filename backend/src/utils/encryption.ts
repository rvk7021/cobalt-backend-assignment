// src/utils/encryption.ts
// Utility functions for encrypting and decrypting sensitive data using Node.js crypto module.

import crypto from 'crypto';
import config from '../config';

// Ensure the encryption key is 32 bytes (256 bits) for AES-256
const ENCRYPTION_KEY = Buffer.from(config.ENCRYPTION_KEY.padEnd(32, '\0').substring(0, 32)); // Pad or truncate to 32 bytes
const IV_LENGTH = 16; // For AES, this is always 16 bytes

/**
 * Encrypts a given text string.
 * @param text The string to encrypt.
 * @returns The encrypted string in hex format (iv:encryptedText).
 */
export const encrypt = (text: string): string => {
    const iv = crypto.randomBytes(IV_LENGTH); // Generate a random initialization vector
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted; // Store IV with the encrypted text
};

/**
 * Decrypts an encrypted string.
 * @param text The encrypted string in hex format (iv:encryptedText).
 * @returns The decrypted string.
 */
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
