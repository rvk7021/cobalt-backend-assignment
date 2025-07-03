// src/routes/slack.ts
// Express routes for handling Slack OAuth 2.0 flow.

import { Router, Request, Response } from 'express';
import axios from 'axios';
import config from '../config';
import Workspace from '../models/Workspace';
import { encrypt } from '../utils/encryption';

const router = Router();

// Route to initiate Slack OAuth installation
router.get('/install', (req: Request, res: Response) => {
    const scopes = 'channels:read chat:write chat:write.public chat:write.customize'; // Required Slack scopes
    const installUrl = `https://slack.com/oauth/v2/authorize?client_id=${config.SLACK_CLIENT_ID}&scope=${scopes}&redirect_uri=${config.SLACK_REDIRECT_URI}`;
    res.redirect(installUrl);
});

// OAuth redirect URL - Slack will redirect here after user authorizes the app
router.get('/oauth_redirect', async (req: Request, res: Response) => {
    const { code, error, state } = req.query;

    if (error) {
        console.error('Slack OAuth error:', error);
        return res.redirect(`${config.FRONTEND_URL}/auth-failed?error=${error}`);
    }

    if (!code) {
        console.error('No authorization code received from Slack.');
        return res.redirect(`${config.FRONTEND_URL}/auth-failed?error=no_code`);
    }

    try {
        // Exchange the authorization code for an access token
        const response = await axios.post('https://slack.com/api/oauth.v2.access', null, {
            params: {
                client_id: config.SLACK_CLIENT_ID,
                client_secret: config.SLACK_CLIENT_SECRET,
                code: code as string,
                redirect_uri: config.SLACK_REDIRECT_URI,
            },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        const data = response.data;

        if (data.ok) {
            const {
                access_token,
                refresh_token,
                expires_in,
                team: { id: team_id, name: team_name },
                authed_user: { id: user_id },
                scope,
            } = data;

            // Calculate expiration date
            const expiresAt = new Date(Date.now() + expires_in * 1000);

            // Encrypt tokens before storing
            const encryptedAccessToken = encrypt(access_token);
            const encryptedRefreshToken = encrypt(refresh_token);

            // Find and update or create a new workspace entry
            await Workspace.findOneAndUpdate(
                { team_id: team_id },
                {
                    team_name,
                    accessToken: encryptedAccessToken,
                    refreshToken: encryptedRefreshToken,
                    expiresAt,
                    scope,
                    userId: user_id,
                    lastRefreshed: new Date(),
                },
                { upsert: true, new: true, setDefaultsOnInsert: true } // Create if not found, return new doc
            );

            console.log(`Workspace ${team_name} (ID: ${team_id}) connected successfully.`);
            // Redirect to frontend success page, possibly passing workspace ID or status
            res.redirect(`${config.FRONTEND_URL}/auth-success?teamId=${team_id}&teamName=${encodeURIComponent(team_name)}`);
        } else {
            console.error('Slack OAuth access error:', data.error);
            res.redirect(`${config.FRONTEND_URL}/auth-failed?error=${data.error}`);
        }
    } catch (error: any) {
        console.error('Error during Slack OAuth:', error.message);
        res.redirect(`${config.FRONTEND_URL}/auth-failed?error=server_error`);
    }
});

export default router;
