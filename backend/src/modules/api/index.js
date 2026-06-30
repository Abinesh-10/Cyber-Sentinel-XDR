import { AlertController } from "./controllers/AlertController.js";
import { AnalyticsController } from "./controllers/AnalyticsController.js";
import { AttackController } from "./controllers/AttackController.js";
import { DashboardController } from "./controllers/DashboardController.js";
import { NetworkController } from "./controllers/NetworkController.js";
import { NodeController } from "./controllers/NodeController.js";
import { ReportController } from "./controllers/ReportController.js";
import { corsMiddleware } from "./middleware/corsMiddleware.js";
import { notFoundMiddleware } from "./middleware/notFoundMiddleware.js";
import { requestIdMiddleware } from "./middleware/requestIdMiddleware.js";
import { createApiRouter } from "./routes/apiRoutes.js";
import { AlertApiService } from "./services/AlertApiService.js";
import { AnalyticsApiService } from "./services/AnalyticsApiService.js";
import { AttackApiService } from "./services/AttackApiService.js";
import { DashboardApiService } from "./services/DashboardApiService.js";
import { NetworkApiService } from "./services/NetworkApiService.js";
import { ReportApiService } from "./services/ReportApiService.js";

export function createApiModule({ db, modules, config }) {
  const networkApiService = new NetworkApiService({
    networkModule: modules.networkModule,
  });
  const dashboardApiService = new DashboardApiService({
    networkModule: modules.networkModule,
    attackModule: modules.attackModule,
    alertModule: modules.alertModule,
    analyticsModule: modules.analyticsModule,
  });
  const attackApiService = new AttackApiService({
    attackModule: modules.attackModule,
    detectionModule: modules.detectionModule,
    alertModule: modules.alertModule,
    analyticsModule: modules.analyticsModule,
  });
  const alertApiService = new AlertApiService({
    alertModule: modules.alertModule,
  });
  const analyticsApiService = new AnalyticsApiService({
    analyticsModule: modules.analyticsModule,
  });
  const reportApiService = new ReportApiService({
    reportModule: modules.reportModule,
  });

  const controllers = {
    dashboardController: new DashboardController({ dashboardApiService }),
    nodeController: new NodeController({ networkApiService }),
    attackController: new AttackController({ attackApiService }),
    alertController: new AlertController({ alertApiService }),
    analyticsController: new AnalyticsController({ analyticsApiService }),
    reportController: new ReportController({ reportApiService }),
    networkController: new NetworkController({ networkApiService }),
  };

  return {
    middleware: {
      cors: corsMiddleware({ origin: config.api?.corsOrigin ?? "*" }),
      notFound: notFoundMiddleware,
      requestId: requestIdMiddleware,
    },
    services: {
      networkApiService,
      dashboardApiService,
      attackApiService,
      alertApiService,
      analyticsApiService,
      reportApiService,
    },
    controllers,
    repositories: {},
    router: createApiRouter(controllers),
  };
}
