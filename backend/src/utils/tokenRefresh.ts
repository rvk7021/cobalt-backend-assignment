// src/utils/tokenRefresh.ts
// Handles the logic for refreshing Slack access tokens.

import { WebClient } from '@slack/web-api';
import Workspace from '../models/Workspace';
import { decrypt, encrypt } from './encryption';
import config from '../config';
import axios from 'axios';

/**
 * Refreshes the Slack access token for a given workspace if it's expired or near expiration.
 * @param workspaceId The ID of the workspace to refresh tokens for.
 * @returns The valid (refreshed or existing) access token.
 * @throws Error if token refresh fails or workspace not found.
 */
export const getValidAccessToken = async (workspaceId: string): Promise<string> => {
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
        throw new Error('Workspace not found.');
    }

    // Check if refresh token exists
    if (!workspace.refreshToken) {
        throw new Error('No refresh token available for this workspace.');
    }

    // Decrypt the stored refresh token
    const decryptedRefreshToken = decrypt(workspace.refreshToken);

    // Check if the access token is expired or will expire soon (e.g., within the next 5 minutes)
    const now = new Date();
    
    // Handle case where expiresAt might be undefined
    if (!workspace.expiresAt) {
        console.log(`No expiration date found for workspace ${workspace.team_name}. Treating token as expired.`);
    } else {
        const expiresAt = new Date(workspace.expiresAt);
        const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

        // If token is still valid and not near expiration, return the current token
        if (expiresAt > fiveMinutesFromNow) {
            return decrypt(workspace.accessToken);
        }
    }

    console.log(`Access token for workspace ${workspace.team_name} (ID: ${workspace.team_id}) is expired or near expiration. Attempting to refresh...`);
    
    try {
        // Use axios to make the POST request for token refresh
        const response = await axios.post('https://slack.com/api/oauth.v2.access', null, {
            params: {
                client_id: config.SLACK_CLIENT_ID,
                client_secret: config.SLACK_CLIENT_SECRET,
                grant_type: 'refresh_token',
                refresh_token: decryptedRefreshToken,
            },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        const data = response.data;

        if (data.ok) {
            // Update workspace with new tokens and expiration
            workspace.accessToken = encrypt(data.access_token);
            workspace.refreshToken = encrypt(data.refresh_token); // Refresh tokens can also be rotated
            workspace.expiresAt = new Date(now.getTime() + data.expires_in * 1000); // Calculate new expiry
            workspace.lastRefreshed = now;
            await workspace.save();
            console.log(`Access token refreshed successfully for workspace ${workspace.team_name}.`);
            return data.access_token; // Return the new access token
        } else {
            console.error(`Slack token refresh failed for workspace ${workspace.team_name}:`, data.error);
            throw new Error(`Failed to refresh Slack token: ${data.error}`);
        }
    } catch (error: any) {
        console.error(`Error during Slack token refresh for workspace ${workspace.team_name}:`, error.message);
        throw new Error(`Error refreshing Slack token: ${error.message}`);
    }
};
