import { notFound } from "../../../common/http/errors.js";

export class ReportApiService {
  constructor({ reportModule }) {
    this.reportModule = reportModule;
  }

  listReports(filters = {}) {
    return this.reportModule.services.reportService.listReports(filters);
  }

  getReport(id) {
    const report = this.reportModule.services.reportService.getReport(id);
    if (!report) {
      throw notFound("Report not found");
    }

    return report;
  }

  generateReports(input = {}, context = {}) {
    return this.reportModule.services.reportService.generateSecurityReports(input, context);
  }
}
