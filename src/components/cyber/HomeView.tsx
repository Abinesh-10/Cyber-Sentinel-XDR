import { motion } from "framer-motion";
import { Shield, Brain, Cpu, Activity, AlertTriangle, ArrowRight } from "lucide-react";
import { useSOC } from "./SOCContext";
import { Hero } from "./Hero";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";

export function HomeView() {
  const { currentScore, activeAttack, incidents, setActiveTab } = useSOC();

  const openIncidents = incidents.filter((i) => i.status !== "MITIGATED");
  
  // Custom mock sparkline trend for the home dashboard
  const statsTrendData = [
    { name: "00:00", value: 30 },
    { name: "04:00", value: 45 },
    { name: "08:00", value: 28 },
    { name: "12:00", value: 60 },
    { name: "16:00", value: 85 },
    { name: "20:00", value: openIncidents.length > 0 ? 95 : 40 },
  ];

  return (
    <div className="space-y-16 pb-20">
      {/* 1. Mockup Hero Panel (Includes the HoloGlobe, typewriter text, and primary call-to-actions) */}
      <Hero />

      {/* 2. Secondary spacious metrics section for professional SOC experience */}
      <div className="mx-auto max-w-7xl px-4">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="border-t border-border/40 pt-16"
        >
          <div className="mb-10">
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-primary block mb-2">
              // SECURE INFRASTRUCTURE OVERVIEW
            </span>
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground uppercase">
              Operational Posture & Vulnerability Briefing
            </h2>
            <p className="text-muted-foreground text-sm max-w-2xl mt-2">
              Real-time calculations of organizational security health index, active mitigation playbooks, and threat intelligence streams.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Panel 1: Security Posture Index Dial (Card sized 30-50% larger with glassmorphism) */}
            <div className="glass-panel corner-frame p-8 flex flex-col justify-between min-h-[380px] relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
              <div>
                <div className="flex items-center justify-between border-b border-border/30 pb-4">
                  <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                    Security Health Index
                  </span>
                  <Shield className="h-5 w-5 text-primary text-glow animate-pulse" />
                </div>

                <div className="mt-8 flex items-center justify-center relative h-48 w-full">
                  {/* Gauge representation */}
                  <svg className="w-40 h-40 transform -rotate-90">
                    <circle
                      cx="80"
                      cy="80"
                      r="65"
                      stroke="rgba(0, 255, 136, 0.05)"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    <circle
                      cx="80"
                      cy="80"
                      r="65"
                      stroke={currentScore >= 85 ? "#00ff88" : currentScore >= 65 ? "#facc15" : "#ef4444"}
                      strokeWidth="10"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 65}
                      strokeDashoffset={2 * Math.PI * 65 * (1 - currentScore / 100)}
                      className="transition-all duration-1000 ease-out"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-display font-extrabold text-primary text-glow">
                      {currentScore}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                      {currentScore >= 85 ? "Optimal" : currentScore >= 65 ? "Elevated Risk" : "Compromised"}
                    </span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setActiveTab("reports-analytics")}
                className="btn-cyber w-full mt-4 flex items-center justify-center gap-2 group-hover:bg-primary/10 transition"
              >
                Inspect Health Analytics <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {/* Panel 2: AI Analyst operational summary (Card sized 30-50% larger) */}
            <div className="glass-panel corner-frame p-8 flex flex-col justify-between min-h-[380px] relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-cyber-cyan/5 via-transparent to-transparent pointer-events-none" />
              <div>
                <div className="flex items-center justify-between border-b border-border/30 pb-4">
                  <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                    Cognitive Agent Overview
                  </span>
                  <Brain className="h-5 w-5 text-cyber-cyan text-glow" />
                </div>

                <div className="mt-6 space-y-4">
                  <div>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground block">
                      Autonomous Analyst Status
                    </span>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="ticker-dot" />
                      <span className="font-mono text-sm text-foreground uppercase tracking-wider font-bold">
                        {activeAttack ? "INVESTIGATING THREAT" : "MONITORING ACTIVE"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground block">
                      Active Threat Signature
                    </span>
                    <p className="font-display text-sm font-semibold mt-1 text-primary tracking-wide">
                      {activeAttack ? activeAttack.title : "No anomaly signatures detected"}
                    </p>
                  </div>

                  <div>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground block">
                      AI Posture Recommendation
                    </span>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                      {activeAttack 
                        ? activeAttack.analystInfo.message 
                        : "VLAN structures stable. Firewalls routing nominal ingress/egress. Audit parameters updated globally."}
                    </p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setActiveTab("ai-analyst")}
                className="btn-cyber border-cyber-cyan text-cyber-cyan hover:bg-cyber-cyan/10 w-full mt-4 flex items-center justify-center gap-2"
              >
                Consult AI Analyst <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {/* Panel 3: Live Threat Statistics Dashboard Card (Card sized 30-50% larger) */}
            <div className="glass-panel corner-frame p-8 flex flex-col justify-between min-h-[380px] relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-cyber-amber/5 via-transparent to-transparent pointer-events-none" />
              <div>
                <div className="flex items-center justify-between border-b border-border/30 pb-4">
                  <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                    Threat Activity Trend
                  </span>
                  <Activity className="h-5 w-5 text-cyber-amber text-glow animate-pulse" />
                </div>

                <div className="mt-6">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-3xl font-display font-bold text-glow text-cyber-amber">
                        {openIncidents.length}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest ml-1.5">
                        Active Alerts
                      </span>
                    </div>
                    <span className="font-mono text-[9px] text-cyber-red font-bold">
                      {openIncidents.length > 0 ? "★ DEVIATION FLAGGED" : "NOMINAL STATE"}
                    </span>
                  </div>

                  {/* Sparkline chart to visualize activity */}
                  <div className="h-28 w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={statsTrendData}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#facc15" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#facc15" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Tooltip 
                          contentStyle={{ background: "#08080c", border: "1px solid rgba(250,204,21,0.3)", fontFamily: "monospace", fontSize: "10px" }}
                          labelClassName="text-muted-foreground"
                          itemStyle={{ color: "#facc15" }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#facc15" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#colorValue)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setActiveTab("command-center")}
                className="btn-cyber border-cyber-amber text-cyber-amber hover:bg-cyber-amber/10 w-full mt-4 flex items-center justify-center gap-2"
              >
                Launch Command Center <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
