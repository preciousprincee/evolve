// An "operational" error: something expected (bad input, insufficient
// credits, unauthorized) that we deliberately raise with a safe, specific
// client-facing message. Anything NOT thrown as an AppError is treated by
// the error handler as an unexpected bug and gets a fully generic response.
export class AppError extends Error {
  constructor(statusCode, message, code = 'ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
  }
}
