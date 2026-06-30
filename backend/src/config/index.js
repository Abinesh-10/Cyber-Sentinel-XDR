import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "../..");
const envFilePath = process.env.ENV_FILE ?? path.join(backendRoot, ".env");

loadEnvFile(envFilePath);

export const config = {
  env: process.env.NODE_ENV ?? "development",
  port: numberFromEnv("PORT", 4000),
  logLevel: process.env.LOG_LEVEL ?? "info",
  backendRoot,
  databasePath:
    process.env.CYBERSENTINEL_DB_PATH ??
    path.join(backendRoot, "data", "cybersentinel-network.sqlite"),
  reportsDirectory: process.env.REPORTS_DIRECTORY ?? path.join(backendRoot, "reports"),
  realtime: {
    namespace: process.env.SOCKET_NAMESPACE ?? "/xdr",
    corsOrigin: process.env.SOCKET_CORS_ORIGIN ?? "*",
    recoveryMs: numberFromEnv("SOCKET_RECOVERY_MS", 120000),
  },
  api: {
    corsOrigin: process.env.API_CORS_ORIGIN ?? "*",
  },
  simulation: {
    tickMs: numberFromEnv("NETWORK_TICK_MS", 1000),
    trafficPerTick: numberFromEnv("NETWORK_TRAFFIC_PER_TICK", 25),
  },
};

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator < 1) continue;

    const key = trimmed.slice(0, separator).trim();
    const rawValue = trimmed.slice(separator + 1).trim();
    if (process.env[key] != null) continue;

    process.env[key] = unquote(rawValue);
  }
}

function unquote(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function numberFromEnv(name, fallback) {
  const parsed = Number.parseInt(process.env[name] ?? String(fallback), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}
