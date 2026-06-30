import { createServer } from "node:http";
import { createLogger } from "./common/logger.js";
import { config } from "./config/index.js";
import { createApp } from "./app.js";
import { createRealtimeModule } from "./modules/realtime/index.js";

const logger = createLogger({ level: config.logLevel, scope: "server" });
const app = createApp({ runtimeConfig: config, logger: logger.child("app") });
const server = createServer(app);
const realtimeModule = createRealtimeModule({
  httpServer: server,
  db: app.locals.db,
  modules: app.locals.engineModules,
  config,
  logger: logger.child("realtime"),
});

app.locals.realtimeModule = realtimeModule;

server.listen(config.port, () => {
  logger.info("backend_started", {
    env: config.env,
    port: config.port,
    socketNamespace: config.realtime.namespace,
    databasePath: config.databasePath,
  });
});

let shuttingDown = false;

function shutdown(signal = "UNKNOWN") {
  if (shuttingDown) return;
  shuttingDown = true;

  logger.info("shutdown_started", { signal });
  const engine = app.locals.networkModule?.services?.engine;
  engine?.stop();
  app.locals.realtimeModule?.close();

  server.close((error) => {
    if (error) {
      logger.error("server_close_failed", { message: error.message });
    }
    app.locals.db?.close();
    logger.info("shutdown_complete");
    process.exit(error ? 1 : 0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("uncaughtException", (error) => {
  logger.error("uncaught_exception", { message: error.message, stack: error.stack });
  shutdown("uncaughtException");
});
process.on("unhandledRejection", (reason) => {
  logger.error("unhandled_rejection", {
    message: reason instanceof Error ? reason.message : String(reason),
  });
  shutdown("unhandledRejection");
});
