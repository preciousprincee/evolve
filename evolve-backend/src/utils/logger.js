import pino from 'pino';
import { env } from '../config/env.js';

// Redact anything that could ever accidentally be logged: auth headers,
// tokens, API keys, and full request/response bodies (which could contain
// conversation content or PII). We log METADATA about events, not content.
export const logger = pino({
  level: env.isProd ? 'info' : 'debug',
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      '*.password',
      '*.apiKey',
      '*.api_key',
      '*.token',
      '*.access_token',
      '*.refresh_token',
      '*.service_role_key',
      '*.content', // message/memory content — never logged verbatim
    ],
    censor: '[REDACTED]',
  },
  transport: env.isProd
    ? undefined
    : { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:HH:MM:ss' } },
});
