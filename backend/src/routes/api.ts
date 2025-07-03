// src/routes/api.ts
// Express routes for handling message sending (immediate & scheduled) and scheduled message management.

import { Router, Request, Response } from 'express';
import { WebClient } from '@slack/web-api';
import { getValidAccessToken } from '../utils/tokenRefresh';
import ScheduledMessage from '../models/ScheduledMessage';
import Workspace from '../models/Workspace';

const router = Router();

// Middleware to ensure workspaceId is provided and valid
router.use('/:workspaceId/*', async (req: Request, res: Response, next): Promise<void> => {
    const { workspaceId } = req.params;
    if (!workspaceId) {
        res.status(400).json({ error: 'Workspace ID is required.' });
        return;
    }
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
        res.status(404).json({ error: 'Workspace not found.' });
        return;
    }
    // Attach workspace object to request for later use
    (req as any).workspace = workspace;
    next();
});

// GET /api/:workspaceId/channels - Get a list of channels for the connected workspace
router.get('/:workspaceId/channels', async (req: Request, res: Response): Promise<void> => {
    const { workspace } = req as any;
    try {
        const accessToken = await getValidAccessToken(workspace._id);
        const client = new WebClient(accessToken);

        // Fetch public and private channels (conversations)
        const result = await client.conversations.list({
            types: 'public_channel,private_channel',
            exclude_archived: true,
            limit: 100 // Adjust limit as needed
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

// POST /api/:workspaceId/send-message - Send a message immediately or schedule it
router.post('/:workspaceId/send-message', async (req: Request, res: Response): Promise<void> => {
    const { workspace } = req as any;
    const { channel, message, scheduledTime } = req.body;

    if (!channel || !message) {
        res.status(400).json({ error: 'Channel and message are required.' });
        return;
    }

    try {
        if (scheduledTime) {
            // Schedule the message
            const scheduledDate = new Date(scheduledTime);
            if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
                res.status(400).json({ error: 'Invalid or past scheduled time.' });
                return;
            }

            const scheduledMsg = new ScheduledMessage({
                workspaceId: workspace._id,
                channel,
                message,
                scheduledTime: scheduledDate,
                sent: false,
                cancelled: false,
            });
            await scheduledMsg.save();
            res.status(201).json({ message: 'Message scheduled successfully!', scheduledMessage: scheduledMsg });
        } else {
            // Send the message immediately
            const accessToken = await getValidAccessToken(workspace._id);
            const client = new WebClient(accessToken);

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

// GET /api/:workspaceId/scheduled-messages - Get a list of scheduled messages
router.get('/:workspaceId/scheduled-messages', async (req: Request, res: Response): Promise<void> => {
    const { workspace } = req as any;
    try {
        // Fetch scheduled messages that are not yet sent and not cancelled
        const messages = await ScheduledMessage.find({
            workspaceId: workspace._id,
            sent: false,
            cancelled: false,
        }).sort({ scheduledTime: 1 }); // Sort by scheduled time ascending

        res.json({ messages });
    } catch (error: any) {
        console.error('Error fetching scheduled messages:', error.message);
        res.status(500).json({ error: 'Failed to fetch scheduled messages.', details: error.message });
    }
});

// DELETE /api/:workspaceId/scheduled-messages/:messageId - Cancel a scheduled message
router.delete('/:workspaceId/scheduled-messages/:messageId', async (req: Request, res: Response): Promise<void> => {
    const { workspace } = req as any;
    const { messageId } = req.params;

    try {
        const message = await ScheduledMessage.findOneAndUpdate(
            { _id: messageId, workspaceId: workspace._id, sent: false, cancelled: false },
            { $set: { cancelled: true } },
            { new: true } // Return the updated document
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

export default router;
