import { ok } from "../../../common/http/response.js";

export class NetworkController {
  constructor({ networkApiService }) {
    this.networkApiService = networkApiService;
  }

  start = (req, res) => {
    ok(res, this.networkApiService.start(req.body ?? {}));
  };

  stop = (_req, res) => {
    ok(res, this.networkApiService.stop());
  };

  reset = (_req, res) => {
    ok(res, this.networkApiService.reset());
  };
}
