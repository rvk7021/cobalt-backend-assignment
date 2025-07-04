// Handles the connection to the MongoDB database using Mongoose.

import mongoose from 'mongoose';
import config from './config';

const connectDB = async () => {
    try {
        await mongoose.connect(config.MONGO_URI);
        console.log('MongoDB connected successfully');
    } catch (err: any) {
        console.error('MongoDB connection error:', err.message);
        process.exit(1);
    }
};

export default connectDB;
