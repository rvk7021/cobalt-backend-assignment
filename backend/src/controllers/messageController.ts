import { Request, Response } from 'express';
import { WebClient } from '@slack/web-api';
import { getValidAccessTokenFromWorkspace } from '../utils/tokenRefresh';
import ScheduledMessage from '../models/ScheduledMessage';

export const sendMessage = async (req: Request, res: Response): Promise<void> => {
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
};
