import { EventEmitter } from "node:events";

export class AnalyticsEventBus extends EventEmitter {
  emitAnalyticsEvent(eventName, payload) {
    const event = {
      name: eventName,
      timestamp: new Date().toISOString(),
      payload,
    };

    this.emit(eventName, event);
    this.emit("*", event);
    return event;
  }
}
