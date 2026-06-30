import { motion } from "framer-motion";
import { Rocket, Play, BarChart3, Activity, Cpu, Radar } from "lucide-react";
import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../../lib/api/client";
import { useSocket } from "../../hooks/useSocket";
import { HoloGlobe } from "./HoloGlobe";
import { ParticleField } from "./ParticleField";
import { LiveCounter } from "./LiveCounter";
import { Typewriter } from "./Typewriter";
import { useSOC } from "./SOCContext";

type Dashboard = {
  network?: {
    status?: { running?: boolean };
    nodes?: Array<{ status?: string }>;
  };
  attacks?: {
    summary?: { totalAttacks?: number };
  };
  alerts?: {
    metrics?: { activeAlerts?: number; criticalAlerts?: number };
  };
  analytics?: {
    detections?: { totalDetections?: number };
  };
};

export function Hero() {
  const { setActiveTab } = useSOC();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [starting, setStarting] = useState(false);
  const { socket } = useSocket("/xdr");

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const refresh = () => loadDashboard();
    socket.on("attack_detected", refresh);
    socket.on("alert_created", refresh);
    socket.on("analytics_updated", refresh);
    socket.on("network_health_updated", refresh);
    return () => {
      socket.off("attack_detected", refresh);
      socket.off("alert_created", refresh);
      socket.off("analytics_updated", refresh);
      socket.off("network_health_updated", refresh);
    };
  }, [socket]);

  async function loadDashboard() {
    try {
      setDashboard(await apiGet<Dashboard>("/dashboard"));
    } catch (error) {
      console.error("Failed to load dashboard", error);
    }
  }

  async function launchCommandCenter() {
    setActiveTab("command-center");
  }

  async function startSimulation() {
    setStarting(true);
    try {
      await apiPost("/network/start");
      await loadDashboard();
    } catch (error) {
      console.error("Failed to start network simulation", error);
    } finally {
      setStarting(false);
    }
  }

  const attackCount = dashboard?.attacks?.summary?.totalAttacks;
  const sensorsOnline = dashboard?.network?.nodes?.filter(
    (node) => node.status === "ONLINE",
  ).length;
  const inferences = dashboard?.analytics?.detections?.totalDetections;

  return (
    <section className="relative min-h-screen overflow-hidden pt-32">
      <div className="absolute inset-0 cyber-grid" />
      <div className="absolute inset-0">
        <ParticleField />
      </div>
      {/* moving network lines */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-40"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="line-grad" x1="0" x2="1">
            <stop offset="0%" stopColor="rgba(0,255,136,0)" />
            <stop offset="50%" stopColor="rgba(0,255,136,0.8)" />
            <stop offset="100%" stopColor="rgba(0,255,136,0)" />
          </linearGradient>
        </defs>
        {[...Array(6)].map((_, i) => (
          <line
            key={i}
            x1="0"
            y1={`${15 + i * 14}%`}
            x2="100%"
            y2={`${10 + i * 16}%`}
            stroke="url(#line-grad)"
            strokeWidth="1"
            strokeDasharray="4 8"
          >
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to="-200"
              dur={`${6 + i}s`}
              repeatCount="indefinite"
            />
          </line>
        ))}
      </svg>

      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-4 py-12 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-primary">
            <span className="ticker-dot" /> NEXT-GEN XDR Â· CLASSIFIED BUILD
          </div>
          <h1 className="font-display text-5xl font-black leading-[1.05] tracking-tight md:text-7xl">
            <span className="block text-foreground/90">CYBER</span>
            <span className="block text-gradient text-glow">SENTINEL</span>
            <span className="mt-3 block text-xl font-mono font-medium uppercase tracking-[0.3em] text-muted-foreground">
              XDR Â· Threat Engine
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-foreground/80">
            <Typewriter
              phrases={[
                "AI-Powered Network Intrusion Simulation & Threat Detection Engine.",
                "Real-time autonomous response across the entire attack surface.",
                "Built for elite SOC teams operating at machine speed.",
              ]}
              className="text-foreground/85"
            />
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button className="btn-cyber btn-cyber-primary" onClick={launchCommandCenter}>
              <Rocket className="h-4 w-4" /> Launch Command Center
            </button>
            <button
              className="btn-cyber"
              onClick={startSimulation}
              disabled={starting}
              aria-busy={starting}
            >
              <Play className="h-4 w-4" /> {starting ? "Starting Simulation" : "Start Simulation"}
            </button>
            <button className="btn-cyber" onClick={() => setActiveTab("reports-analytics")}>
              <BarChart3 className="h-4 w-4" /> View Threat Analytics
            </button>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-3">
            <StatPill
              icon={<Activity className="h-4 w-4" />}
              label="Attacks blocked / 24h"
              value={<LiveCounter start={1284553} step={4} intervalMs={120} value={attackCount} />}
            />
            <StatPill
              icon={<Radar className="h-4 w-4" />}
              label="Sensors online"
              value={<LiveCounter start={48211} step={1} intervalMs={500} value={sensorsOnline} />}
            />
            <StatPill
              icon={<Cpu className="h-4 w-4" />}
              label="AI inferences / s"
              value={<LiveCounter start={9382} step={3} intervalMs={140} value={inferences} />}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative flex items-center justify-center"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-[520px] w-[520px] rounded-full bg-primary/10 blur-3xl" />
          </div>
          <div className="relative animate-float">
            <HoloGlobe size={480} />
          </div>
          {/* floating data chips */}
          <FloatingChip className="left-2 top-10" label="THREAT.LVL" value="DEFCON 3" />
          <FloatingChip className="right-0 top-20" label="ENCRYPT" value="AES-256" />
          <FloatingChip className="bottom-12 left-6" label="UPLINK" value="40 Gbps" />
          <FloatingChip className="bottom-4 right-6" label="LATENCY" value="0.8 ms" />
        </motion.div>
      </div>
    </section>
  );
}

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function StatPill({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="glass-panel glass-panel-hover corner-frame p-3">
      <div className="flex items-center gap-2 text-primary">
        {icon}
        <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="mt-1 font-mono text-xl font-bold text-primary text-glow">{value}</div>
    </div>
  );
}

function FloatingChip({
  className = "",
  label,
  value,
}: {
  className?: string;
  label: string;
  value: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.6 }}
      className={`glass-panel absolute z-10 px-3 py-2 ${className} animate-float`}
      style={{ animationDelay: `${Math.random()}s` }}
    >
      <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="font-mono text-sm font-bold text-primary text-glow">{value}</div>
    </motion.div>
  );
}
