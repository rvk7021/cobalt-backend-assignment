// src/scheduler.ts
// Implements a cron job to send scheduled Slack messages.

import cron from 'node-cron';
import ScheduledMessage from './models/ScheduledMessage';
import { getValidAccessTokenFromWorkspace } from './utils/tokenRefresh';
import { WebClient } from '@slack/web-api';
import Workspace from './models/Workspace';

/**
 * Starts the cron job to send scheduled messages.
 * The job runs every minute.
 */
export const startScheduler = () => {
    // Schedule a task to run every minute
    cron.schedule('* * * * *', async () => {
        console.log('Running scheduled message check...');
        const now = new Date();

        try {
            // Find messages that are scheduled for now or in the past and are pending
            const messagesToSend = await ScheduledMessage.find({
                scheduledTime: { $lte: now },
                status: 'pending',
            });

            if (messagesToSend.length === 0) {
                // console.log('No messages to send at this time.');
                return;
            }

            console.log(`Found ${messagesToSend.length} messages to send.`);

            for (const message of messagesToSend) {
                try {
                    // Find the workspace that matches this message's userId and teamId
                    const workspace = await Workspace.findOne({
                        userId: message.userId,
                        team_id: message.teamId,
                    });

                    if (!workspace) {
                        console.error(`Skipping scheduled message ${message._id}: No active workspace found for user ${message.userId} in team ${message.teamId}.`);
                        message.status = 'failed';
                        message.slackMessageTs = 'ERROR: No active workspace found';
                        await message.save();
                        continue;
                    }

                    // Get a valid access token for the workspace (will refresh if expired)
                    const accessToken = await getValidAccessTokenFromWorkspace(workspace);
                    const client = new WebClient(accessToken);

                    // Send the message to Slack
                    const result = await client.chat.postMessage({
                        channel: message.channel,
                        text: message.message,
                    });

                    if (result.ok) {
                        message.status = 'sent';
                        message.slackMessageTs = result.ts as string; // Store Slack's message timestamp
                        await message.save();
                        console.log(`Successfully sent scheduled message ${message._id} to channel ${message.channel} in workspace ${workspace.team_name}.`);
                    } else {
                        console.error(`Failed to send scheduled message ${message._id} to Slack:`, result.error);
                        message.status = 'failed';
                        message.slackMessageTs = `ERROR: ${result.error}`;
                        await message.save();
                    }
                } catch (error: any) {
                    console.error(`Error processing scheduled message ${message._id} for user ${message.userId}:`, error.message);
                    // Mark the message as failed
                    message.status = 'failed';
                    message.slackMessageTs = `ERROR: ${error.message}`;
                    await message.save();
                }
            }
        } catch (error: any) {
            console.error('Error in scheduled message check:', error.message);
        }
    });
    console.log('Scheduled message sender started.');
};
