export class AnalyticsApiService {
  constructor({ analyticsModule }) {
    this.analyticsModule = analyticsModule;
  }

  getAnalytics(query = {}) {
    return this.analyticsModule.services.analyticsService.computeSnapshot({
      period: {
        start: query.start,
        end: query.end,
      },
      bucket: query.bucket,
      store: query.store === "true",
    });
  }
}
