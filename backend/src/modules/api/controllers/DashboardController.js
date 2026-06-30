import { ok } from "../../../common/http/response.js";

export class DashboardController {
  constructor({ dashboardApiService }) {
    this.dashboardApiService = dashboardApiService;
  }

  getDashboard = (_req, res) => {
    ok(res, this.dashboardApiService.getDashboard());
  };
}
