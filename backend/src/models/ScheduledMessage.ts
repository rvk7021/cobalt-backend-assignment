// src/models/ScheduledMessage.ts
// Mongoose model for storing scheduled messages.

import mongoose, { Document, Schema } from 'mongoose';

// Define the interface for a ScheduledMessage document
export interface IScheduledMessage extends Document {
    userId: string; // Slack user ID (unique and persistent)
    teamId: string; // Slack team ID (for additional context)
    channel: string; // Slack channel ID
    channelName: string; // Slack channel name for display
    message: string; // Message content
    scheduledTime: Date; // The time the message is scheduled to be sent
    status: 'pending' | 'sent' | 'failed'; // Message status
    slackMessageTs?: string; // Optional: Slack message timestamp after sending
    createdAt: Date;
    updatedAt: Date;
}

// Define the Mongoose schema for ScheduledMessage
const ScheduledMessageSchema: Schema = new Schema({
    userId: { 
        type: String, 
        required: true,
        index: true // Index for faster queries
    },
    teamId: { 
        type: String, 
        required: true,
        index: true 
    },
    channel: { type: String, required: true },
    channelName: { type: String, required: true }, // Display name of the channel
    message: { type: String, required: true },
    scheduledTime: { 
        type: Date, 
        required: true,
        index: true // Index for scheduler queries
    },
    status: {
        type: String,
        enum: ['pending', 'sent', 'failed'],
        default: 'pending',
        index: true
    },
    slackMessageTs: { type: String }, // Slack's timestamp for the sent message
}, { timestamps: true }); // Add createdAt and updatedAt timestamps

// Compound indexes for efficient queries
ScheduledMessageSchema.index({ userId: 1, status: 1 });
ScheduledMessageSchema.index({ teamId: 1, status: 1 });
ScheduledMessageSchema.index({ scheduledTime: 1, status: 1 });

// Create and export the ScheduledMessage model
const ScheduledMessage = mongoose.model<IScheduledMessage>('ScheduledMessage', ScheduledMessageSchema);
export default ScheduledMessage;
