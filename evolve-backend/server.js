import { app } from './src/app.js';
import { env } from './src/config/env.js';
import { logger } from './src/utils/logger.js';

const server = app.listen(env.PORT, () => {
  logger.info({ event: 'server_start', port: env.PORT, env: env.NODE_ENV }, `Evolve backend listening on :${env.PORT}`);
});

// Graceful shutdown — finish in-flight requests (e.g. a streaming Groq
// response) before exiting, so deploys/restarts don't cut users off mid-reply.
const shutdown = (signal) => {
  logger.info({ event: 'shutdown_start', signal }, 'Shutting down gracefully...');
  server.close(() => {
    logger.info({ event: 'shutdown_complete' }, 'Server closed.');
    process.exit(0);
  });
  // Force-exit if close hangs longer than 10s.
  setTimeout(() => process.exit(1), 10_000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error({ event: 'unhandled_rejection', reason: String(reason) }, 'Unhandled promise rejection');
});
