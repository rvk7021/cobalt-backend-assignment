// src/routes/api.ts
// Express routes for handling message sending (immediate & scheduled) and scheduled message management.

import { Router, Request, Response } from 'express';
import { WebClient } from '@slack/web-api';
import { getValidAccessToken, getValidAccessTokenFromWorkspace } from '../utils/tokenRefresh';
import ScheduledMessage from '../models/ScheduledMessage';
import Workspace from '../models/Workspace';

const router = Router();

// Middleware to ensure teamId is provided and valid
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
    // Attach workspace object to request for later use
    (req as any).workspace = workspace;
    next();
});

// GET /api/:teamId/channels - Get a list of channels for the connected workspace
router.get('/:teamId/channels', async (req: Request, res: Response): Promise<void> => {
    const { workspace } = req as any;
    try {
        const accessToken = await getValidAccessTokenFromWorkspace(workspace);
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

// POST /api/:teamId/send-message - Send a message immediately or schedule it
router.post('/:teamId/send-message', async (req: Request, res: Response): Promise<void> => {
    const { workspace } = req as any;
    const { channel, message, scheduledTime } = req.body;

    if (!channel || !message) {
        res.status(400).json({ error: 'Channel and message are required.' });
        return;
    }

    try {
        // Get channel name for display purposes
        const accessToken = await getValidAccessTokenFromWorkspace(workspace);
        const client = new WebClient(accessToken);
        
        let channelName = channel; // Default to channel ID
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
                workspaceId: workspace._id,
                channel,
                channelName,
                message,
                scheduledTime: scheduledDate,
                sent: false,
                cancelled: false,
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

// GET /api/:teamId/scheduled-messages - Get a list of scheduled messages
router.get('/:teamId/scheduled-messages', async (req: Request, res: Response): Promise<void> => {
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

// PUT /api/:teamId/scheduled-messages/:messageId - Edit a scheduled message
router.put('/:teamId/scheduled-messages/:messageId', async (req: Request, res: Response): Promise<void> => {
    const { workspace } = req as any;
    const { messageId } = req.params;
    const { message, scheduledTime, channel } = req.body;

    if (!message) {
        res.status(400).json({ error: 'Message content is required.' });
        return;
    }

    try {
        // Find the scheduled message
        const scheduledMsg = await ScheduledMessage.findOne({
            _id: messageId,
            workspaceId: workspace._id,
            sent: false,
            cancelled: false
        });

        if (!scheduledMsg) {
            res.status(404).json({ error: 'Scheduled message not found or already sent/cancelled.' });
            return;
        }

        // Update the message content
        scheduledMsg.message = message;

        // Update scheduled time if provided
        if (scheduledTime) {
            const newScheduledDate = new Date(scheduledTime);
            if (isNaN(newScheduledDate.getTime()) || newScheduledDate <= new Date()) {
                res.status(400).json({ error: 'Invalid or past scheduled time.' });
                return;
            }
            scheduledMsg.scheduledTime = newScheduledDate;
        }

        // Update channel if provided
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

// DELETE /api/:teamId/scheduled-messages/:messageId - Cancel a scheduled message
router.delete('/:teamId/scheduled-messages/:messageId', async (req: Request, res: Response): Promise<void> => {
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

// POST /api/:teamId/logout - Logout and revoke tokens
router.post('/:teamId/logout', async (req: Request, res: Response): Promise<void> => {
    const { workspace } = req as any;
    const { soft = false } = req.body; // Add soft logout option
    
    try {
        if (!soft) {
            // Full logout: revoke tokens with Slack
            const accessToken = await getValidAccessTokenFromWorkspace(workspace);
            const client = new WebClient(accessToken);
            
            try {
                await client.auth.revoke();
                console.log(`Tokens revoked for workspace ${workspace.team_name}`);
            } catch (revokeError) {
                console.warn('Failed to revoke token with Slack:', revokeError);
                // Continue with cleanup even if revoke fails
            }
            
            // Cancel all pending scheduled messages for this workspace
            await ScheduledMessage.updateMany(
                { 
                    workspaceId: workspace._id, 
                    sent: false, 
                    cancelled: false 
                },
                { 
                    $set: { cancelled: true } 
                }
            );
            
            // Remove the workspace from database
            await Workspace.findByIdAndDelete(workspace._id);
            
            console.log(`Workspace ${workspace.team_name} (${workspace.team_id}) fully logged out and cleaned up`);
        } else {
            // Soft logout: just return success without revoking tokens
            console.log(`Soft logout for workspace ${workspace.team_name} (${workspace.team_id})`);
        }
        
        res.json({ 
            message: soft ? 'Successfully signed out.' : 'Successfully logged out and disconnected workspace.',
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
