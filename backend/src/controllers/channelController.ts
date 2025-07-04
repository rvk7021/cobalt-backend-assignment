import { Request, Response } from 'express';
import { WebClient } from '@slack/web-api';
import { getValidAccessTokenFromWorkspace } from '../utils/tokenRefresh';

export const getChannels = async (req: Request, res: Response): Promise<void> => {
    const { workspace } = req as any;
    try {
        const accessToken = await getValidAccessTokenFromWorkspace(workspace);
        const client = new WebClient(accessToken);

        const result = await client.conversations.list({
            types: 'public_channel,private_channel',
            exclude_archived: true,
            limit: 100
        });

        if (result.ok) {
            const channels = (result.channels || []).map((channel: any) => ({
                id: channel.id,
                name: channel.name,
                is_private: channel.is_private,
            }));
            res.json({ channels });
        } else {
            console.error('Slack API error fetching channels:', result.error);
            res.status(500).json({ error: 'Failed to fetch channels from Slack.' });
        }
    } catch (error: any) {
        console.error('Error fetching channels:', error.message);
        res.status(500).json({ error: 'Failed to fetch channels.', details: error.message });
    }
};
