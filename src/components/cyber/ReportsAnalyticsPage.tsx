import { motion } from "framer-motion";
import { Shield, TrendingUp, AlertTriangle, DollarSign, Activity, FileSpreadsheet, BarChart2 } from "lucide-react";
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
import { ReportGenerator } from "./ReportGenerator";

export function ReportsAnalyticsPage() {
  const { currentScore, incidents } = useSOC();

  // Color mappings
  const COLORS = ["#00ff88", "#00d9ff", "#ffb700", "#ff3b30", "#a100ff"];

  // Threat trend data
  const trendData = [
    { week: "Week 1", DDoS: 2, Ransomware: 0, BruteForce: 4, MITM: 1 },
    { week: "Week 2", DDoS: 5, Ransomware: 1, BruteForce: 6, MITM: 3 },
    { week: "Week 3", DDoS: 4, Ransomware: 1, BruteForce: 8, MITM: 2 },
    { week: "Week 4", DDoS: 8, Ransomware: 2, BruteForce: 12, MITM: 5 },
    { week: "Week 5", DDoS: 12, Ransomware: 3, BruteForce: 18, MITM: 7 },
    { week: "Week 6", DDoS: 15, Ransomware: 4, BruteForce: 24, MITM: 9 },
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

  const mitigatedCount = incidents.filter(i => i.status === "MITIGATED").length;
  const activeCount = incidents.filter(i => i.status !== "MITIGATED").length;
  const financialExposure = incidents.filter(i => i.status !== "MITIGATED").reduce((sum, i) => sum + (i.financialDamage || 0), 0);

  return (
    <div className="space-y-12 py-8">
      {/* Title */}
      <div>
        <span className="font-mono text-xs uppercase tracking-[0.25em] text-primary block mb-2">
          // AUDIT ANALYSIS & COMPLIANCE
        </span>
        <h1 className="font-display text-4xl font-black tracking-tight text-foreground uppercase">
          Reports & Analytics Dashboard
        </h1>
        <p className="text-muted-foreground text-sm max-w-2xl mt-1.5">
          Longitudinal posture audits, threat vector breakout distributions, mitigation performance charting, and compliance export engines.
        </p>
      </div>

      {/* Overview stats cards (30-50% larger cards with sleek typography) */}
      <div className="grid gap-6 md:grid-cols-4">
        {/* Posture card */}
        <div className="glass-panel corner-frame p-6.5 flex flex-col justify-between min-h-[160px] relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between border-b border-border/20 pb-3">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Security Posture Rating
              </span>
              <Shield className="h-5.5 w-5.5 text-primary text-glow" />
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-display font-bold text-primary text-glow">
                {currentScore}
              </span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
            {currentScore >= 85 ? "✓ Secure & Optimized" : "⚠ Elevated Hazard State"}
          </span>
        </div>

        {/* Threat Level */}
        <div className="glass-panel corner-frame p-6.5 flex flex-col justify-between min-h-[160px] relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between border-b border-border/20 pb-3">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Vulnerability Exposure
              </span>
              <TrendingUp className="h-5.5 w-5.5 text-cyber-amber text-glow" />
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-display font-bold text-cyber-amber text-glow">
                {Math.max(2, Math.round((100 - currentScore) * 0.8))}%
              </span>
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
            Perimeter risk evaluation
          </span>
        </div>

        {/* Total Cost card */}
        <div className="glass-panel corner-frame p-6.5 flex flex-col justify-between min-h-[160px] relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between border-b border-border/20 pb-3">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Projected Financial Loss
              </span>
              <DollarSign className="h-5.5 w-5.5 text-cyber-red text-glow animate-pulse" />
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-display font-bold text-cyber-red text-glow">
                ${financialExposure.toLocaleString()}
              </span>
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
            Blast exposure damage
          </span>
        </div>

        {/* Mitigated Alerts */}
        <div className="glass-panel corner-frame p-6.5 flex flex-col justify-between min-h-[160px] relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between border-b border-border/20 pb-3">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Threat Mitigation Rate
              </span>
              <Activity className="h-5.5 w-5.5 text-cyber-cyan text-glow" />
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-display font-bold text-cyber-cyan text-glow">
                {mitigatedCount}
              </span>
              <span className="text-xs text-muted-foreground">/ {incidents.length} contained</span>
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
            Mitigated intrusion alerts
          </span>
        </div>
      </div>

      {/* Grid of charts: Max 2 or 3 cards per row to prevent crowding, cards sized 30-50% larger with clean whitespace */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Area Chart: Multi-Vector Threat Trend */}
        <div className="glass-panel p-6.5 relative overflow-hidden space-y-4">
          <h3 className="font-display text-sm font-bold border-b border-border/30 pb-3 tracking-wider flex items-center gap-2">
            <BarChart2 className="h-4.5 w-4.5 text-primary" /> MULTI-VECTOR INTRUSION TIMELINES
          </h3>
          <div className="h-[300px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorDDoS" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00ff88" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorBrute" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#facc15" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#facc15" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorRansom" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="week" stroke="#888" fontSize={9} tickLine={false} />
                <YAxis stroke="#888" fontSize={9} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#08080c", border: "1px solid rgba(0,255,136,0.2)", fontFamily: "monospace", fontSize: "10px" }}
                  labelClassName="text-muted-foreground"
                />
                <Area type="monotone" dataKey="DDoS" stroke="#00ff88" strokeWidth={1.5} fillOpacity={1} fill="url(#colorDDoS)" />
                <Area type="monotone" dataKey="BruteForce" stroke="#facc15" strokeWidth={1.5} fillOpacity={1} fill="url(#colorBrute)" />
                <Area type="monotone" dataKey="Ransomware" stroke="#ef4444" strokeWidth={1.5} fillOpacity={1} fill="url(#colorRansom)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart: Monthly Mitigated vs BreachSuccess */}
        <div className="glass-panel p-6.5 relative overflow-hidden space-y-4">
          <h3 className="font-display text-sm font-bold border-b border-border/30 pb-3 tracking-wider flex items-center gap-2">
            <BarChart2 className="h-4.5 w-4.5 text-cyber-cyan" /> MITIGATION & BREACH PROGRESSION RATE
          </h3>
          <div className="h-[300px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <XAxis dataKey="month" stroke="#888" fontSize={9} tickLine={false} />
                <YAxis stroke="#888" fontSize={9} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#08080c", border: "1px solid rgba(0,217,255,0.2)", fontFamily: "monospace", fontSize: "10px" }}
                  labelClassName="text-muted-foreground"
                />
                <Bar dataKey="Mitigated" fill="#00ff88" radius={[2, 2, 0, 0]} maxBarSize={30} />
                <Bar dataKey="BreachSuccess" fill="#ef4444" radius={[2, 2, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row containing Technique Breakout + Report Generator exporter */}
      <div className="grid gap-8 lg:grid-cols-[1fr_1.5fr]">
        {/* Pie Chart technique breakout */}
        <div className="glass-panel p-6.5 relative overflow-hidden flex flex-col justify-between">
          <div>
            <h3 className="font-display text-sm font-bold border-b border-border/30 pb-3 tracking-wider flex items-center gap-2 mb-4">
              <BarChart2 className="h-4.5 w-4.5 text-cyber-amber" /> THREAT SPECTRUM BREAKOUT
            </h3>
            <div className="h-48 w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 font-mono text-[9px] text-muted-foreground pt-4 border-t border-border/20">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="truncate">{d.name} ({d.value}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Printable PDF Report Exporter card */}
        <div className="glass-panel p-2">
          <ReportGenerator />
        </div>
      </div>
    </div>
  );
}
