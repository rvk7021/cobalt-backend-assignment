import { Router, Request, Response } from 'express';
import { WebClient } from '@slack/web-api';
import { getValidAccessToken, getValidAccessTokenFromWorkspace } from '../utils/tokenRefresh';
import ScheduledMessage from '../models/ScheduledMessage';
import Workspace from '../models/Workspace';

const router = Router();

router.use('/:teamId/*', async (req: Request, res: Response, next): Promise<void> => {
    const { teamId } = req.params;
    if (!teamId) {
        res.status(400).json({ error: 'Team ID is required.' });
        return;
    }
    const workspace = await Workspace.findOne({ team_id: teamId });
    if (!workspace) {
        res.status(404).json({ error: 'Workspace not found.' });
        return;
    }
    (req as any).workspace = workspace;
    next();
});

router.get('/:teamId/channels', async (req: Request, res: Response): Promise<void> => {
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
});

// POST /api/:teamId/send-message - Send a message immediately or schedule it
router.post('/:teamId/send-message', async (req: Request, res: Response): Promise<void> => {
    const { workspace } = req as any;
    const { channel, message, scheduledTime } = req.body;

    if (!channel || !message) {
        res.status(400).json({ error: 'Channel and message are required.' });
        return;
    }

    try {
        const accessToken = await getValidAccessTokenFromWorkspace(workspace);
        const client = new WebClient(accessToken);

        let channelName = channel;
        try {
            const channelInfo = await client.conversations.info({ channel });
            if (channelInfo.ok && channelInfo.channel) {
                channelName = `${(channelInfo.channel as any).is_private ? '🔒 ' : '# '}${(channelInfo.channel as any).name}`;
            }
        } catch (error) {
            console.warn('Could not fetch channel name, using ID:', error);
        }

        if (scheduledTime) {
            // Schedule the message
            const scheduledDate = new Date(scheduledTime);
            console.log(`Scheduling message: Input time: ${scheduledTime}, Parsed date: ${scheduledDate.toISOString()}, Local time: ${scheduledDate.toLocaleString()}`);

            if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
                res.status(400).json({ error: 'Invalid or past scheduled time.' });
                return;
            }

            const scheduledMsg = new ScheduledMessage({
                userId: workspace.userId,
                teamId: workspace.team_id,
                channel,
                channelName,
                message,
                scheduledTime: scheduledDate,
                status: 'pending',
            });
            await scheduledMsg.save();

            console.log(`Message scheduled successfully for ${scheduledDate.toISOString()}`);
            res.status(201).json({
                message: 'Message scheduled successfully!',
                scheduledMessage: scheduledMsg,
                scheduledFor: scheduledDate.toISOString()
            });
        } else {
            // Send the message immediately
            const result = await client.chat.postMessage({
                channel,
                text: message,
            });

            if (result.ok) {
                res.json({ message: 'Message sent successfully!', slackResponse: result });
            } else {
                console.error('Slack API error sending message:', result.error);
                res.status(500).json({ error: 'Failed to send message to Slack.', details: result.error });
            }
        }
    } catch (error: any) {
        console.error('Error sending/scheduling message:', error.message);
        res.status(500).json({ error: 'Failed to process message request.', details: error.message });
    }
});

router.get('/:teamId/scheduled-messages', async (req: Request, res: Response): Promise<void> => {
    const { workspace } = req as any;
    try {
        const messages = await ScheduledMessage.find({
            userId: workspace.userId,
            teamId: workspace.team_id,
            status: 'pending',
        }).sort({ scheduledTime: 1 });

        res.json({ messages });
    } catch (error: any) {
        console.error('Error fetching scheduled messages:', error.message);
        res.status(500).json({ error: 'Failed to fetch scheduled messages.', details: error.message });
    }
});

router.put('/:teamId/scheduled-messages/:messageId', async (req: Request, res: Response): Promise<void> => {
    const { workspace } = req as any;
    const { messageId } = req.params;
    const { message, scheduledTime, channel } = req.body;

    if (!message) {
        res.status(400).json({ error: 'Message content is required.' });
        return;
    }

    try {
        const scheduledMsg = await ScheduledMessage.findOne({
            _id: messageId,
            userId: workspace.userId,
            teamId: workspace.team_id,
            status: 'pending'
        });

        if (!scheduledMsg) {
            res.status(404).json({ error: 'Scheduled message not found or already sent/cancelled.' });
            return;
        }

        scheduledMsg.message = message;

        if (scheduledTime) {
            const newScheduledDate = new Date(scheduledTime);
            if (isNaN(newScheduledDate.getTime()) || newScheduledDate <= new Date()) {
                res.status(400).json({ error: 'Invalid or past scheduled time.' });
                return;
            }
            scheduledMsg.scheduledTime = newScheduledDate;
        }

        if (channel && channel !== scheduledMsg.channel) {
            const accessToken = await getValidAccessTokenFromWorkspace(workspace);
            const client = new WebClient(accessToken);

            let channelName = channel;
            try {
                const channelInfo = await client.conversations.info({ channel });
                if (channelInfo.ok && channelInfo.channel) {
                    channelName = `${(channelInfo.channel as any).is_private ? '🔒 ' : '# '}${(channelInfo.channel as any).name}`;
                }
            } catch (error) {
                console.warn('Could not fetch channel name, using ID:', error);
            }

            scheduledMsg.channel = channel;
            scheduledMsg.channelName = channelName;
        }

        await scheduledMsg.save();

        res.json({
            message: 'Scheduled message updated successfully!',
            scheduledMessage: scheduledMsg
        });
    } catch (error: any) {
        console.error('Error updating scheduled message:', error.message);
        res.status(500).json({ error: 'Failed to update scheduled message.', details: error.message });
    }
});

router.delete('/:teamId/scheduled-messages/:messageId', async (req: Request, res: Response): Promise<void> => {
    const { workspace } = req as any;
    const { messageId } = req.params;

    try {
        const message = await ScheduledMessage.findOneAndUpdate(
            {
                _id: messageId,
                userId: workspace.userId,
                teamId: workspace.team_id,
                status: 'pending'
            },
            { $set: { status: 'failed' } },
            { new: true }
        );

        if (!message) {
            res.status(404).json({ error: 'Scheduled message not found or already sent/cancelled.' });
            return;
        }

        res.json({ message: 'Scheduled message cancelled successfully!', cancelledMessage: message });
    } catch (error: any) {
        console.error('Error cancelling scheduled message:', error.message);
        res.status(500).json({ error: 'Failed to cancel scheduled message.', details: error.message });
    }
});

router.post('/:teamId/logout', async (req: Request, res: Response): Promise<void> => {
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

        workspace.accessToken = '';
        workspace.refreshToken = '';
        await workspace.save();

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
});

export default router;
