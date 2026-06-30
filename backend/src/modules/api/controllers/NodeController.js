import { ok } from "../../../common/http/response.js";

export class NodeController {
  constructor({ networkApiService }) {
    this.networkApiService = networkApiService;
  }

  listNodes = (req, res) => {
    ok(res, this.networkApiService.listNodes(req.query));
  };
}
