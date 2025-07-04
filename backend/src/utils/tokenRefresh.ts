// Handles the logic for refreshing Slack access tokens.

import { WebClient } from '@slack/web-api';
import Workspace from '../models/Workspace';
import { decrypt, encrypt } from './encryption';
import config from '../config';
import axios from 'axios';

export const getValidAccessToken = async (workspaceId: string): Promise<string> => {
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
        throw new Error('Workspace not found.');
    }

    return getValidAccessTokenFromWorkspace(workspace);
};

export const getValidAccessTokenFromWorkspace = async (workspace: any): Promise<string> => {
    if (!workspace.refreshToken) {
        console.log(`No refresh token for workspace ${workspace.team_name}. Using current access token.`);
        return decrypt(workspace.accessToken);
    }

    const now = new Date();

    if (!workspace.expiresAt) {
        console.log(`No expiration date found for workspace ${workspace.team_name}. Using current access token.`);
        return decrypt(workspace.accessToken);
    } else {
        const expiresAt = new Date(workspace.expiresAt);
        const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

        if (expiresAt > fiveMinutesFromNow) {
            return decrypt(workspace.accessToken);
        }
    }

    const decryptedRefreshToken = decrypt(workspace.refreshToken);

    console.log(`Access token for workspace ${workspace.team_name} (ID: ${workspace.team_id}) is expired or near expiration. Attempting to refresh...`);

    try {
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
            workspace.accessToken = encrypt(data.access_token);
            workspace.refreshToken = encrypt(data.refresh_token);
            workspace.expiresAt = new Date(now.getTime() + data.expires_in * 1000);
            workspace.lastRefreshed = now;
            await workspace.save();
            console.log(`Access token refreshed successfully for workspace ${workspace.team_name}.`);
            return data.access_token;
        } else {
            console.error(`Slack token refresh failed for workspace ${workspace.team_name}:`, data.error);
            throw new Error(`Failed to refresh Slack token: ${data.error}`);
        }
    } catch (error: any) {
        console.error(`Error during Slack token refresh for workspace ${workspace.team_name}:`, error.message);
        throw new Error(`Error refreshing Slack token: ${error.message}`);
    }
};
