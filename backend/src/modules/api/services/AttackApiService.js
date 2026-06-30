export class AttackApiService {
  constructor({ attackModule, detectionModule, alertModule, analyticsModule }) {
    this.attackModule = attackModule;
    this.detectionModule = detectionModule;
    this.alertModule = alertModule;
    this.analyticsModule = analyticsModule;
  }

  listAttacks(filters = {}) {
    return this.attackModule.services.attackService.listAttacks(filters);
  }

  simulateDdos(input, context) {
    return this.simulateAndProcess("simulateDdos", input, context);
  }

  simulatePortScan(input, context) {
    return this.simulateAndProcess("simulatePortScan", input, context);
  }

  simulateBruteForce(input, context) {
    return this.simulateAndProcess("simulateBruteForce", input, context);
  }

  simulatePacketSniffing(input, context) {
    return this.simulateAndProcess("simulatePacketSniffing", input, context);
  }

  simulateMalware(input, context) {
    return this.simulateAndProcess("simulateMalwarePropagation", input, context);
  }

  simulateAndProcess(methodName, input, context) {
    const attackResult = this.attackModule.services.attackService[methodName](input, context);
    const detectionResult = this.detectionModule.services.detectionService.detectAttack(
      attackResult.attack.id,
      context,
    );
    const alert = this.alertModule.services.alertService.createFromThreatScore(
      detectionResult.threatScore.id,
      context,
    );
    const analytics = this.analyticsModule.services.analyticsService.computeSnapshot(
      {
        store: true,
      },
      context,
    );

    return {
      attack: attackResult,
      detection: detectionResult,
      alert,
      analyticsSummary: this.analyticsModule.services.analyticsService.snapshotSummary(analytics),
    };
  }
}
