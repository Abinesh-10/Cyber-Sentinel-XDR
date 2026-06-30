import { ok } from "../../../common/http/response.js";

export class AnalyticsController {
  constructor({ analyticsApiService }) {
    this.analyticsApiService = analyticsApiService;
  }

  getAnalytics = (req, res) => {
    ok(res, this.analyticsApiService.getAnalytics(req.query));
  };
}
