import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { apiGet } from "../../lib/api/client";
import { useSocket } from "../../hooks/useSocket";
import { SectionHeader } from "./SectionHeader";

type AnalyticsSnapshot = {
  attacks?: {
    frequency?: Array<{ bucket: string; total: number }>;
  };
};

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const hours = Array.from({ length: 24 }, (_, i) => i);

function gen() {
  return days.map(() => hours.map(() => Math.random() ** 1.6));
}

function color(v: number) {
  // green to amber to red gradient based on intensity
  if (v < 0.25) return `rgba(0,255,136,${0.08 + v})`;
  if (v < 0.55) return `rgba(0,255,136,${0.35 + v * 0.4})`;
  if (v < 0.78) return `rgba(250,204,21,${0.45 + (v - 0.55) * 0.8})`;
  return `rgba(239,68,68,${0.55 + (v - 0.78) * 1.4})`;
}

export function ThreatHeatmap() {
  const [data, setData] = useState(gen);
  const { socket } = useSocket("/xdr");

  useEffect(() => {
    loadHeatmap(setData);
  }, []);

  useEffect(() => {
    if (!socket) return;

    const refresh = () => loadHeatmap(setData);
    socket.on("analytics_updated", refresh);
    socket.on("attack_detected", refresh);
    return () => {
      socket.off("analytics_updated", refresh);
      socket.off("attack_detected", refresh);
    };
  }, [socket]);

  return (
    <section className="relative mx-auto max-w-7xl px-4 py-28">
      <SectionHeader
        index="// 08"
        eyebrow="Threat Heatmap"
        title="When the adversary works Â· so do we"
        description="Hot zones reveal attack timing patterns across the global fleet."
      />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="glass-panel p-6"
      >
        <div className="grid grid-cols-[40px_1fr] gap-2">
          <div />
          <div
            className="grid grid-cols-24 gap-1 font-mono text-[10px] text-muted-foreground"
            style={{ gridTemplateColumns: "repeat(24, minmax(0,1fr))" }}
          >
            {hours.map((h) => (
              <div key={h} className="text-center">
                {h}
              </div>
            ))}
          </div>
          {data.map((row, i) => (
            <div key={i} className="contents">
              <div className="flex items-center justify-end pr-2 font-mono text-[10px] text-muted-foreground">
                {days[i]}
              </div>
              <div
                className="grid gap-1"
                style={{ gridTemplateColumns: "repeat(24, minmax(0,1fr))" }}
              >
                {row.map((v, j) => (
                  <div
                    key={j}
                    title={`${days[i]} ${j}:00 Â· intensity ${(v * 100).toFixed(0)}`}
                    className="aspect-square rounded-sm transition hover:scale-110"
                    style={{
                      background: color(v),
                      boxShadow:
                        v > 0.78
                          ? "0 0 8px rgba(239,68,68,0.5)"
                          : v > 0.5
                            ? "0 0 6px rgba(0,255,136,0.3)"
                            : "none",
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          <span>Hour of day Â· UTC</span>
          <div className="flex items-center gap-2">
            <span>Low</span>
            <div
              className="h-2 w-40 rounded"
              style={{
                background:
                  "linear-gradient(to right, rgba(0,255,136,0.15), rgba(0,255,136,0.8), rgba(250,204,21,0.9), rgba(239,68,68,0.9))",
              }}
            />
            <span>Critical</span>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

async function loadHeatmap(apply: (data: number[][]) => void) {
  try {
    const snapshot = await apiGet<AnalyticsSnapshot>("/analytics");
    const next = heatmapFromAnalytics(snapshot);
    if (next) apply(next);
  } catch (error) {
    console.error("Failed to load threat heatmap", error);
  }
}

function heatmapFromAnalytics(snapshot: AnalyticsSnapshot) {
  const rows = snapshot.attacks?.frequency;
  if (!rows?.length) return null;

  const grid = days.map(() => hours.map(() => 0));
  const max = Math.max(...rows.map((row) => Number(row.total ?? 0)), 1);

  for (const row of rows) {
    const date = new Date(row.bucket);
    if (Number.isNaN(date.getTime())) continue;
    const dayIndex = (date.getUTCDay() + 6) % 7;
    const hourIndex = date.getUTCHours();
    grid[dayIndex][hourIndex] = Math.max(grid[dayIndex][hourIndex], Number(row.total ?? 0) / max);
  }

  return grid;
}
