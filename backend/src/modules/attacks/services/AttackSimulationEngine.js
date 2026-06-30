import { badRequest } from "../../../common/http/errors.js";
import { BruteForceAttackSimulator } from "./simulators/BruteForceAttackSimulator.js";
import { DdosAttackSimulator } from "./simulators/DdosAttackSimulator.js";
import { MalwarePropagationSimulator } from "./simulators/MalwarePropagationSimulator.js";
import { PacketSniffingAttackSimulator } from "./simulators/PacketSniffingAttackSimulator.js";
import { PortScanAttackSimulator } from "./simulators/PortScanAttackSimulator.js";

export class AttackSimulationEngine {
  constructor({ nodeRepository, trafficRepository }) {
    this.simulators = new Map([
      ["DDOS", new DdosAttackSimulator({ trafficRepository })],
      ["PORT_SCAN", new PortScanAttackSimulator({ trafficRepository })],
      ["BRUTE_FORCE", new BruteForceAttackSimulator({ trafficRepository })],
      ["PACKET_SNIFFING", new PacketSniffingAttackSimulator({ nodeRepository, trafficRepository })],
      [
        "MALWARE_PROPAGATION",
        new MalwarePropagationSimulator({ nodeRepository, trafficRepository }),
      ],
    ]);
  }

  execute(attackType, context) {
    const simulator = this.simulators.get(attackType);
    if (!simulator) {
      throw badRequest(`Unsupported attack type: ${attackType}`);
    }

    return simulator.run(context);
  }
}
