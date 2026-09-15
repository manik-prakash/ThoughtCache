import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
const app = express();
import mongoose from 'mongoose';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/authRoutes';
import profileRoutes from './routes/profileRoutes';
import itemRoutes from './routes/itemRoutes';
import tagRoutes from './routes/tagRoutes';
import publicRoutes from './routes/publicRoutes';
import exportRoutes from './routes/exportRoutes';
import ragRoutes from './routes/ragRoutes';
import graphRoutes from './routes/graphRoutes';
import { startGuestCleanupJob } from './utils/guestCleanup';


const connectDatabase = async (): Promise<void> => {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        throw new Error('MONGODB_URI environment variable is not defined');
    }
    await mongoose.connect(mongoUri);
    console.log('Database connected');
};

// Trusts exactly one hop of X-Forwarded-For, matching this app's deployment
// (ops/ puts a single Ingress in front of the backend Service — see README).
// This makes req.ip usable for the guest-session rate limiter below, but it
// is only safe as long as that one hop is a trusted proxy that overwrites
// (not appends to) X-Forwarded-For; if the app is ever reachable without
// that proxy in front of it, req.ip becomes attacker-controlled and the
// per-IP rate limit in middleware/guestRateLimit.ts can be trivially
// bypassed. guestSession() therefore also enforces an IP-independent global
// cap (MAX_ACTIVE_GUESTS) so a bypass there still can't cause unbounded
// resource consumption.
app.set('trust proxy', 1);

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/rag', ragRoutes);
app.use('/api/graph', graphRoutes);

app.use(errorHandler);

const startServer = async (): Promise<void> => {
    try {
        await connectDatabase();
        startGuestCleanupJob();
        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
