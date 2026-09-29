import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import connectDB from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

// Security & Authentication Middlewares
import {
  nosqlSanitizer,
  authRateLimiter,
  orderRateLimiter,
  generalRateLimiter
} from './middleware/securityMiddleware.js';

// Route Handlers
import menuRoutes from './routes/menuRoutes.js';
import authRoutes from './routes/authRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import tableRoutes from './routes/tableRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

// Connect to MongoDB (non-blocking initialization)
connectDB().catch((err) => {
  console.warn('Initial MongoDB Connection Warning:', err.message);
});

const app = express();

// 1. Helmet HTTP Security Headers (prevents clickjacking, MIME sniffing, XSS)
app.use(
  helmet({
    contentSecurityPolicy: false, // Disabled for external QR code CDNs and fonts
    crossOriginEmbedderPolicy: false
  })
);

// 2. CORS Configuration
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
      // Always allow: no origin (curl/Postman/mobile), localhost, or LAN IPs
      if (!origin) return callback(null, true);
      if (
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        /^https?:\/\/192\.168\.|^https?:\/\/10\.|^https?:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\./.test(origin)
      ) {
        return callback(null, true);
      }
      // In development, allow everything
      if (process.env.NODE_ENV !== 'production') return callback(null, true);
      // In production, check the allowlist
      if (ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS: Origin '${origin}' not allowed`));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-dev-secret'],
    credentials: true,
    maxAge: 86400 // 24 hours pre-flight caching
  })
);


// 3. Body Parser with Payload Size Limit (prevents large JSON memory exhaustion attacks)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 4. NoSQL Injection Sanitizer across all incoming requests
app.use(nosqlSanitizer);

// 5. Database Connection Assurance Middleware (crucial for Serverless cold-starts & resilience)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection middleware error:', err.message);
    if (req.path === '/' || req.path === '/api/health') {
      return res.status(200).json({
        status: 'degraded',
        system: "Siliguri's Chai Addaa Operating System",
        database: 'disconnected',
        message: 'Server is running, but database connection is pending or unavailable.',
        timestamp: new Date().toISOString()
      });
    }
    return res.status(503).json({
      success: false,
      message: 'Database temporarily unavailable. Please verify database connection configuration.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// 5. Rate Limiting Protection on Sensitive Endpoints
app.use('/api/auth/register', authRateLimiter);
app.use('/api/auth/login', authRateLimiter);
app.use('/api', generalRateLimiter);

// 6. API Routes
app.use('/api', menuRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get(['/', '/api/health'], (req, res) => {
  res.json({
    status: 'online',
    system: "Siliguri's Chai Addaa Operating System",
    timestamp: new Date().toISOString()
  });
});

// Centralized Secure Error Handler (prevents stack trace leaks in production)
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  const isDev = process.env.NODE_ENV === 'development';
  res.status(err.status || 500).json({
    success: false,
    message: isDev ? err.message : 'An unexpected error occurred. Please contact restaurant administration.',
    ...(isDev && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;

let server;
if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Graceful Process Lifecycle Management
const gracefulShutdown = (signal) => {
  console.log(`[${signal}] Initiating graceful shutdown...`);
  if (server) {
    server.close(() => {
      console.log('HTTP server closed cleanly.');
      mongoose.connection.close(false).then(() => {
        console.log('MongoDB connection closed.');
        process.exit(0);
      }).catch(() => process.exit(0));
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception caught:', error);
});

export default app;
