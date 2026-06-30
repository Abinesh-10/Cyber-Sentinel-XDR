import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";

export function createApiRouter({
  dashboardController,
  nodeController,
  attackController,
  alertController,
  analyticsController,
  reportController,
  networkController,
}) {
  const router = Router();

  router.get("/dashboard", asyncHandler(dashboardController.getDashboard));
  router.get("/nodes", asyncHandler(nodeController.listNodes));
  router.get("/attacks", asyncHandler(attackController.listAttacks));
  router.get("/alerts", asyncHandler(alertController.listAlerts));
  router.get("/analytics", asyncHandler(analyticsController.getAnalytics));
  router.get("/reports", asyncHandler(reportController.listReports));
  router.get("/reports/:id", asyncHandler(reportController.getReport));
  router.post("/reports/generate", asyncHandler(reportController.generateReports));

  router.post("/network/start", asyncHandler(networkController.start));
  router.post("/network/stop", asyncHandler(networkController.stop));
  router.post("/network/reset", asyncHandler(networkController.reset));

  router.post("/simulate/ddos", asyncHandler(attackController.simulateDdos));
  router.post("/simulate/portscan", asyncHandler(attackController.simulatePortScan));
  router.post("/simulate/bruteforce", asyncHandler(attackController.simulateBruteForce));
  router.post("/simulate/sniffing", asyncHandler(attackController.simulateSniffing));
  router.post("/simulate/malware", asyncHandler(attackController.simulateMalware));

  return router;
}
