export class AlertApiService {
  constructor({ alertModule }) {
    this.alertModule = alertModule;
  }

  listAlerts(filters = {}) {
    return this.alertModule.services.alertService.listAlerts(filters);
  }
}
