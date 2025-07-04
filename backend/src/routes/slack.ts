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
    // Generate a random state parameter for CSRF protection
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Store state in session or temporary storage (for production, use Redis or database)
    // For now, we'll skip state validation but it's recommended for production
    
    // Enhanced scopes for better functionality
    const scopes = [
        'channels:read',        // Read channel information
        'chat:write',           // Send messages as the app
        'chat:write.public',    // Send messages to channels the app isn't in
        'chat:write.customize', // Customize message appearance
        'channels:history',     // Read message history
        'groups:read',          // Access private channels
        'im:read',              // Access direct messages
        'mpim:read',            // Access group direct messages
        'users:read',           // Read user information
        'team:read'             // Read workspace information
    ].join(',');
    
    const installUrl = `https://slack.com/oauth/v2/authorize?` +
        `client_id=${config.SLACK_CLIENT_ID}&` +
        `scope=${encodeURIComponent(scopes)}&` +
        `redirect_uri=${encodeURIComponent(config.SLACK_REDIRECT_URI)}&` +
        `state=${state}&` +
        `user_scope=&` +                    // Force workspace selection
        `team=&` +                         // Don't pre-select any team
        `granular_bot_scope=1`;            // Enable granular permissions
    
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
                team,
                authed_user,
                scope,
                bot_user_id,
                app_id,
                enterprise
            } = data;

            // Extract team information
            const team_id = team?.id;
            const team_name = team?.name;
            
            // Extract user information
            const user_id = authed_user?.id;
            const user_access_token = authed_user?.access_token;
            const user_refresh_token = authed_user?.refresh_token;
            const user_expires_in = authed_user?.expires_in;

            if (!team_id || !user_id) {
                console.error('Missing required team_id or user_id from Slack OAuth response');
                return res.redirect(`${config.FRONTEND_URL}/auth-failed?error=invalid_response`);
            }

            // Calculate expiration dates
            const expiresAt = expires_in ? new Date(Date.now() + expires_in * 1000) : null;
            const userExpiresAt = user_expires_in ? new Date(Date.now() + user_expires_in * 1000) : null;

            // Encrypt tokens before storing
            const encryptedAccessToken = encrypt(access_token);
            const encryptedRefreshToken = refresh_token ? encrypt(refresh_token) : null;
            const encryptedUserAccessToken = user_access_token ? encrypt(user_access_token) : null;
            const encryptedUserRefreshToken = user_refresh_token ? encrypt(user_refresh_token) : null;

            // Find and update or create a new workspace entry
            const workspace = await Workspace.findOneAndUpdate(
                { team_id: team_id },
                {
                    team_name,
                    accessToken: encryptedAccessToken,
                    refreshToken: encryptedRefreshToken,
                    expiresAt,
                    scope,
                    userId: user_id,
                    botUserId: bot_user_id,
                    appId: app_id,
                    enterpriseId: enterprise?.id || null,
                    userAccessToken: encryptedUserAccessToken,
                    userRefreshToken: encryptedUserRefreshToken,
                    userExpiresAt,
                    lastRefreshed: new Date(),
                    isActive: true
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );

            console.log(`Workspace ${team_name} (ID: ${team_id}) connected successfully.`);
            console.log(`Bot User ID: ${bot_user_id}, App ID: ${app_id}`);
            
            // Determine the correct frontend URL
            const frontendUrl = process.env.NODE_ENV === 'production' 
                ? process.env.FRONTEND_URL || 'https://your-frontend-url.netlify.app' // Replace with your actual frontend URL
                : config.FRONTEND_URL;
            
            // Redirect to frontend success page with comprehensive data
            const redirectUrl = `${frontendUrl}/auth-success?` +
                `teamId=${team_id}&` +
                `teamName=${encodeURIComponent(team_name)}&` +
                `botUserId=${bot_user_id}&` +
                `userId=${user_id}`;
            
            console.log(`Redirecting to: ${redirectUrl}`);
            res.redirect(redirectUrl);
        } else {
            console.error('Slack OAuth access error:', data.error);
            res.redirect(`${config.FRONTEND_URL}/auth-failed?error=${data.error}`);
        }
    } catch (error: any) {
        console.error('Error during Slack OAuth:', error.message);
        res.redirect(`${config.FRONTEND_URL}/auth-failed?error=server_error`);
    }
});

// Route to check installation status for a team
router.get('/status/:teamId', async (req: Request, res: Response): Promise<void> => {
    try {
        const { teamId } = req.params;
        
        const workspace = await Workspace.findOne({ team_id: teamId }).select('-accessToken -refreshToken -userAccessToken -userRefreshToken');
        
        if (!workspace) {
            res.status(404).json({
                success: false,
                message: 'Workspace not found',
                installed: false
            });
            return;
        }

        res.json({
            success: true,
            installed: true,
            workspace: {
                team_id: workspace.team_id,
                team_name: workspace.team_name,
                scope: workspace.scope,
                userId: workspace.userId,
                botUserId: workspace.botUserId,
                isActive: workspace.isActive,
                lastRefreshed: workspace.lastRefreshed,
                createdAt: (workspace as any).createdAt
            }
        });
    } catch (error: any) {
        console.error('Error checking installation status:', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Route to get all connected workspaces (for admin purposes)
router.get('/workspaces', async (req: Request, res: Response): Promise<void> => {
    try {
        const workspaces = await Workspace.find({ isActive: true })
            .select('-accessToken -refreshToken -userAccessToken -userRefreshToken')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: workspaces.length,
            workspaces
        });
    } catch (error: any) {
        console.error('Error fetching workspaces:', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

export default router;
