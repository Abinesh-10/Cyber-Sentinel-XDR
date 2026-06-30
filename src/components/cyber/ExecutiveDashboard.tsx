import { motion } from "framer-motion";
import { Shield, TrendingUp, AlertTriangle, DollarSign, Activity } from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useSOC } from "./SOCContext";

export function ExecutiveDashboard() {
  const { currentScore, incidents } = useSOC();

  // Color mappings
  const COLORS = ["#00ff88", "#00d9ff", "#ffb700", "#ff3b30", "#a100ff"];

  // Threat trend data
  const trendData = [
    { week: "W1", DDoS: 2, Ransomware: 0, BruteForce: 4, MITM: 1 },
    { week: "W2", DDoS: 5, Ransomware: 1, BruteForce: 6, MITM: 3 },
    { week: "W3", DDoS: 4, Ransomware: 1, BruteForce: 8, MITM: 2 },
    { week: "W4", DDoS: 8, Ransomware: 2, BruteForce: 12, MITM: 5 },
    { week: "W5", DDoS: 12, Ransomware: 3, BruteForce: 18, MITM: 7 },
    { week: "W6", DDoS: 15, Ransomware: 4, BruteForce: 24, MITM: 9 },
  ];

  // Monthly comparison
  const monthlyData = [
    { month: "Jan", Mitigated: 35, BreachSuccess: 2 },
    { month: "Feb", Mitigated: 48, BreachSuccess: 3 },
    { month: "Mar", Mitigated: 54, BreachSuccess: 1 },
    { month: "Apr", Mitigated: 60, BreachSuccess: 4 },
    { month: "May", Mitigated: 78, BreachSuccess: 2 },
    { month: "Jun", Mitigated: 94, BreachSuccess: incidents.filter(i => i.status !== "MITIGATED").length },
  ];

  // Top threat categories distribution
  const pieData = [
    { name: "Credential Stuffing", value: 38 },
    { name: "Volumetric DDoS", value: 25 },
    { name: "MITM Sniffing", value: 17 },
    { name: "Stealth Recon", value: 12 },
    { name: "Malware/Ransomware", value: 8 },
  ];

  // Posture status description
  const getPostureRating = (score: number) => {
    if (score >= 85) return { label: "SECURE & OPTIMIZED", color: "text-primary border-primary/40 bg-primary/5" };
    if (score >= 65) return { label: "ELEVATED RISK STATUS", color: "text-cyber-amber border-cyber-amber/40 bg-cyber-amber/5" };
    return { label: "CRITICAL BREACH WARNING", color: "text-cyber-red border-cyber-red/40 bg-cyber-red/5" };
  };

  const posture = getPostureRating(currentScore);

  // Risk assessment matrix mapping: Likelihood (1-5) vs Impact (1-5)
  // FW-EDGE: High Likelihood (4), Moderate Impact (2)
  // CORE-01: Low Likelihood (1), Critical Impact (5)
  // DB-VAULT: Low Likelihood (2), Critical Impact (5)
  // IOT-MESH: Critical Likelihood (5), High Impact (3)
  // ENDPOINTS: Critical Likelihood (5), Moderate Impact (2)
  const matrixItems = [
    { id: "FW-EDGE", x: 4, y: 2, color: "bg-cyber-amber/80" },
    { id: "CORE-01", x: 1, y: 5, color: "bg-cyber-red/80 shadow-[0_0_12px_rgba(239,68,68,0.7)]" },
    { id: "DB-VAULT", x: 2, y: 5, color: "bg-cyber-red/80 shadow-[0_0_12px_rgba(239,68,68,0.7)]" },
    { id: "IOT-MESH", x: 5, y: 3, color: "bg-cyber-amber/80" },
    { id: "ENDPOINT", x: 5, y: 2, color: "bg-cyber-cyan/80" },
  ];

  return (
    <div className="space-y-8 py-10">
      {/* Overview stats cards */}
      <div className="grid gap-5 md:grid-cols-4">
        {/* Posture card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel corner-frame p-6 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Security Posture
              </span>
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-display font-bold text-primary text-glow">
                {currentScore}
              </span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
          </div>
          <div className={`mt-4 rounded border p-2 text-center font-mono text-[9px] font-bold tracking-wider ${posture.color}`}>
            {posture.label}
          </div>
        </motion.div>

        {/* Risk Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-panel corner-frame p-6 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Active Exposure
              </span>
              <TrendingUp className="h-5 w-5 text-cyber-amber" />
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-display font-bold text-cyber-amber text-glow">
                {(100 - currentScore) * 0.8}%
              </span>
            </div>
          </div>
          <p className="mt-4 text-[10px] text-muted-foreground leading-relaxed">
            Perimeter vulnerability level calculated across anomalous gateway transactions.
          </p>
        </motion.div>

        {/* Total Cost card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel corner-frame p-6 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Estimated Financial Exposure
              </span>
              <DollarSign className="h-5 w-5 text-cyber-red" />
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-display font-bold text-cyber-red text-glow">
                ${incidents.filter(i => i.status !== "MITIGATED").reduce((sum, i) => sum + (i.financialDamage || 0), 0).toLocaleString()}
              </span>
            </div>
          </div>
          <p className="mt-4 text-[10px] text-muted-foreground leading-relaxed">
            Projected damage calculated relative to records exposed and downtime duration.
          </p>
        </motion.div>

        {/* Open alert count */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-panel corner-frame p-6 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Unmitigated Threats
              </span>
              <AlertTriangle className="h-5 w-5 text-cyber-red" />
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-display font-bold text-cyber-red text-glow">
                {incidents.filter(i => i.status !== "MITIGATED").length}
              </span>
            </div>
          </div>
          <p className="mt-4 text-[10px] text-muted-foreground leading-relaxed">
            Incident queue load requiring immediate SOC orchestration and containment.
          </p>
        </motion.div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Trend Area Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel p-5 flex flex-col h-80"
        >
          <h3 className="font-display text-sm font-bold border-b border-border/40 pb-2 mb-4 tracking-wider flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" /> THREAT ACTIVITY TRENDS
          </h3>
          <div className="flex-1 w-full text-xs font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDDoS" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00ff88" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorBrute" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffb700" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ffb700" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="week" stroke="rgba(255,255,255,0.4)" />
                <YAxis stroke="rgba(255,255,255,0.4)" />
                <Tooltip
                  contentStyle={{ backgroundColor: "rgba(0,0,0,0.9)", border: "1px solid rgba(0,255,136,0.3)" }}
                  labelClassName="text-primary font-bold font-mono"
                />
                <Area type="monotone" dataKey="DDoS" stroke="#00ff88" fillOpacity={1} fill="url(#colorDDoS)" />
                <Area type="monotone" dataKey="BruteForce" stroke="#ffb700" fillOpacity={1} fill="url(#colorBrute)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Monthly Bar Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
          className="glass-panel p-5 flex flex-col h-80"
        >
          <h3 className="font-display text-sm font-bold border-b border-border/40 pb-2 mb-4 tracking-wider flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-cyber-cyan" /> ATTACK MITIGATION INDEX
          </h3>
          <div className="flex-1 w-full text-xs font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" />
                <YAxis stroke="rgba(255,255,255,0.4)" />
                <Tooltip
                  contentStyle={{ backgroundColor: "rgba(0,0,0,0.9)", border: "1px solid rgba(0,217,255,0.3)" }}
                />
                <Bar dataKey="Mitigated" fill="#00ff88" stackId="a" />
                <Bar dataKey="BreachSuccess" fill="#ff3b30" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Risk Matrix and Threat Categories */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Risk Assessment Matrix */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-5"
        >
          <h3 className="font-display text-sm font-bold border-b border-border/40 pb-2 mb-4 tracking-wider flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-cyber-amber" /> INFRASTRUCTURE RISK MATRIX
          </h3>
          <div className="relative aspect-square max-w-[340px] mx-auto border border-border/60 bg-black/40 p-4">
            {/* Axis labels */}
            <div className="absolute -left-6 top-1/2 -rotate-90 -translate-y-1/2 font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
              Criticality / Impact →
            </div>
            <div className="absolute bottom-[-18px] left-1/2 -translate-x-1/2 font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
              Exploitation Likelihood →
            </div>

            {/* 5x5 Grid */}
            <div className="grid grid-cols-5 grid-rows-5 gap-1 h-full w-full border border-border/30 bg-background/20 relative">
              {Array.from({ length: 25 }).map((_, idx) => {
                const colIdx = idx % 5;
                const rowIdx = 4 - Math.floor(idx / 5); // invert row to count bottom-up
                const xVal = colIdx + 1;
                const yVal = rowIdx + 1;

                // Color cell background based on risk severity
                let cellColor = "bg-green-500/5";
                if (xVal + yVal >= 8) cellColor = "bg-red-500/20";
                else if (xVal + yVal >= 6) cellColor = "bg-amber-500/15";
                else if (xVal + yVal >= 4) cellColor = "bg-cyan-500/10";

                return (
                  <div
                    key={idx}
                    className={`relative flex items-center justify-center border border-border/10 ${cellColor}`}
                  >
                    {/* Render active nodes matching coordinate */}
                    {matrixItems
                      .filter((item) => item.x === xVal && item.y === yVal)
                      .map((n) => (
                        <div
                          key={n.id}
                          className={`z-10 rounded px-1 py-0.5 font-mono text-[7px] font-bold text-black ${n.color}`}
                          title={`${n.id} (L:${n.x}, I:${n.y})`}
                        >
                          {n.id}
                        </div>
                      ))}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Threat Distribution Pie */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-panel p-5 flex flex-col justify-between"
        >
          <div>
            <h3 className="font-display text-sm font-bold border-b border-border/40 pb-2 mb-4 tracking-wider flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" /> ADVERSARY ATTACK DISTRIBUTION
            </h3>
            <div className="h-44 w-full font-mono text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "rgba(0,0,0,0.9)", border: "1px solid rgba(0,255,136,0.3)" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] font-mono border-t border-border/40 pt-3">
            {pieData.map((item, i) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-muted-foreground truncate">{item.name} ({item.value}%)</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
