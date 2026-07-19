// Express doesn't catch rejected promises from async route handlers by
// default — without this, an unhandled rejection could crash the process
// or hang the request. Wrap every async controller with this.
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
