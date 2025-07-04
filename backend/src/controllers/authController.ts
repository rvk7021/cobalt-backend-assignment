import { Request, Response } from 'express';
import { WebClient } from '@slack/web-api';
import { getValidAccessTokenFromWorkspace } from '../utils/tokenRefresh';
import Workspace from '../models/Workspace';

export const logout = async (req: Request, res: Response): Promise<void> => {
    const { workspace } = req as any;

    try {
        const accessToken = await getValidAccessTokenFromWorkspace(workspace);
        const client = new WebClient(accessToken);

        try {
            await client.auth.revoke();
            console.log(`Tokens revoked for workspace ${workspace.team_name}`);
        } catch (revokeError) {
            console.warn('Failed to revoke token with Slack:', revokeError);
        }

        await Workspace.findByIdAndUpdate(workspace._id, {
            $unset: {
                accessToken: 1,
                refreshToken: 1
            },
            $set: {
                isActive: false
            }
        });

        console.log(`User ${workspace.userId} logged out from workspace ${workspace.team_name} (${workspace.team_id})`);

        res.json({
            message: 'Successfully logged out. Your scheduled messages will continue to work.',
            redirectUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/`
        });

    } catch (error: any) {
        console.error('Error during logout:', error.message);
        res.status(500).json({
            error: 'Failed to logout completely.',
            details: error.message
        });
    }
};
