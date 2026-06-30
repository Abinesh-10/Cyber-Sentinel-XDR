import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { apiGet } from "../../lib/api/client";
import { useSocket } from "../../hooks/useSocket";
import { SectionHeader } from "./SectionHeader";
import { useSOC } from "./SOCContext";
import { Server, ShieldAlert, Laptop, Database, Cpu, HelpCircle, Activity } from "lucide-react";

type Node = {
  id: string;
  x: number;
  y: number;
  type: string;
  health: "ok" | "warn" | "crit";
  uptime?: string;
  throughput?: string;
  activeSessions?: string;
  openIncidents?: string;
  riskScore?: string;
};
type BackendNode = {
  id: string;
  name?: string;
  type?: string;
  status?: string;
  health?: string;
  riskScore?: number;
  uptimeSeconds?: number;
  throughputBps?: number;
  activeSessions?: number;
};

const nodes: Node[] = [
  { id: "CORE-01", x: 50, y: 50, type: "Core Switch & Router", health: "ok" },
  { id: "FW-EDGE", x: 22, y: 30, type: "Edge Firewall", health: "ok" },
  { id: "DC-EU-1", x: 80, y: 30, type: "Web Server (EU)", health: "warn" },
  { id: "DC-US-2", x: 78, y: 70, type: "App Server (US)", health: "ok" },
  { id: "IOT-MESH", x: 25, y: 75, type: "IoT Smart Mesh", health: "crit" },
  { id: "SOC-NODE", x: 50, y: 18, type: "SOC Center Server", health: "ok" },
  { id: "CLOUD-AWS", x: 92, y: 50, type: "Cloud Gateway Gateway", health: "ok" },
  { id: "ENDPOINT", x: 8, y: 55, type: "User Workstations", health: "warn" },
  { id: "DB-VAULT", x: 50, y: 86, type: "Secure Database Vault", health: "ok" },
];
const links: [string, string][] = [
  ["CORE-01", "FW-EDGE"],
  ["CORE-01", "DC-EU-1"],
  ["CORE-01", "DC-US-2"],
  ["CORE-01", "IOT-MESH"],
  ["CORE-01", "SOC-NODE"],
  ["CORE-01", "CLOUD-AWS"],
  ["CORE-01", "ENDPOINT"],
  ["CORE-01", "DB-VAULT"],
  ["DC-EU-1", "CLOUD-AWS"],
  ["IOT-MESH", "ENDPOINT"],
  ["DC-US-2", "DB-VAULT"],
];

const healthColor = { ok: "#00ff88", warn: "#facc15", crit: "#ef4444" };

// Helper to return node icon based on type/id
const getNodeIcon = (id: string, type: string) => {
  const t = type.toLowerCase();
  const i = id.toLowerCase();
  if (t.includes("vault") || i.includes("db")) return <Database className="h-3 w-3" />;
  if (t.includes("firewall") || i.includes("fw")) return <ShieldAlert className="h-3 w-3" />;
  if (t.includes("endpoint") || i.includes("end")) return <Laptop className="h-3 w-3" />;
  if (t.includes("router") || i.includes("core") || t.includes("switch")) return <Cpu className="h-3 w-3" />;
  if (t.includes("soc")) return <Activity className="h-3 w-3" />;
  return <Server className="h-3 w-3" />;
};

export function NetworkTopology() {
  const [networkNodes, setNetworkNodes] = useState<Node[]>(nodes);
  const [active, setActive] = useState<Node>(nodes[0]);
  const [loadingNode, setLoadingNode] = useState(false);
  const { socket } = useSocket("/xdr");
  const { activeAttack } = useSOC();

  useEffect(() => {
    let mounted = true;

    loadNodes((mapped) => {
      if (!mounted) return;
      setNetworkNodes(mapped);
      setActive((current) => mapped.find((node) => node.id === current.id) ?? mapped[0]);
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    const refresh = () => {
      loadNodes((mapped) => {
        setNetworkNodes(mapped);
        setActive((current) => mapped.find((node) => node.id === current.id) ?? mapped[0]);
      });
    };

    socket.on("node_updated", refresh);
    socket.on("network_health_updated", refresh);
    return () => {
      socket.on("node_updated", refresh);
      socket.on("network_health_updated", refresh);
    };
  }, [socket]);

  async function openDeepDive() {
    setLoadingNode(true);
    try {
      const mapped = await fetchNodes();
      setNetworkNodes(mapped);
      setActive((current) => mapped.find((node) => node.id === current.id) ?? mapped[0]);
    } catch (error) {
      console.error("Failed to refresh selected node", error);
    } finally {
      setLoadingNode(false);
    }
  }

  // Calculate coordinates for the attack animation path dynamically based on progress
  const getAttackPathCoordinates = () => {
    if (!activeAttack) return null;
    
    // Choose coordinates based on attack code
    let pathIds = ["FW-EDGE", "CORE-01"];
    if (activeAttack.code === "ATK.001") {
      pathIds = ["ENDPOINT", "FW-EDGE", "CORE-01"];
    } else if (activeAttack.code === "ATK.002") {
      pathIds = ["ENDPOINT", "FW-EDGE", "CORE-01", "IOT-MESH"];
    } else if (activeAttack.code === "ATK.003") {
      pathIds = ["ENDPOINT", "CORE-01", "SOC-NODE"];
    } else if (activeAttack.code === "ATK.004") {
      pathIds = ["FW-EDGE", "CORE-01", "SOC-NODE"];
    } else if (activeAttack.code === "ATK.005") {
      pathIds = ["ENDPOINT", "CORE-01", "DB-VAULT"];
    }

    const pathNodes = pathIds.map(id => networkNodes.find(n => n.id === id)).filter(Boolean) as Node[];
    if (pathNodes.length < 2) return null;

    const progressFraction = (activeAttack.progress ?? 0) / 100;
    const numSegments = pathNodes.length - 1;
    
    if (numSegments <= 0) return null;

    const fullSegments = Math.floor(progressFraction * numSegments);
    const segmentRemainder = (progressFraction * numSegments) - fullSegments;

    let pathD = `M ${pathNodes[0].x} ${pathNodes[0].y}`;
    for (let i = 1; i <= fullSegments; i++) {
      pathD += ` L ${pathNodes[i].x} ${pathNodes[i].y}`;
    }

    if (fullSegments < numSegments) {
      const nodeA = pathNodes[fullSegments];
      const nodeB = pathNodes[fullSegments + 1];
      const targetX = nodeA.x + (nodeB.x - nodeA.x) * segmentRemainder;
      const targetY = nodeA.y + (nodeB.y - nodeA.y) * segmentRemainder;
      pathD += ` L ${targetX} ${targetY}`;
    }

    return pathD;
  };

  const attackPathD = getAttackPathCoordinates();


  return (
    <section id="topology" className="relative mx-auto max-w-7xl px-4">
      <SectionHeader
        index="// 03"
        eyebrow="Digital Twin SOC Network View"
        title="Live Topology & Breach Contagion Simulator"
        description="Interact with nodes to inspect telemetry, and observe real-time payload movements on active threat signals."
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="glass-panel relative overflow-hidden p-4 lg:p-6"
      >
        <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
          <div className="relative aspect-[16/10] lg:aspect-auto lg:h-[68vh] overflow-hidden rounded-md border border-border bg-background/40">
            <div className="absolute inset-0 cyber-grid opacity-40" />
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full"
            >
              <defs>
                <linearGradient id="link" x1="0" x2="1">
                  <stop offset="0%" stopColor="rgba(0,255,136,0.1)" />
                  <stop offset="50%" stopColor="rgba(0,255,136,0.9)" />
                  <stop offset="100%" stopColor="rgba(0,255,136,0.1)" />
                </linearGradient>
                <linearGradient id="attackGrad" x1="0" x2="1">
                  <stop offset="0%" stopColor="rgba(255, 59, 48, 0.2)" />
                  <stop offset="50%" stopColor="rgba(255, 59, 48, 1)" />
                  <stop offset="100%" stopColor="rgba(255, 59, 48, 0.2)" />
                </linearGradient>
              </defs>

              {/* Draw default links */}
              {links.map(([a, b], i) => {
                const A = networkNodes.find((n) => n.id === a);
                const B = networkNodes.find((n) => n.id === b);
                if (!A || !B) return null;
                return (
                  <g key={i}>
                    <line
                      x1={A.x}
                      y1={A.y}
                      x2={B.x}
                      y2={B.y}
                      stroke="rgba(0,255,136,0.25)"
                      strokeWidth="0.25"
                    />
                    <line
                      x1={A.x}
                      y1={A.y}
                      x2={B.x}
                      y2={B.y}
                      stroke="url(#link)"
                      strokeWidth="0.4"
                      strokeDasharray="1 3"
                    >
                      <animate
                        attributeName="stroke-dashoffset"
                        from="0"
                        to="-20"
                        dur={`${2 + i * 0.3}s`}
                        repeatCount="indefinite"
                      />
                    </line>
                  </g>
                );
              })}

              {/* Draw active animated attack propagation path */}
              {activeAttack && attackPathD && (
                <g>
                  <path
                    d={attackPathD}
                    fill="none"
                    stroke="#ff3b30"
                    strokeWidth="1.2"
                    strokeOpacity="0.45"
                    className="blur-[2px]"
                  />
                  <path
                    d={attackPathD}
                    fill="none"
                    stroke="url(#attackGrad)"
                    strokeWidth="0.8"
                    strokeDasharray="2 4"
                  >
                    <animate
                      attributeName="stroke-dashoffset"
                      from="0"
                      to="-30"
                      dur="1.5s"
                      repeatCount="indefinite"
                    />
                  </path>
                  {/* Glowing travel marker representing packet exfiltration/inward attack */}
                  <circle r="1" fill="#ff3b30" className="shadow-[0_0_10px_#ff3b30]">
                    <animateMotion
                      path={attackPathD}
                      dur="3s"
                      repeatCount="indefinite"
                    />
                  </circle>
                </g>
              )}

              {/* Draw Nodes */}
              {networkNodes.map((n) => {
                const isActiveAttackTarget = activeAttack && activeAttack.targetNodeId === n.id;
                const nodeColor = isActiveAttackTarget ? "#ff3b30" : healthColor[n.health];
                return (
                  <g key={n.id} onClick={() => setActive(n)} style={{ cursor: "pointer" }}>
                    <circle cx={n.x} cy={n.y} r="3" fill={nodeColor} opacity="0.2">
                      <animate
                        attributeName="r"
                        values={isActiveAttackTarget ? "3;6;3" : "3;4.8;3"}
                        dur={isActiveAttackTarget ? "1.2s" : "2.4s"}
                        repeatCount="indefinite"
                      />
                    </circle>
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r="1.8"
                      fill={nodeColor}
                      className={isActiveAttackTarget ? "animate-pulse" : ""}
                    />
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r="3"
                      fill="none"
                      stroke={nodeColor}
                      strokeWidth="0.3"
                    />
                    {/* Render ForeignObject to embed glowing icons */}
                    <foreignObject
                      x={n.x - 4}
                      y={n.y - 4}
                      width="8"
                      height="8"
                      className="pointer-events-none"
                    >
                      <div
                        className="flex h-full w-full items-center justify-center"
                        style={{ color: nodeColor }}
                      >
                        {getNodeIcon(n.id, n.type)}
                      </div>
                    </foreignObject>

                    <text
                      x={n.x}
                      y={n.y - 4.5}
                      textAnchor="middle"
                      fill="rgba(220,255,235,0.9)"
                      fontSize="2.2"
                      fontWeight="bold"
                      fontFamily="JetBrains Mono, monospace"
                      className="text-glow"
                    >
                      {n.id}
                    </text>
                  </g>
                );
              })}
            </svg>
            <div className="pointer-events-none absolute right-3 top-3 glass-panel px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-primary flex items-center gap-1.5">
              <span className="ticker-dot" /> Topology · Real-Time Twin
            </div>
          </div>

          {/* Node detail panel */}
          <div className="glass-panel p-4 flex flex-col justify-between">
            <div>
              <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                Selected Node
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div>
                  <div className="font-display text-xl font-bold text-primary">{active.id}</div>
                  <div className="text-xs text-muted-foreground">{active.type}</div>
                </div>
                <div
                  className="rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest border"
                  style={{
                    color: activeAttack && activeAttack.targetNodeId === active.id ? "#ff3b30" : healthColor[active.health],
                    borderColor: activeAttack && activeAttack.targetNodeId === active.id ? "#ff3b3044" : `${healthColor[active.health]}44`,
                    backgroundColor: activeAttack && activeAttack.targetNodeId === active.id ? "#ff3b3011" : `${healthColor[active.health]}11`,
                  }}
                >
                  {activeAttack && activeAttack.targetNodeId === active.id ? "compromised" : active.health}
                </div>
              </div>
              <div className="mt-4 space-y-2 font-mono text-xs">
                <Row k="Uptime" v={active.uptime ?? "142d 04h"} />
                <Row k="Throughput" v={active.throughput ?? "38.2 Gb/s"} />
                <Row k="Active sessions" v={active.activeSessions ?? "14,302"} />
                <Row
                  k="Open incidents"
                  v={
                    active.openIncidents ??
                    (active.health === "crit" ? "3" : active.health === "warn" ? "1" : "0")
                  }
                />
                <Row
                  k="Risk score"
                  v={
                    active.riskScore ??
                    (active.health === "crit" ? "92" : active.health === "warn" ? "54" : "12")
                  }
                />
              </div>
            </div>
            <button
              className="btn-cyber mt-5 w-full !py-2 text-[9px]"
              onClick={openDeepDive}
              disabled={loadingNode}
              aria-busy={loadingNode}
            >
              {loadingNode ? "Interrogating Node..." : "Run Active Probe"}
            </button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function loadNodes(apply: (nodes: Node[]) => void) {
  fetchNodes()
    .then((mapped) => {
      if (mapped.length) apply(mapped);
    })
    .catch((error) => {
      console.error("Failed to load network nodes", error);
    });
}

async function fetchNodes() {
  const backendNodes = await apiGet<BackendNode[]>("/nodes");
  return backendNodes.map(mapBackendNode);
}

function mapBackendNode(node: BackendNode, index: number): Node {
  const fallback = nodes.find((item) => item.id === node.id) ?? nodes[index % nodes.length];

  return {
    id: node.id,
    x: fallback.x,
    y: fallback.y,
    type: node.name ?? node.type ?? fallback.type,
    health: normalizeHealth(node.health ?? node.status),
    uptime: formatUptime(node.uptimeSeconds),
    throughput: formatThroughput(node.throughputBps),
    activeSessions: node.activeSessions == null ? undefined : node.activeSessions.toLocaleString(),
    riskScore: node.riskScore == null ? undefined : String(Math.round(node.riskScore)),
  };
}

function normalizeHealth(value?: string | null): Node["health"] {
  if (value === "CRIT" || value === "OFFLINE" || value === "COMPROMISED") return "crit";
  if (value === "WARN" || value === "DEGRADED" || value === "MAINTENANCE") return "warn";
  return "ok";
}

function formatUptime(seconds?: number) {
  if (seconds == null) return undefined;
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return `${days}d ${String(hours).padStart(2, "0")}h`;
}

function formatThroughput(value?: number) {
  if (value == null) return undefined;
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)} Gb/s`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} Mb/s`;
  return `${Math.round(value).toLocaleString()} b/s`;
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-primary">{v}</span>
    </div>
  );
}
