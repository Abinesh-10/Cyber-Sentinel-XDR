import { ReportRepository } from "../../database/repositories/ReportRepository.js";
import { ReportService } from "./services/ReportService.js";

export function createReportModule({ db, analyticsModule, reportsDirectory }) {
  const reportRepository = new ReportRepository(db);

  const reportService = new ReportService({
    reportRepository,
    analyticsModule,
    reportsDirectory,
  });

  return {
    services: {
      reportService,
    },
    repositories: {
      reportRepository,
    },
  };
}
