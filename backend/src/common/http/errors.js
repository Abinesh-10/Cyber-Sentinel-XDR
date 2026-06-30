export class HttpError extends Error {
  constructor(statusCode, message, details = undefined) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function notFound(message) {
  return new HttpError(404, message);
}

export function badRequest(message, details = undefined) {
  return new HttpError(400, message, details);
}
