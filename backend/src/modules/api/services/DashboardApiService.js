export class DashboardApiService {
  constructor({ networkModule, attackModule, alertModule, analyticsModule }) {
    this.networkModule = networkModule;
    this.attackModule = attackModule;
    this.alertModule = alertModule;
    this.analyticsModule = analyticsModule;
  }

  getDashboard() {
    const analytics = this.analyticsModule.services.analyticsService.computeSnapshot({
      store: false,
    });
    const networkStatus = this.networkModule.services.engine.getStatus();
    const nodes = this.networkModule.services.nodeManager.listNodes();
    const recentAttacks = this.attackModule.services.attackService.listAttacks({ limit: 10 });
    const recentAlerts = this.alertModule.services.alertService.listAlerts({ limit: 10 });
    const alertMetrics = this.alertModule.services.alertService.getMetrics();

    return {
      generatedAt: new Date().toISOString(),
      network: {
        status: networkStatus,
        nodes,
      },
      attacks: {
        recent: recentAttacks,
        summary: analytics.attacks,
      },
      alerts: {
        recent: recentAlerts,
        metrics: alertMetrics,
      },
      analytics: {
        detections: analytics.detections,
        risk: analytics.risk,
        health: analytics.health,
        network: analytics.network,
      },
    };
  }
}
