export class NetworkAnalyticsService {
  constructor({ analyticsRepository }) {
    this.analyticsRepository = analyticsRepository;
  }

  calculate(period) {
    return {
      mostTargetedNode: this.analyticsRepository.getMostTargetedNode(period) ?? null,
      mostVulnerableIp: this.analyticsRepository.getMostVulnerableIp(period) ?? null,
      trafficDistribution: this.analyticsRepository.getTrafficDistribution(period),
      nodeTrafficDistribution: this.analyticsRepository.getNodeTrafficDistribution(period),
    };
  }
}
