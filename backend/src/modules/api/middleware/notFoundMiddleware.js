import { notFound } from "../../../common/http/errors.js";

export function notFoundMiddleware(req, _res, next) {
  next(notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}
