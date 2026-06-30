import { Server } from "socket.io";
import { createLogger } from "../../common/logger.js";
import { RealtimeEventRepository } from "../../database/repositories/RealtimeEventRepository.js";
import { ConnectionManager } from "./services/ConnectionManager.js";
import { EngineEventBridge } from "./services/EngineEventBridge.js";
import { RealtimeBroadcaster } from "./services/RealtimeBroadcaster.js";

export function createRealtimeModule({ httpServer, db, modules, config = {}, logger = null }) {
  const realtimeLogger = logger ?? createLogger({ level: config.logLevel, scope: "realtime" });
  const io = new Server(httpServer, {
    cors: {
      origin: config.realtime?.corsOrigin ?? "*",
      methods: ["GET", "POST"],
    },
    connectionStateRecovery: {
      maxDisconnectionDuration: config.realtime?.recoveryMs ?? 120000,
      skipMiddlewares: true,
    },
  });
  const namespace = io.of(config.realtime?.namespace ?? "/xdr");
  const eventRepository = new RealtimeEventRepository(db);
  const connectionManager = new ConnectionManager({
    namespace,
    logger: realtimeLogger.child("connections"),
  });
  const broadcaster = new RealtimeBroadcaster({
    namespace,
    eventRepository,
    connectionManager,
    logger: realtimeLogger.child("broadcast"),
  });
  const bridge = new EngineEventBridge({
    modules,
    broadcaster,
    logger: realtimeLogger.child("bridge"),
  });

  connectionManager.bind();
  bridge.bind();
  realtimeLogger.info("socket_layer_ready", {
    namespace: namespace.name,
    bridgedEvents: bridge.bindings.length,
  });

  return {
    io,
    namespace,
    eventRepository,
    connectionManager,
    broadcaster,
    bridge,
    close() {
      bridge.unbind();
      io.close();
    },
  };
}
