import { AppError } from '../utils/AppError.js';

/**
 * Validates and SANITIZES (via schema parsing/coercion) req[part] against a
 * zod schema. On success, req[part] is replaced with the parsed data, so
 * downstream code only ever sees well-typed, bounded input — never a raw,
 * untrusted client payload.
 *
 * Usage: router.post('/x', validate(schema, 'body'), controller)
 */
export const validate = (schema, part = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[part]);

  if (!result.success) {
    const firstIssue = result.error.issues[0];
    throw new AppError(
      400,
      `Invalid request: ${firstIssue.path.join('.')} — ${firstIssue.message}`,
      'VALIDATION_ERROR'
    );
  }

  req[part] = result.data;
  next();
};
