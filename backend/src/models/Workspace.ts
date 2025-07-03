// src/models/Workspace.ts
// Mongoose model for storing Slack workspace information and tokens.

import mongoose, { Document, Schema } from 'mongoose';

// Define the interface for a Workspace document
export interface IWorkspace extends Document {
    team_id: string;
    team_name: string;
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
    scope: string;
    userId: string; // Slack user ID of the installer
    lastRefreshed: Date;
}

// Define the Mongoose schema for Workspace
const WorkspaceSchema: Schema = new Schema({
    team_id: { type: String, required: true, unique: true }, // Slack team ID, unique identifier for a workspace
    team_name: { type: String, required: true },
    accessToken: { type: String, required: true }, // Encrypted access token
    refreshToken: { type: String, required: true }, // Encrypted refresh token
    expiresAt: { type: Date, required: true }, // When the access token expires
    scope: { type: String, required: true }, // Scopes granted to the app
    userId: { type: String, required: true }, // The Slack user ID who installed the app
    lastRefreshed: { type: Date, default: Date.now }, // Timestamp of last token refresh
}, { timestamps: true }); // Add createdAt and updatedAt timestamps

// Create and export the Workspace model
const Workspace = mongoose.model<IWorkspace>('Workspace', WorkspaceSchema);
export default Workspace;
