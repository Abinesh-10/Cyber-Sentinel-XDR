import { parsePositiveInt } from "../../network/validators/networkValidators.js";

export class NetworkApiService {
  constructor({ networkModule }) {
    this.networkModule = networkModule;
  }

  listNodes(filters = {}) {
    return this.networkModule.services.nodeManager.listNodes(filters);
  }

  start(input = {}) {
    return this.networkModule.services.engine.start({
      tickMs: parsePositiveInt(input.tickMs, undefined, 60000),
      trafficPerTick: parsePositiveInt(input.trafficPerTick, undefined, 1000),
    });
  }

  stop() {
    return this.networkModule.services.engine.stop();
  }

  reset() {
    return this.networkModule.services.engine.reset();
  }
}
