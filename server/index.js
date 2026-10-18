import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import { db } from './db.js';
import { seedDatabase } from './seed.js';
import authRoutes from './routes/auth.js';
import walletRoutes from './routes/wallet.js';
import paymentsRoutes from './routes/payments.js';
import tutorsRoutes from './routes/tutors.js';
import sessionsRoutes from './routes/sessions.js';
import classroomRoutes from './routes/classroom.js';
import payoutsRoutes from './routes/payouts.js';
import { setupClassroomSocket } from './socket/classroomSocket.js';

import { PORT, NODE_ENV } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Setup Socket.IO with CORS
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    platform: 'Knovera',
    model: '1 Credit = 1 Minute',
    timestamp: new Date().toISOString(),
    database: db.isPostgres ? 'PostgreSQL (Render)' : 'Local Persistent DB'
  });
});

// Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/tutors', tutorsRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/classroom', classroomRoutes);
app.use('/api/payouts', payoutsRoutes);

// Setup Real-time WebSockets
setupClassroomSocket(io);

// Production Static Serving: Serve client/dist if it exists
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDistPath)) {
  console.log(`📦 [Knovera Server] Serving production client build from ${clientDistPath}`);
  app.use(express.static(clientDistPath));

  app.get('*', (req, res) => {
    // Avoid capturing api routes
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return res.status(404).json({ error: 'Endpoint not found' });
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send(`
      <div style="font-family: system-ui; padding: 40px; text-align: center; background: #070a10; color: #fff; min-height: 100vh;">
        <h1 style="color: #00F2FE;">Knovera API Server is Running</h1>
        <p>1 Credit = 1 Minute Live Micro-Tutoring Marketplace</p>
        <p style="color: #94a3b8;">Client build not detected yet. Run <code>npm run build</code> or start the Vite client on port 5173.</p>
        <a href="/api/health" style="color: #9d4edd; text-decoration: none; font-weight: bold;">Check Health Status &rarr;</a>
      </div>
    `);
  });
}

// Start Server and Seed Database
async function startServer() {
  try {
    await db.init();
    await seedDatabase();

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`\n======================================================`);
      console.log(`🚀 Knovera Server running on http://localhost:${PORT}`);
      console.log(`⚡ Mode: ${NODE_ENV}`);
      console.log(`🪙 1 Credit = 1 Minute Micro-Tutoring Platform`);
      console.log(`======================================================\n`);
    });
  } catch (err) {
    console.error('Fatal error starting Knovera server:', err);
    process.exit(1);
  }
}

startServer();
