import express from "express";
import { createLogger } from "./common/logger.js";
import { config } from "./config/index.js";
import { createDatabase } from "./database/connection.js";
import { errorHandler, ok } from "./common/http/response.js";
import { createAlertModule } from "./modules/alerts/index.js";
import { createAnalyticsModule } from "./modules/analytics/index.js";
import { createApiModule } from "./modules/api/index.js";
import { createAttackModule } from "./modules/attacks/index.js";
import { createDetectionModule } from "./modules/detection/index.js";
import { createNetworkModule } from "./modules/network/index.js";
import { createReportModule } from "./modules/reports/index.js";

export function createApp({ runtimeConfig = config, database = null, logger = null } = {}) {
  const app = express();
  const appLogger = logger ?? createLogger({ level: runtimeConfig.logLevel, scope: "app" });
  const db =
    database ??
    createDatabase(runtimeConfig.databasePath, {
      logger: appLogger.child("database"),
    });
  const networkModule = createNetworkModule({ db, config: runtimeConfig });
  const attackModule = createAttackModule({ db });
  const detectionModule = createDetectionModule({ db });
  const alertModule = createAlertModule({ db });
  const analyticsModule = createAnalyticsModule({ db });
  const reportModule = createReportModule({
    db,
    analyticsModule,
    reportsDirectory: runtimeConfig.reportsDirectory,
  });
  const engineModules = {
    networkModule,
    attackModule,
    detectionModule,
    alertModule,
    analyticsModule,
    reportModule,
  };
  const apiModule = createApiModule({
    db,
    modules: engineModules,
    config: runtimeConfig,
  });

  app.locals.db = db;
  app.locals.config = runtimeConfig;
  app.locals.logger = appLogger;
  app.locals.networkModule = networkModule;
  app.locals.engineModules = engineModules;
  app.locals.apiModule = apiModule;

  app.use(apiModule.middleware.cors);
  app.use(apiModule.middleware.requestId);
  app.use(express.json({ limit: "256kb" }));

  app.get("/health", (_req, res) => {
    ok(res, {
      service: "cybersentinel-network-engine",
      status: "OK",
      timestamp: new Date().toISOString(),
    });
  });

  app.use(apiModule.router);
  app.use(apiModule.middleware.notFound);
  app.use(errorHandler);

  return app;
}
