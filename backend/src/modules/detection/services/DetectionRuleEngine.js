import { badRequest } from "../../../common/http/errors.js";
import { BruteForceDetectionRule } from "./rules/BruteForceDetectionRule.js";
import { DdosDetectionRule } from "./rules/DdosDetectionRule.js";
import { MalwareDetectionRule } from "./rules/MalwareDetectionRule.js";
import { PacketSniffingDetectionRule } from "./rules/PacketSniffingDetectionRule.js";
import { PortScanDetectionRule } from "./rules/PortScanDetectionRule.js";
import { ThreatClassifier } from "./ThreatClassifier.js";

export class DetectionRuleEngine {
  constructor({ nodeRepository }) {
    this.nodeRepository = nodeRepository;
    this.classifier = new ThreatClassifier();
    this.rules = [
      new DdosDetectionRule(),
      new PortScanDetectionRule(),
      new BruteForceDetectionRule(),
      new PacketSniffingDetectionRule(),
      new MalwareDetectionRule(),
    ];
  }

  evaluate({ attack, trafficLogs, targetNode }) {
    const rule = this.rules.find((candidate) => candidate.supports(attack.attackType));

    if (!rule) {
      throw badRequest(`No detection rule registered for attack type ${attack.attackType}`);
    }

    return rule.evaluate({
      attack,
      trafficLogs,
      targetNode,
      nodeRepository: this.nodeRepository,
      classifier: this.classifier,
    });
  }
}
