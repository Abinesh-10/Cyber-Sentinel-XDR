export function ok(res, data, meta = undefined) {
  return res.json({
    success: true,
    data,
    meta,
  });
}

export function created(res, data) {
  return res.status(201).json({
    success: true,
    data,
  });
}

export function noContent(res) {
  return res.status(204).send();
}

export function errorHandler(error, req, res, _next) {
  const statusCode = error.statusCode ?? 500;
  const logger = req.app?.locals?.logger;
  const details = {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    statusCode,
    message: error.message,
  };

  if (statusCode >= 500) {
    logger?.error("request_failed", details);
  } else {
    logger?.warn("request_rejected", details);
  }

  return res.status(statusCode).json({
    success: false,
    error: {
      code: statusCode >= 500 ? "INTERNAL_ERROR" : "REQUEST_ERROR",
      message: statusCode >= 500 ? "Unexpected network engine error" : error.message,
      details: error.details,
    },
  });
}
