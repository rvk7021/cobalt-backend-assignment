// src/scheduler.ts
// Implements a cron job to send scheduled Slack messages.

import cron from 'node-cron';
import ScheduledMessage from './models/ScheduledMessage';
import { getValidAccessToken } from './utils/tokenRefresh';
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
            // Find messages that are scheduled for now or in the past, not yet sent, and not cancelled
            const messagesToSend = await ScheduledMessage.find({
                scheduledTime: { $lte: now },
                sent: false,
                cancelled: false,
            }).populate('workspaceId'); // Populate the workspace details

            if (messagesToSend.length === 0) {
                // console.log('No messages to send at this time.');
                return;
            }

            console.log(`Found ${messagesToSend.length} messages to send.`);

            for (const message of messagesToSend) {
                // Ensure workspaceId is populated and is an actual workspace document
                const workspace = message.workspaceId as any; // Type assertion as populate returns a document
                if (!workspace || !workspace._id) {
                    console.error(`Skipping scheduled message ${message._id}: Associated workspace not found or invalid.`);
                    message.sent = true; // Mark as sent to prevent re-processing if workspace is bad
                    message.slackMessageTs = 'ERROR: Workspace missing';
                    await message.save();
                    continue;
                }

                try {
                    // Get a valid access token for the workspace (will refresh if expired)
                    const accessToken = await getValidAccessToken(workspace._id);
                    const client = new WebClient(accessToken);

                    // Send the message to Slack
                    const result = await client.chat.postMessage({
                        channel: message.channel,
                        text: message.message,
                    });

                    if (result.ok) {
                        message.sent = true;
                        message.slackMessageTs = result.ts as string; // Store Slack's message timestamp
                        await message.save();
                        console.log(`Successfully sent scheduled message ${message._id} to channel ${message.channel} in workspace ${workspace.team_name}.`);
                    } else {
                        console.error(`Failed to send scheduled message ${message._id} to Slack:`, result.error);
                        // Optionally, update message to indicate failure or retry later
                        // For now, we'll just log and move on.
                    }
                } catch (error: any) {
                    console.error(`Error processing scheduled message ${message._id} for workspace ${workspace.team_name}:`, error.message);
                    // If token refresh fails or any other error occurs during sending,
                    // we might want to mark it as failed or retry.
                    // For now, just log the error.
                }
            }
        } catch (error: any) {
            console.error('Error in scheduled message check:', error.message);
        }
    });
    console.log('Scheduled message sender started.');
};
