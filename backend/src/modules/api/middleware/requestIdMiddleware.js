import { createId } from "../../../common/utils/id.js";

export function requestIdMiddleware(req, res, next) {
  const requestId = req.get("x-request-id") ?? createId("req");
  req.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);
  next();
}
