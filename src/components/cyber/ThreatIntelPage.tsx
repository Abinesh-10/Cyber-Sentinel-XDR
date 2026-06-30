import { useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldAlert,
  Crosshair,
  Gauge,
  HeartPulse,
  AlertTriangle,
  Search,
  Database,
  Filter,
  CheckCircle,
  Hash
} from "lucide-react";
import { useSOC } from "./SOCContext";
import { LiveCounter } from "./LiveCounter";
import { ThreatHeatmap } from "./ThreatHeatmap";

export function ThreatIntelPage() {
  const { incidents } = useSOC();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Attack database entries mapped to MITRE ATT&CK
  const mitreDatabase = [
    { code: "T1595", category: "Reconnaissance", name: "Active Scanning", vector: "IP Block scanning, port reconnaissance", severity: "LOW", mitigation: "Deploy rate-limit, IP-blacklist" },
    { code: "T1190", category: "Initial Access", name: "Exploit Public-Facing App", vector: "SQLi, RCE payload testing", severity: "HIGH", mitigation: "WAF rules, validation sanitation" },
    { code: "T1110", category: "Credential Access", name: "Brute Force Stuffing", vector: "Automated credentials rotation", severity: "HIGH", mitigation: "Require MFA, account locking" },
    { code: "T1040", category: "Credential Access", name: "Network Sniffing", vector: "ARP poisoning, promisc packet sniffing", severity: "MEDIUM", mitigation: "VLAN isolation, encrypt traffic" },
    { code: "T1210", category: "Lateral Movement", name: "Exploitation of Remote Services", vector: "SMB transfer, zero-day deployment", severity: "CRITICAL", mitigation: "Isolate endpoints, disable RPC/SMB" },
    { code: "T1486", category: "Impact", name: "Data Encrypted for Impact", vector: "Ransomware encryption, shadow deletions", severity: "CRITICAL", mitigation: "Immutable backups, automated quarantines" },
  ];

  // Indicators of compromise database
  const iocs = [
    { type: "IP Address", value: "185.220.101.4", threat: "Tor Exit Node (Stealth port scan origin)", status: "Active Block" },
    { type: "IP Address", value: "103.88.232.14", threat: "Brute force botnet command server", status: "Active Block" },
    { type: "Domain", value: "sentinel-exploit-payload.ru", threat: "Ransomware host server", status: "DNS Blacklisted" },
    { type: "SHA-256", value: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", threat: "Malware payload delivery bundle", status: "Hash Blocked" },
    { type: "SHA-256", value: "a1a8c0bc368297b91d24c0ea238e55e8841a121d556bc1b10e52b21c43b9e4a3", threat: "ARP spoofing payload driver", status: "Hash Blocked" },
  ];

  const filteredMitre = mitreDatabase.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.vector.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "ALL" || item.category.toUpperCase() === categoryFilter.toUpperCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-12 py-8">
      {/* Title block */}
      <div>
        <span className="font-mono text-xs uppercase tracking-[0.25em] text-primary block mb-2">
          // GLOBAL SECURITY INTELLIGENCE DATABASE
        </span>
        <h1 className="font-display text-4xl font-black tracking-tight text-foreground uppercase">
          Threat Intelligence Center
        </h1>
        <p className="text-muted-foreground text-sm max-w-2xl mt-1.5">
          MITRE ATT&CK taxonomy indexing, live indicators of compromise lookup tables, global scan logs, and adversary hot-zone analysis.
        </p>
      </div>

      {/* Analytics Cards Row (Card sizes expanded 30-50% with spacious layout) */}
      <div className="grid gap-6 md:grid-cols-4">
        <div className="glass-panel p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/20 pb-3">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Total Ingress Attacks (24h)
            </span>
            <ShieldAlert className="h-5 w-5 text-primary text-glow" />
          </div>
          <div className="mt-4 font-display text-3xl font-bold text-glow text-primary">
            <LiveCounter start={2840122} step={5} intervalMs={100} value={2840122 + incidents.length * 10} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 font-mono">
            ★ +12.4% vs 7-day baseline average
          </p>
        </div>

        <div className="glass-panel p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/20 pb-3">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Active Corporate Threats
            </span>
            <Crosshair className="h-5 w-5 text-cyber-amber text-glow" />
          </div>
          <div className="mt-4 font-display text-3xl font-bold text-glow text-cyber-amber">
            <LiveCounter start={184} step={1} intervalMs={1400} value={184 + incidents.filter(i => i.status !== "MITIGATED").length} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 font-mono">
            {incidents.filter(i => i.level === "CRITICAL").length} critical alerts active
          </p>
        </div>

        <div className="glass-panel p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/20 pb-3">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              IOC Signal Scan Rate
            </span>
            <Gauge className="h-5 w-5 text-cyber-cyan text-glow" />
          </div>
          <div className="mt-4 font-display text-3xl font-bold text-glow text-cyber-cyan">
            99.987%
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 font-mono">
            Δ +0.011 signature scans / week
          </p>
        </div>

        <div className="glass-panel p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/20 pb-3">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Adversary MTTR Score
            </span>
            <AlertTriangle className="h-5 w-5 text-cyber-red text-glow animate-pulse" />
          </div>
          <div className="mt-4 font-display text-3xl font-bold text-glow text-cyber-red">
            4m 12s
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 font-mono font-bold text-cyber-red">
            CRITICAL CONTAINMENT TARGET
          </p>
        </div>
      </div>

      {/* MITRE ATT&CK & IOC Database split layout */}
      <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        {/* MITRE ATT&CK Database */}
        <div className="glass-panel p-6.5 relative overflow-hidden space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/30 pb-4 gap-4">
            <h3 className="font-display text-sm font-bold tracking-wider flex items-center gap-2.5">
              <Database className="h-5 w-5 text-primary text-glow" /> MITRE ATT&CK DATABASE
            </h3>
            
            {/* Search and Filters */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter vectors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-background border border-border pl-8 pr-3 py-1.5 rounded font-mono text-[10.5px] text-primary focus:outline-none focus:border-primary/60"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-background border border-border pl-6 pr-2 py-1.5 rounded font-mono text-[10px] text-muted-foreground focus:outline-none focus:border-primary/50 cursor-pointer"
                >
                  <option value="ALL">ALL CATEGORIES</option>
                  <option value="RECONNAISSANCE">RECONNAISSANCE</option>
                  <option value="INITIAL ACCESS">INITIAL ACCESS</option>
                  <option value="CREDENTIAL ACCESS">CREDENTIAL ACCESS</option>
                  <option value="LATERAL MOVEMENT">LATERAL MOVEMENT</option>
                  <option value="IMPACT">IMPACT</option>
                </select>
              </div>
            </div>
          </div>

          {/* Database Table layout */}
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-[11px] border-collapse">
              <thead>
                <tr className="border-b border-border/25 text-muted-foreground uppercase text-[9px] tracking-widest">
                  <th className="pb-3 pr-2">Code</th>
                  <th className="pb-3 pr-2">Category</th>
                  <th className="pb-3 pr-2">Technique</th>
                  <th className="pb-3 pr-2">Description</th>
                  <th className="pb-3 pr-2 text-right">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/15">
                {filteredMitre.map((item) => (
                  <tr key={item.code} className="hover:bg-primary/5 transition duration-200">
                    <td className="py-3 pr-2 font-bold text-primary">{item.code}</td>
                    <td className="py-3 pr-2 text-muted-foreground">{item.category}</td>
                    <td className="py-3 pr-2 text-foreground font-semibold font-display">{item.name}</td>
                    <td className="py-3 pr-2 text-muted-foreground leading-relaxed">{item.vector}</td>
                    <td className="py-3 pr-2 text-right">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold border ${
                        item.severity === "CRITICAL"
                          ? "border-cyber-red bg-cyber-red/10 text-cyber-red"
                          : item.severity === "HIGH"
                            ? "border-cyber-amber bg-cyber-amber/10 text-cyber-amber"
                            : "border-cyber-cyan bg-cyber-cyan/10 text-cyber-cyan"
                      }`}>
                        {item.severity}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredMitre.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground/50 uppercase">
                      No matching threat vectors located.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Indicators of Compromise (IOC) Block list */}
        <div className="glass-panel p-6.5 relative overflow-hidden space-y-6">
          <h3 className="font-display text-sm font-bold border-b border-border/40 pb-4 mb-4 tracking-wider flex items-center gap-2.5">
            <Hash className="h-5 w-5 text-cyber-amber" /> INDICATORS OF COMPROMISE (IOC)
          </h3>
          <div className="space-y-4">
            {iocs.map((ioc, idx) => (
              <div key={idx} className="border border-border/20 bg-black/20 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-cyber-amber/30 transition">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] bg-cyber-amber/10 text-cyber-amber border border-cyber-amber/25 px-1.5 py-0.5 rounded uppercase tracking-wider">
                      {ioc.type}
                    </span>
                    <span className="font-mono text-xs font-bold text-foreground font-display truncate max-w-[220px]">
                      {ioc.value}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground block leading-relaxed">
                    Threat: {ioc.threat}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  <CheckCircle className="h-3.5 w-3.5 text-primary" />
                  <span className="font-mono text-[9px] font-bold text-primary">
                    {ioc.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Global scan patterns Heatmap */}
      <ThreatHeatmap />
    </div>
  );
}
