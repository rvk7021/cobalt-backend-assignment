// Mongoose model for storing Slack workspace information and tokens.

import mongoose, { Document, Schema } from 'mongoose';

export interface IWorkspace extends Document {
    team_id: string;
    team_name: string;
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
    scope: string;
    userId: string;
    botUserId?: string;
    appId?: string;
    enterpriseId?: string;
    userAccessToken?: string;
    userRefreshToken?: string;
    userExpiresAt?: Date;
    lastRefreshed: Date;
    isActive: boolean;
}

const WorkspaceSchema: Schema = new Schema({
    team_id: { type: String, required: true, unique: true },
    team_name: { type: String, required: true },
    accessToken: { type: String, required: true },
    refreshToken: { type: String },
    expiresAt: { type: Date },
    scope: { type: String, required: true },
    userId: { type: String, required: true },
    botUserId: { type: String },
    appId: { type: String },
    enterpriseId: { type: String },
    userAccessToken: { type: String },
    userRefreshToken: { type: String },
    userExpiresAt: { type: Date },
    lastRefreshed: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

const Workspace = mongoose.model<IWorkspace>('Workspace', WorkspaceSchema);
export default Workspace;
