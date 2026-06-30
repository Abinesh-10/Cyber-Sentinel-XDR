import { eventTypeForDashboardEvent } from "../events/DashboardEvents.js";

export class RealtimeBroadcaster {
  constructor({ namespace, eventRepository, connectionManager, logger = null }) {
    this.namespace = namespace;
    this.eventRepository = eventRepository;
    this.connectionManager = connectionManager;
    this.logger = logger;
  }

  broadcast(eventName, payload, options = {}) {
    const timestamp = new Date().toISOString();
    const eventType = options.eventType ?? eventTypeForDashboardEvent(eventName);
    const deliveredCount = this.connectionManager.count();
    const stored = this.eventRepository.create({
      eventName,
      eventType,
      room: options.room ?? "dashboard",
      payload,
      correlationId: options.correlationId,
      deliveredCount,
      ackRequired: Boolean(options.ackRequired),
      status: "EMITTED",
      createdAt: timestamp,
    });
    const envelope = {
      id: stored.id,
      event: eventName,
      type: eventType,
      timestamp,
      deliveredCount,
      payload,
    };

    this.namespace.emit(eventName, envelope);
    this.logger?.debug("socket_event_emitted", {
      eventName,
      eventType,
      deliveredCount,
      eventId: stored.id,
    });
    return envelope;
  }
}
