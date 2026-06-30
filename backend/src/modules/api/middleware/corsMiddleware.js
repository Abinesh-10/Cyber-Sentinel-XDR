export function corsMiddleware(options = {}) {
  const origin = options.origin ?? "*";
  const methods = options.methods ?? "GET,POST,PUT,PATCH,DELETE,OPTIONS";
  const headers = options.headers ?? "Content-Type,Authorization,X-Request-Id";

  return (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", methods);
    res.setHeader("Access-Control-Allow-Headers", headers);
    res.setHeader("Access-Control-Expose-Headers", "X-Request-Id");

    if (req.method === "OPTIONS") {
      res.status(204).send();
      return;
    }

    next();
  };
}
