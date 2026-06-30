import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { apiGet } from "../../lib/api/client";
import { useSocket } from "../../hooks/useSocket";
import { SectionHeader } from "./SectionHeader";

type BackendAttack = {
  id?: string;
  attackType?: string | null;
  sourceIp?: string | null;
  targetNodeId?: string | null;
};
type RealtimeEnvelope<T> = {
  payload?: T;
};
type AttackEventPayload = {
  attack?: BackendAttack;
};

// City lat/lng â†’ projected to equirectangular 0..100 in our viewBox
const cities = [
  { name: "ReykjavÃ­k", lat: 64, lng: -22, attacker: true },
  { name: "Moscow", lat: 55, lng: 37, attacker: true },
  { name: "Beijing", lat: 39, lng: 116, attacker: true },
  { name: "Pyongyang", lat: 39, lng: 125, attacker: true },
  { name: "Tehran", lat: 35, lng: 51, attacker: true },
  { name: "SÃ£o Paulo", lat: -23, lng: -46, attacker: false },
  { name: "New York", lat: 40, lng: -74, attacker: false },
  { name: "London", lat: 51, lng: 0, attacker: false },
  { name: "Tokyo", lat: 35, lng: 139, attacker: false },
  { name: "Sydney", lat: -33, lng: 151, attacker: false },
  { name: "Mumbai", lat: 19, lng: 72, attacker: false },
  { name: "Lagos", lat: 6, lng: 3, attacker: false },
];

function proj(lat: number, lng: number) {
  const x = ((lng + 180) / 360) * 100;
  const y = ((90 - lat) / 180) * 100;
  return { x, y };
}

const fallbackAttacks: [string, string][] = [
  ["Moscow", "New York"],
  ["Beijing", "London"],
  ["Pyongyang", "Tokyo"],
  ["Tehran", "Mumbai"],
  ["ReykjavÃ­k", "SÃ£o Paulo"],
  ["Moscow", "London"],
  ["Beijing", "Sydney"],
  ["Tehran", "Lagos"],
];

export function GlobalAttackMap() {
  const [attackPaths, setAttackPaths] = useState<[string, string][]>(fallbackAttacks);
  const { socket } = useSocket("/xdr");

  useEffect(() => {
    loadAttackPaths(setAttackPaths);
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleAttack = (event: RealtimeEnvelope<AttackEventPayload>) => {
      const attack = event.payload?.attack;
      if (!attack) return;
      setAttackPaths((current) => [attackToPath(attack), ...current].slice(0, 8));
    };

    socket.on("attack_detected", handleAttack);
    return () => {
      socket.off("attack_detected", handleAttack);
    };
  }, [socket]);

  return (
    <section className="relative mx-auto max-w-7xl px-4 py-28">
      <SectionHeader
        index="// 06"
        eyebrow="Global Attack Map"
        title="A planet-scale view of the battlespace"
        description="Beams trace inbound campaigns in near-real-time. Origin nodes inherit threat-actor attribution from Sentinel intel."
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="glass-panel relative overflow-hidden p-4 lg:p-6"
      >
        <div className="relative aspect-[2/1] overflow-hidden rounded-md border border-border bg-background/40">
          <div className="absolute inset-0 cyber-grid opacity-30" />
          <svg
            viewBox="0 0 100 50"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full"
          >
            <defs>
              <radialGradient id="city-pulse">
                <stop offset="0%" stopColor="rgba(0,255,136,0.7)" />
                <stop offset="100%" stopColor="rgba(0,255,136,0)" />
              </radialGradient>
              <linearGradient id="beam" x1="0" x2="1">
                <stop offset="0%" stopColor="rgba(239,68,68,0)" />
                <stop offset="50%" stopColor="rgba(239,68,68,0.9)" />
                <stop offset="100%" stopColor="rgba(0,255,136,0.9)" />
              </linearGradient>
            </defs>
            {/* faux continents grid dots */}
            {Array.from({ length: 600 }).map((_, i) => {
              const x = (i % 40) * 2.5 + 1;
              const y = ((i / 40) | 0) * 3.2 + 1;
              const inside =
                (x > 12 && x < 30 && y > 6 && y < 22) || // N. America
                (x > 24 && x < 35 && y > 22 && y < 40) || // S. America
                (x > 42 && x < 60 && y > 4 && y < 18) || // Europe
                (x > 45 && x < 65 && y > 18 && y < 35) || // Africa
                (x > 55 && x < 95 && y > 6 && y < 25) || // Asia
                (x > 78 && x < 95 && y > 28 && y < 38); // Oceania
              if (!inside) return null;
              return (
                <circle
                  key={i}
                  cx={(x / 100) * 100}
                  cy={(y / 50) * 50}
                  r="0.18"
                  fill="rgba(0,255,136,0.32)"
                />
              );
            })}
            {/* beams */}
            {attackPaths.map(([from, to], i) => {
              const A = cities.find((c) => c.name === from)!;
              const B = cities.find((c) => c.name === to)!;
              const p1 = proj(A.lat, A.lng);
              const p2 = proj(B.lat, B.lng);
              const midX = (p1.x + p2.x) / 2;
              const midY = Math.min(p1.y, p2.y) - 10;
              return (
                <g key={`${from}-${to}-${i}`}>
                  <path
                    d={`M${p1.x / 2} ${p1.y / 2} Q ${midX / 2} ${midY / 2} ${p2.x / 2} ${p2.y / 2}`}
                    fill="none"
                    stroke="url(#beam)"
                    strokeWidth="0.25"
                    strokeLinecap="round"
                  >
                    <animate
                      attributeName="stroke-dasharray"
                      values="0 100;30 70;0 100"
                      dur={`${3 + i * 0.4}s`}
                      repeatCount="indefinite"
                    />
                  </path>
                </g>
              );
            })}
            {cities.map((c) => {
              const p = proj(c.lat, c.lng);
              const col = c.attacker ? "#ef4444" : "#00ff88";
              return (
                <g key={c.name}>
                  <circle cx={p.x / 2} cy={p.y / 2} r="1.5" fill="url(#city-pulse)">
                    <animate
                      attributeName="r"
                      values="1.2;2.4;1.2"
                      dur="2.4s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  <circle cx={p.x / 2} cy={p.y / 2} r="0.5" fill={col} />
                  <text
                    x={p.x / 2 + 0.8}
                    y={p.y / 2 - 0.6}
                    fontSize="1.2"
                    fill="rgba(220,255,235,0.7)"
                    fontFamily="JetBrains Mono"
                  >
                    {c.name}
                  </text>
                </g>
              );
            })}
          </svg>
          <div className="pointer-events-none absolute left-3 top-3 glass-panel flex items-center gap-3 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest">
            <span className="flex items-center gap-1.5 text-destructive">
              <span className="h-2 w-2 rounded-full bg-destructive" /> Origin
            </span>
            <span className="flex items-center gap-1.5 text-primary">
              <span className="h-2 w-2 rounded-full bg-primary" /> Target
            </span>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

async function loadAttackPaths(apply: (paths: [string, string][]) => void) {
  try {
    const attacks = await apiGet<BackendAttack[]>("/attacks");
    if (attacks.length) apply(attacks.slice(0, 8).map(attackToPath));
  } catch (error) {
    console.error("Failed to load global attack map", error);
  }
}

function attackToPath(attack: BackendAttack): [string, string] {
  const attackers = cities.filter((city) => city.attacker);
  const targets = cities.filter((city) => !city.attacker);
  const seed = hash(`${attack.sourceIp ?? ""}${attack.attackType ?? ""}${attack.id ?? ""}`);
  const targetSeed = hash(
    `${attack.targetNodeId ?? ""}${attack.id ?? ""}${attack.attackType ?? ""}`,
  );

  return [attackers[seed % attackers.length].name, targets[targetSeed % targets.length].name];
}

function hash(value: string) {
  return [...(value || "sentinel")].reduce((acc, char) => acc + char.charCodeAt(0), 0);
}
