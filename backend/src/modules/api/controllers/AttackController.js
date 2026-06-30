import { created, ok } from "../../../common/http/response.js";
import { requestContext } from "../services/ApiRequestContext.js";

export class AttackController {
  constructor({ attackApiService }) {
    this.attackApiService = attackApiService;
  }

  listAttacks = (req, res) => {
    ok(res, this.attackApiService.listAttacks(req.query));
  };

  simulateDdos = (req, res) => {
    created(res, this.attackApiService.simulateDdos(req.body ?? {}, requestContext(req)));
  };

  simulatePortScan = (req, res) => {
    created(res, this.attackApiService.simulatePortScan(req.body ?? {}, requestContext(req)));
  };

  simulateBruteForce = (req, res) => {
    created(res, this.attackApiService.simulateBruteForce(req.body ?? {}, requestContext(req)));
  };

  simulateSniffing = (req, res) => {
    created(res, this.attackApiService.simulatePacketSniffing(req.body ?? {}, requestContext(req)));
  };

  simulateMalware = (req, res) => {
    created(res, this.attackApiService.simulateMalware(req.body ?? {}, requestContext(req)));
  };
}
