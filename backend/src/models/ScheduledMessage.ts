// src/models/ScheduledMessage.ts
// Mongoose model for storing scheduled messages.

import mongoose, { Document, Schema } from 'mongoose';

// Define the interface for a ScheduledMessage document
export interface IScheduledMessage extends Document {
    workspaceId: mongoose.Schema.Types.ObjectId; // Reference to the Workspace document
    channel: string; // Slack channel ID
    channelName: string; // Slack channel name for display
    message: string; // Message content
    scheduledTime: Date; // The time the message is scheduled to be sent
    sent: boolean; // True if the message has been sent
    cancelled: boolean; // True if the message has been cancelled
    slackMessageTs?: string; // Optional: Slack message timestamp after sending
}

// Define the Mongoose schema for ScheduledMessage
const ScheduledMessageSchema: Schema = new Schema({
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
    channel: { type: String, required: true },
    channelName: { type: String, required: true }, // Display name of the channel
    message: { type: String, required: true },
    scheduledTime: { type: Date, required: true },
    sent: { type: Boolean, default: false },
    cancelled: { type: Boolean, default: false },
    slackMessageTs: { type: String }, // Slack's timestamp for the sent message
}, { timestamps: true }); // Add createdAt and updatedAt timestamps

// Create and export the ScheduledMessage model
const ScheduledMessage = mongoose.model<IScheduledMessage>('ScheduledMessage', ScheduledMessageSchema);
export default ScheduledMessage;
