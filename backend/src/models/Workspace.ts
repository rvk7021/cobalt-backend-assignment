// src/models/Workspace.ts
// Mongoose model for storing Slack workspace information and tokens.

import mongoose, { Document, Schema } from 'mongoose';

// Define the interface for a Workspace document
export interface IWorkspace extends Document {
    team_id: string;
    team_name: string;
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
    scope: string;
    userId: string; // Slack user ID of the installer
    botUserId?: string; // Bot user ID for the app
    appId?: string; // Slack app ID
    enterpriseId?: string; // Enterprise ID if applicable
    userAccessToken?: string; // User-specific access token (encrypted)
    userRefreshToken?: string; // User-specific refresh token (encrypted)
    userExpiresAt?: Date; // User token expiration
    lastRefreshed: Date;
    isActive: boolean; // Whether the workspace connection is active
}

// Define the Mongoose schema for Workspace
const WorkspaceSchema: Schema = new Schema({
    team_id: { type: String, required: true, unique: true }, // Slack team ID, unique identifier for a workspace
    team_name: { type: String, required: true },
    accessToken: { type: String, required: true }, // Encrypted bot access token
    refreshToken: { type: String }, // Encrypted bot refresh token (optional)
    expiresAt: { type: Date }, // When the bot access token expires (optional)
    scope: { type: String, required: true }, // Scopes granted to the app
    userId: { type: String, required: true }, // The Slack user ID who installed the app
    botUserId: { type: String }, // Bot user ID for the app
    appId: { type: String }, // Slack app ID
    enterpriseId: { type: String }, // Enterprise ID if applicable
    userAccessToken: { type: String }, // Encrypted user access token (optional)
    userRefreshToken: { type: String }, // Encrypted user refresh token (optional)
    userExpiresAt: { type: Date }, // User token expiration (optional)
    lastRefreshed: { type: Date, default: Date.now }, // Timestamp of last token refresh
    isActive: { type: Boolean, default: true }, // Whether the workspace connection is active
}, { timestamps: true }); // Add createdAt and updatedAt timestamps

// Create and export the Workspace model
const Workspace = mongoose.model<IWorkspace>('Workspace', WorkspaceSchema);
export default Workspace;
