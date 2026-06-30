import { ok } from "../../../common/http/response.js";

export class AlertController {
  constructor({ alertApiService }) {
    this.alertApiService = alertApiService;
  }

  listAlerts = (req, res) => {
    ok(res, this.alertApiService.listAlerts(req.query));
  };
}
