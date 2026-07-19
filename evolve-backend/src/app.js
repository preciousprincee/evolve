import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import pinoHttp from 'pino-http';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import { AppError } from './utils/AppError.js';
import authRoutes from './routes/auth.routes.js';
import profileRoutes from './routes/profile.routes.js';
import chatRoutes from './routes/chat.routes.js';
import memoryRoutes from './routes/memory.routes.js';
import creditsRoutes from './routes/credits.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import cronRoutes from './routes/cron.routes.js';

export const app = express();

// Behind Railway/Render's proxy — needed for correct client IPs in rate limiting.
app.set('trust proxy', 1);

// --- Security headers -------------------------------------------------
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // Locked down: this API serves JSON/SSE only, no inline scripts/styles.
        scriptSrc: ["'none'"],
        styleSrc: ["'none'"],
        imgSrc: ["'none'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    referrerPolicy: { policy: 'no-referrer' },
    crossOriginResourcePolicy: { policy: 'same-site' },
  })
);
// helmet sets X-Content-Type-Options, X-Frame-Options, and a reasonable
// Permissions-Policy-adjacent default set out of the box.

// --- CORS: allow-list only ---------------------------------------------
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow no-origin requests (server-to-server, curl health checks) but
      // reject any browser origin not explicitly allow-listed.
      if (!origin || env.ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      logger.warn({ event: 'cors_rejected', origin }, 'Blocked CORS origin');
      return callback(new AppError(403, 'Origin not allowed.', 'CORS_REJECTED'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  })
);

app.use(compression());

// Body size limits — prevents oversized payload abuse. Individual routes
// apply their own tighter field-level limits (message length etc) via zod.
app.use(express.json({ limit: '256kb' }));

// Request logging — pino-http auto-redacts per the logger config, and never
// logs response bodies (which could contain AI/message content).
app.use(
  pinoHttp({
    logger,
    autoLogging: {
      ignore: (req) => req.url === '/health',
    },
  })
);

// --- Health check (unauthenticated, used by Railway/uptime monitors) ---
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// --- Routes -----------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/memories', memoryRoutes);
app.use('/api/credits', creditsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/cron', cronRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
