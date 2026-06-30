export function requestContext(req) {
  return {
    actorType: "USER",
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
    requestId: req.requestId ?? req.get("x-request-id"),
  };
}
