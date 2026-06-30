import { created, ok } from "../../../common/http/response.js";
import { requestContext } from "../services/ApiRequestContext.js";

export class ReportController {
  constructor({ reportApiService }) {
    this.reportApiService = reportApiService;
  }

  listReports = (req, res) => {
    ok(res, this.reportApiService.listReports(req.query));
  };

  getReport = (req, res) => {
    ok(res, this.reportApiService.getReport(req.params.id));
  };

  generateReports = (req, res) => {
    created(res, this.reportApiService.generateReports(req.body ?? {}, requestContext(req)));
  };
}
