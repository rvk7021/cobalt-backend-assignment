import { Request, Response } from 'express';
import { WebClient } from '@slack/web-api';
import { getValidAccessTokenFromWorkspace } from '../utils/tokenRefresh';
import ScheduledMessage from '../models/ScheduledMessage';

export const getScheduledMessages = async (req: Request, res: Response): Promise<void> => {
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
};

export const updateScheduledMessage = async (req: Request, res: Response): Promise<void> => {
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
            res.status(404).json({ error: 'Scheduled message not found or already sent/cancelled. Refresh to see the latest list' });
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
};

export const deleteScheduledMessage = async (req: Request, res: Response): Promise<void> => {
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
};
