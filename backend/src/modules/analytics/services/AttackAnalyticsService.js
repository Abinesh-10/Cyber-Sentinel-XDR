const ATTACK_TYPES = ["DDOS", "PORT_SCAN", "BRUTE_FORCE", "MALWARE_PROPAGATION", "PACKET_SNIFFING"];

export class AttackAnalyticsService {
  constructor({ analyticsRepository }) {
    this.analyticsRepository = analyticsRepository;
  }

  calculate(period, bucket) {
    const counts = this.analyticsRepository.getAttackCountsByType(period);
    const countMap = new Map(counts.map((row) => [row.attackType, row.total]));
    const totalByType = ATTACK_TYPES.map((type) => ({
      attackType: type,
      total: countMap.get(type) ?? 0,
    }));
    const frequency = this.analyticsRepository.getAttackFrequency(period, bucket);

    return {
      totalAttacks: totalByType.reduce((sum, row) => sum + row.total, 0),
      totalByType,
      frequency,
      bucket,
    };
  }
}
