import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  LayoutDashboard,
  KeyRound,
  FileCode,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle,
  Copy,
  Plus,
  ArrowRight,
  Server,
  Terminal,
  Brain,
  Layers,
  Globe,
  Database
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { soundEngine } from "../../lib/sound";

type SubPage = "overview" | "register" | "dashboard" | "keys" | "guide";

export function EnterpriseHub() {
  const [activeSub, setActiveSub] = useState<SubPage>("overview");
  
  // Organization registration details stored in state
  const [orgData, setOrgData] = useState({
    companyName: "Acme Security Corp",
    companyId: "CS-COMP-001",
    websiteUrl: "https://acmesecurity.com",
    industry: "Financial Technology",
    contactPerson: "Sarah Connor",
    companyEmail: "ciso@acmesecurity.com",
    employeeCount: "250-500",
    country: "United States",
    apiKey: "cs_live_7f9d2k4h8m3x1p9",
    monitoringStatus: "Active",
    registrationDate: new Date().toLocaleDateString(),
    securityScore: 92,
    isRegistered: false
  });

  const [formInput, setFormInput] = useState({
    companyName: "",
    websiteUrl: "",
    industry: "Financial Technology",
    contactPerson: "",
    companyEmail: "",
    employeeCount: "50-100",
    country: "United States"
  });

  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate a random mock API key on request
  const handleGenerateKey = () => {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let key = "cs_live_";
    for (let i = 0; i < 15; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setOrgData(prev => ({ ...prev, apiKey: key }));
    soundEngine.play("execute");
  };

  // Copy API key utility
  const handleCopyKey = () => {
    navigator.clipboard.writeText(orgData.apiKey);
    setCopied(true);
    soundEngine.play("success");
    setTimeout(() => setCopied(false), 2000);
  };

  // Onboard new company
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formInput.companyName || !formInput.companyEmail) {
      soundEngine.play("error");
      return;
    }

    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let key = "cs_live_";
    for (let i = 0; i < 15; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Update global organization profile
    setOrgData({
      companyName: formInput.companyName,
      companyId: `CS-COMP-${Math.floor(100 + Math.random() * 900)}`,
      websiteUrl: formInput.websiteUrl || `https://${formInput.companyName.toLowerCase().replace(/\s+/g, "")}.com`,
      industry: formInput.industry,
      contactPerson: formInput.contactPerson || "Lead Admin",
      companyEmail: formInput.companyEmail,
      employeeCount: formInput.employeeCount,
      country: formInput.country,
      apiKey: key,
      monitoringStatus: "Active",
      registrationDate: new Date().toLocaleDateString(),
      securityScore: Math.floor(84 + Math.random() * 15),
      isRegistered: true
    });

    setRegisterSuccess(true);
    soundEngine.play("success");
    setTimeout(() => {
      setRegisterSuccess(false);
      setActiveSub("dashboard"); // Route immediately to the onboarding dashboard
    }, 2200);
  };

  // Mock charts data for Enterprise Overview
  const orgTrendData = [
    { name: "Jan", Orgs: 78 },
    { name: "Feb", Orgs: 90 },
    { name: "Mar", Orgs: 104 },
    { name: "Apr", Orgs: 112 },
    { name: "May", Orgs: 120 },
    { name: "Jun", Orgs: 125 },
  ];

  const sectorThreatData = [
    { sector: "Fintech", Threats: 4200 },
    { sector: "Healthcare", Threats: 3100 },
    { sector: "Retail", Threats: 5600 },
    { sector: "Government", Threats: 2100 },
    { sector: "Logistics", Threats: 3420 },
  ];

  return (
    <div className="space-y-8 py-8">
      {/* Title */}
      <div>
        <span className="font-mono text-xs uppercase tracking-[0.25em] text-primary block mb-2">
          // SAAS MULTI-TENANT CONSOLE
        </span>
        <h1 className="font-display text-4xl font-black tracking-tight text-foreground uppercase">
          Enterprise Tenant Hub
        </h1>
        <p className="text-muted-foreground text-sm max-w-2xl mt-1.5">
          Manage corporate credentials, onboard organizational subnets, monitor key metrics, and inspect agent installation scripts.
        </p>
      </div>

      {/* Grid containing sidebar + active page content */}
      <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
        
        {/* Sidebar Panel */}
        <div className="glass-panel p-5 relative overflow-hidden h-fit space-y-4">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground font-bold block mb-2">
            // Tenant Operations
          </span>
          <div className="flex flex-col gap-1.5">
            <SidebarBtn active={activeSub === "overview"} onClick={() => setActiveSub("overview")} icon={<Layers className="h-4 w-4" />} label="Enterprise Overview" />
            <SidebarBtn active={activeSub === "register"} onClick={() => setActiveSub("register")} icon={<Building2 className="h-4 w-4" />} label="Company Onboarding" />
            <SidebarBtn active={activeSub === "dashboard"} onClick={() => setActiveSub("dashboard")} icon={<LayoutDashboard className="h-4 w-4" />} label="Company Dashboard" />
            <SidebarBtn active={activeSub === "keys"} onClick={() => setActiveSub("keys")} icon={<KeyRound className="h-4 w-4" />} label="API Key Management" />
            <SidebarBtn active={activeSub === "guide"} onClick={() => setActiveSub("guide")} icon={<FileCode className="h-4 w-4" />} label="Integration Guide" />
          </div>
        </div>

        {/* Content Pane */}
        <div className="min-h-[500px]">
          <AnimatePresence mode="wait">
            
            {/* Page 1: Enterprise Overview */}
            {activeSub === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                {/* SaaS cards */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  <OverviewCard label="Total Organizations" value="125" trend="+8 onboarded this month" icon={<Building2 className="text-primary" />} />
                  <OverviewCard label="Active Monitoring Nodes" value="98" trend="89% uptime efficiency" icon={<Server className="text-cyber-cyan" />} />
                  <OverviewCard label="Total Threats Blocked" value="18,420" trend="MTTR 4.2 mins average" icon={<AlertTriangle className="text-cyber-red" />} />
                  <OverviewCard label="Security Index Average" value="89%" trend="Target 90% benchmark" icon={<Shield className="text-cyber-amber" />} />
                </div>

                {/* Charts section */}
                <div className="grid gap-8 md:grid-cols-2">
                  {/* Onboarding trend */}
                  <div className="glass-panel p-6 relative overflow-hidden space-y-4">
                    <h3 className="font-display text-sm font-bold border-b border-border/30 pb-3 tracking-wider">
                      ORGANIZATIONAL ONBOARDING HISTORY
                    </h3>
                    <div className="h-[250px] w-full pt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={orgTrendData}>
                          <defs>
                            <linearGradient id="orgColor" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#00ff88" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="name" stroke="#888" fontSize={9} tickLine={false} />
                          <YAxis stroke="#888" fontSize={9} tickLine={false} />
                          <Tooltip contentStyle={{ background: "#08080c", border: "1px solid rgba(0,255,136,0.2)", fontFamily: "monospace", fontSize: "10px" }} />
                          <Area type="monotone" dataKey="Orgs" stroke="#00ff88" strokeWidth={1.5} fillOpacity={1} fill="url(#orgColor)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Threat categories */}
                  <div className="glass-panel p-6 relative overflow-hidden space-y-4">
                    <h3 className="font-display text-sm font-bold border-b border-border/30 pb-3 tracking-wider">
                      THREAT BLOCKS PER SECTOR
                    </h3>
                    <div className="h-[250px] w-full pt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={sectorThreatData}>
                          <XAxis dataKey="sector" stroke="#888" fontSize={9} tickLine={false} />
                          <YAxis stroke="#888" fontSize={9} tickLine={false} />
                          <Tooltip contentStyle={{ background: "#08080c", border: "1px solid rgba(0,217,255,0.2)", fontFamily: "monospace", fontSize: "10px" }} />
                          <Bar dataKey="Threats" fill="#00d9ff" radius={[2, 2, 0, 0]} maxBarSize={25} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Page 2: Company Registration */}
            {activeSub === "register" && (
              <motion.div
                key="register"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="glass-panel p-8 relative overflow-hidden max-w-2xl mx-auto"
              >
                <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                <h3 className="font-display text-lg font-bold border-b border-border/30 pb-3 tracking-wider mb-6 flex items-center gap-2">
                  <Building2 className="h-5.5 w-5.5 text-primary" /> NEW ORGANIZATION REGISTRATION
                </h3>

                <form onSubmit={handleRegisterSubmit} className="space-y-5 font-mono text-xs">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-muted-foreground uppercase tracking-wider block font-bold">Company Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Nexus Security"
                        value={formInput.companyName}
                        onChange={(e) => setFormInput(prev => ({ ...prev, companyName: e.target.value }))}
                        className="w-full bg-background border border-border px-3 py-2 rounded focus:outline-none focus:border-primary/70 text-primary placeholder:text-muted-foreground/30"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-muted-foreground uppercase tracking-wider block font-bold">Website URL</label>
                      <input
                        type="url"
                        placeholder="e.g. https://nexus.io"
                        value={formInput.websiteUrl}
                        onChange={(e) => setFormInput(prev => ({ ...prev, websiteUrl: e.target.value }))}
                        className="w-full bg-background border border-border px-3 py-2 rounded focus:outline-none focus:border-primary/70 text-primary placeholder:text-muted-foreground/30"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-muted-foreground uppercase tracking-wider block font-bold">Industry Sector</label>
                      <select
                        value={formInput.industry}
                        onChange={(e) => setFormInput(prev => ({ ...prev, industry: e.target.value }))}
                        className="w-full bg-background border border-border px-2 py-2 rounded focus:outline-none focus:border-primary/70 text-muted-foreground cursor-pointer"
                      >
                        <option>Financial Technology</option>
                        <option>Healthcare & Life Sciences</option>
                        <option>Cybersecurity & IT</option>
                        <option>Government & Defense</option>
                        <option>Retail & E-commerce</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-muted-foreground uppercase tracking-wider block font-bold">Contact Person</label>
                      <input
                        type="text"
                        placeholder="e.g. Sarah Connor"
                        value={formInput.contactPerson}
                        onChange={(e) => setFormInput(prev => ({ ...prev, contactPerson: e.target.value }))}
                        className="w-full bg-background border border-border px-3 py-2 rounded focus:outline-none focus:border-primary/70 text-primary placeholder:text-muted-foreground/30"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-muted-foreground uppercase tracking-wider block font-bold">Corporate Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. secops@nexus.io"
                      value={formInput.companyEmail}
                      onChange={(e) => setFormInput(prev => ({ ...prev, companyEmail: e.target.value }))}
                      className="w-full bg-background border border-border px-3 py-2 rounded focus:outline-none focus:border-primary/70 text-primary placeholder:text-muted-foreground/30"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-muted-foreground uppercase tracking-wider block font-bold">Employee Count</label>
                      <select
                        value={formInput.employeeCount}
                        onChange={(e) => setFormInput(prev => ({ ...prev, employeeCount: e.target.value }))}
                        className="w-full bg-background border border-border px-2 py-2 rounded focus:outline-none focus:border-primary/70 text-muted-foreground cursor-pointer"
                      >
                        <option>1-50 employees</option>
                        <option>50-100 employees</option>
                        <option>100-250 employees</option>
                        <option>250-500 employees</option>
                        <option>500+ employees</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-muted-foreground uppercase tracking-wider block font-bold">Geographic Location</label>
                      <select
                        value={formInput.country}
                        onChange={(e) => setFormInput(prev => ({ ...prev, country: e.target.value }))}
                        className="w-full bg-background border border-border px-2 py-2 rounded focus:outline-none focus:border-primary/70 text-muted-foreground cursor-pointer"
                      >
                        <option>United States</option>
                        <option>United Kingdom</option>
                        <option>Germany</option>
                        <option>Singapore</option>
                        <option>India</option>
                      </select>
                    </div>
                  </div>

                  <button type="submit" className="btn-cyber w-full mt-4 flex items-center justify-center gap-2">
                    Register Company <ArrowRight className="h-4 w-4" />
                  </button>
                </form>

                {/* Onboarding Success Banner */}
                <AnimatePresence>
                  {registerSuccess && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center text-center p-6"
                    >
                      <CheckCircle className="h-14 w-14 text-primary animate-bounce mb-3 shadow-[0_0_15px_rgba(0,255,136,0.3)]" />
                      <h4 className="font-display text-lg font-bold text-primary text-glow uppercase tracking-wider">
                        Organization Onboarding Confirmed
                      </h4>
                      <p className="text-muted-foreground font-mono text-[11px] mt-2 max-w-sm">
                        Company IDCS-COMP-001 created. Security telemetry active. Redirecting to operational dashboard...
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Page 3: Company Dashboard */}
            {activeSub === "dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                {/* Onboarding demo pending banner */}
                {!orgData.isRegistered && (
                  <div className="border border-cyber-amber/40 bg-cyber-amber/5 px-4 py-3 rounded-lg flex items-center gap-2.5 font-mono text-[10.5px] text-cyber-amber animate-pulse">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>DEMO NOTICE: Displaying placeholder profile. Register a custom tenant under Onboarding to populate state.</span>
                  </div>
                )}

                {/* Company Metadata Row */}
                <div className="glass-panel p-6 relative overflow-hidden flex flex-wrap justify-between items-center gap-6">
                  <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                  <div className="space-y-1.5">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">ACTIVE COMPLIANCE TENANT</span>
                    <h3 className="font-display text-2xl font-black text-primary text-glow uppercase">{orgData.companyName}</h3>
                    <p className="font-mono text-[10px] text-muted-foreground">ID: {orgData.companyId} · URL: <a href={orgData.websiteUrl} target="_blank" rel="noreferrer" className="text-cyber-cyan hover:underline">{orgData.websiteUrl}</a></p>
                  </div>
                  <div className="flex gap-8 font-mono text-right text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[9px] uppercase">Telemetry</span>
                      <span className="text-primary font-bold uppercase flex items-center gap-1.5 justify-end">
                        <span className="ticker-dot" /> {orgData.monitoringStatus}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[9px] uppercase">Registered Date</span>
                      <span className="text-foreground font-semibold">{orgData.registrationDate}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[9px] uppercase">Security Score</span>
                      <span className="text-primary font-bold text-glow">{orgData.securityScore} / 100</span>
                    </div>
                  </div>
                </div>

                {/* Subnet telemetry statistics */}
                <div className="grid gap-6 md:grid-cols-4 font-mono">
                  <div className="glass-panel p-5 relative overflow-hidden flex flex-col justify-between min-h-[120px]">
                    <div>
                      <span className="text-[10px] uppercase text-muted-foreground block">Active Threats Queue</span>
                      <span className="text-3xl font-display font-bold text-primary mt-2 block">0</span>
                    </div>
                    <span className="text-[9px] text-muted-foreground uppercase">Threat score optimal</span>
                  </div>

                  <div className="glass-panel p-5 relative overflow-hidden flex flex-col justify-between min-h-[120px]">
                    <div>
                      <span className="text-[10px] uppercase text-muted-foreground block">Total System Log Events</span>
                      <span className="text-3xl font-display font-bold text-cyber-cyan mt-2 block">142,500</span>
                    </div>
                    <span className="text-[9px] text-muted-foreground uppercase">98.5% packet efficiency</span>
                  </div>

                  <div className="glass-panel p-5 relative overflow-hidden flex flex-col justify-between min-h-[120px]">
                    <div>
                      <span className="text-[10px] uppercase text-muted-foreground block">Calculated Risk Index</span>
                      <span className="text-3xl font-display font-bold text-primary mt-2 block uppercase">LOW</span>
                    </div>
                    <span className="text-[9px] text-muted-foreground uppercase">Compliance criteria met</span>
                  </div>

                  <div className="glass-panel p-5 relative overflow-hidden flex flex-col justify-between min-h-[120px]">
                    <div>
                      <span className="text-[10px] uppercase text-muted-foreground block">MFA Compliance Rate</span>
                      <span className="text-3xl font-display font-bold text-cyber-amber mt-2 block">100%</span>
                    </div>
                    <span className="text-[9px] text-muted-foreground uppercase">Enforced on edge switches</span>
                  </div>
                </div>

                {/* AI Recommendations panel */}
                <div className="glass-panel p-6 relative overflow-hidden space-y-4">
                  <h3 className="font-display text-sm font-bold border-b border-border/30 pb-3 tracking-wider flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" /> COGNITIVE COMPLIANCE RECOMMENDATIONS
                  </h3>
                  <div className="space-y-3 font-mono text-xs text-muted-foreground">
                    <div className="flex gap-3 border-b border-border/20 pb-2.5">
                      <span className="text-primary font-bold">01.</span>
                      <p className="text-foreground/90">Multi-Factor Authentication (MFA) confirmed active across administrative switches. Verify peripheral endpoints regularly.</p>
                    </div>
                    <div className="flex gap-3 border-b border-border/20 pb-2.5">
                      <span className="text-primary font-bold">02.</span>
                      <p className="text-foreground/90">Force rotate default SSH credentials on edge switch templates. Firewall block rules updated automatically.</p>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-primary font-bold">03.</span>
                      <p className="text-foreground/90">Immutable cloud data storage backups active. Compliance audit protocols ISO 27001 verified.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Page 4: API Key Management */}
            {activeSub === "keys" && (
              <motion.div
                key="keys"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="glass-panel p-8 relative overflow-hidden max-w-2xl mx-auto space-y-6"
              >
                <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                
                <div>
                  <h3 className="font-display text-lg font-bold border-b border-border/30 pb-3 tracking-wider flex items-center gap-2">
                    <KeyRound className="h-5.5 w-5.5 text-primary" /> API KEY PROVISIONING
                  </h3>
                  <p className="text-muted-foreground font-mono text-[11px] mt-2">
                    Provision credential interfaces for third-party endpoints. Protect keys diligently to ensure intranet gateway security.
                  </p>
                </div>

                <div className="space-y-4 font-mono text-xs">
                  <div>
                    <span className="text-muted-foreground uppercase tracking-widest block font-bold text-[9px] mb-2">PRIMARY ACTIVE CLIENT KEY</span>
                    <div className="flex items-center gap-3 bg-background border border-border p-4.5 rounded-lg">
                      <span className="text-sm font-semibold text-primary tracking-wider flex-1 overflow-x-auto select-all">
                        {orgData.apiKey}
                      </span>
                      <button
                        onClick={handleCopyKey}
                        className="btn-cyber !p-2 shrink-0 flex items-center justify-center gap-1 border-primary/50 text-primary"
                        title="Copy Key"
                      >
                        <Copy className="h-4 w-4" />
                        <span className="text-[10px] hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-4">
                    <button
                      onClick={handleGenerateKey}
                      className="btn-cyber flex items-center justify-center gap-2"
                    >
                      <Plus className="h-4 w-4" /> Generate New Key
                    </button>
                    <button
                      onClick={() => setActiveSub("guide")}
                      className="btn-cyber border-cyber-cyan text-cyber-cyan hover:bg-cyber-cyan/10 flex items-center justify-center gap-2"
                    >
                      <FileCode className="h-4 w-4" /> Integration Guide
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Page 5: Integration Guide */}
            {activeSub === "guide" && (
              <motion.div
                key="guide"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                <div className="glass-panel p-8 relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                  
                  <h3 className="font-display text-lg font-bold border-b border-border/30 pb-3 tracking-wider flex items-center gap-2 mb-6">
                    <FileCode className="h-5.5 w-5.5 text-primary" /> AGENT INSTALLATION SCRIPTS
                  </h3>

                  <div className="space-y-8 font-mono text-xs leading-relaxed">
                    {/* Step 1 */}
                    <div className="space-y-2">
                      <h4 className="font-display text-sm font-semibold text-primary uppercase">// Step 1: Register Organization</h4>
                      <p className="text-muted-foreground">Onboard your company using the Tenant Portal. An onboarding company ID and primary credentials token will be created automatically.</p>
                    </div>

                    {/* Step 2 */}
                    <div className="space-y-2">
                      <h4 className="font-display text-sm font-semibold text-primary uppercase">// Step 2: Generate API Key</h4>
                      <p className="text-muted-foreground">Open Key Management to query or generate credentials for client subnets. Save this in your `.env` configuration file.</p>
                      <pre className="bg-black/60 border border-border p-4 rounded-lg text-primary overflow-x-auto text-[11px]">
{`CYBERSENTINEL_API_KEY=${orgData.apiKey}
CYBERSENTINEL_ENDPOINT=https://api.cybersentinel.ai`}
                      </pre>
                    </div>

                    {/* Step 3 */}
                    <div className="space-y-2">
                      <h4 className="font-display text-sm font-semibold text-primary uppercase">// Step 3: Install CyberSentinel Agent</h4>
                      <p className="text-muted-foreground">Run the secure container agent daemon. The agent binds listener interfaces on default interfaces and forwards telemetry protocols.</p>
                      
                      {/* Docker */}
                      <div className="space-y-1.5 mt-4">
                        <span className="text-[10px] text-muted-foreground block font-bold uppercase tracking-wider">Docker Daemon Deployment:</span>
                        <pre className="bg-black/60 border border-border p-4 rounded-lg text-cyber-cyan overflow-x-auto text-[11px]">
{`docker run -d \\
  --name cybersentinel-agent \\
  -e API_KEY="${orgData.apiKey}" \\
  -e ENDPOINT="https://api.cybersentinel.ai" \\
  -p 4000:4000 \\
  cybersentinel/agent:latest`}
                        </pre>
                      </div>

                      {/* Node.js SDK */}
                      <div className="space-y-1.5 mt-4">
                        <span className="text-[10px] text-muted-foreground block font-bold uppercase tracking-wider">Node.js SDK Bootstrap:</span>
                        <pre className="bg-black/60 border border-border p-4 rounded-lg text-cyber-amber overflow-x-auto text-[11px]">
{`const { CyberSentinelAgent } = require('cybersentinel-sdk');

const agent = new CyberSentinelAgent({
  apiKey: process.env.CYBERSENTINEL_API_KEY,
  endpoint: 'https://api.cybersentinel.ai'
});

agent.start().then(() => {
  console.log('// CyberSentinel XDR: Listening for telemetry packets...');
});`}
                        </pre>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className="space-y-2">
                      <h4 className="font-display text-sm font-semibold text-primary uppercase">// Step 4: Start Monitoring</h4>
                      <p className="text-muted-foreground">Check the Command Center view. Onboarded agents establish websocket handshakes, forwarding intrusion alerts, ARP traces, and database telemetry immediately.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}

// Sidebar Button Helper Component
function SidebarBtn({
  active,
  onClick,
  icon,
  label
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-mono uppercase tracking-wider rounded transition cursor-pointer border-none text-left ${
        active
          ? "bg-primary/20 text-primary border-l-2 border-primary"
          : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// SaaS Overview Card Helper Component
function OverviewCard({
  label,
  value,
  trend,
  icon
}: {
  label: string;
  value: string;
  trend: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="glass-panel p-6 relative overflow-hidden flex flex-col justify-between min-h-[140px]">
      <div className="flex items-center justify-between border-b border-border/20 pb-3 mb-2">
        <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground font-bold">
          {label}
        </span>
        <div className="h-7 w-7 rounded-full bg-muted/10 border border-border/40 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div>
        <span className="text-3xl font-display font-bold text-foreground tracking-wide block">
          {value}
        </span>
        <span className="font-mono text-[9.5px] text-muted-foreground mt-2 block">
          {trend}
        </span>
      </div>
    </div>
  );
}
