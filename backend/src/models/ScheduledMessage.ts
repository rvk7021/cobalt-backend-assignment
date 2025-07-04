import mongoose, { Document, Schema } from 'mongoose';

export interface IScheduledMessage extends Document {
    userId: string;
    teamId: string;
    channel: string;
    channelName: string;
    message: string;
    scheduledTime: Date;
    status: 'pending' | 'sent' | 'failed';
    slackMessageTs?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ScheduledMessageSchema: Schema = new Schema({
    userId: { 
        type: String, 
        required: true,
        index: true
    },
    teamId: { 
        type: String, 
        required: true,
        index: true 
    },
    channel: { type: String, required: true },
    channelName: { type: String, required: true },
    message: { type: String, required: true },
    scheduledTime: { 
        type: Date, 
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['pending', 'sent', 'failed'],
        default: 'pending',
        index: true
    },
    slackMessageTs: { type: String },
}, { timestamps: true });

ScheduledMessageSchema.index({ userId: 1, status: 1 });
ScheduledMessageSchema.index({ teamId: 1, status: 1 });
ScheduledMessageSchema.index({ scheduledTime: 1, status: 1 });

const ScheduledMessage = mongoose.model<IScheduledMessage>('ScheduledMessage', ScheduledMessageSchema);
export default ScheduledMessage;
