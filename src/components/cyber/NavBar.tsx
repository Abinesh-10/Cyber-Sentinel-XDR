import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import { useSOC, TabType } from "./SOCContext";

export function NavBar() {
  const { activeTab, setActiveTab } = useSOC();

  const links: { tab: TabType; label: string }[] = [
    { tab: "home", label: "Home" },
    { tab: "command-center", label: "Command Center" },
    { tab: "threat-intel", label: "Threat Intel" },
    { tab: "network-topology", label: "Topology" },
    { tab: "attack-simulator", label: "Simulation" },
    { tab: "incident-response", label: "Response" },
    { tab: "reports-analytics", label: "Analytics" },
    { tab: "ai-analyst", label: "AI Analyst" },
    { tab: "enterprise", label: "Enterprise" },
  ];

  return (
    <motion.header
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 no-print"
    >
      <div className="mx-auto mt-4 flex max-w-[95%] items-center justify-between px-2">
        <div className="glass-panel flex items-center gap-2.5 px-3 py-2">
          <div className="relative">
            <Shield className="h-4.5 w-4.5 text-primary" />
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
          </div>
          <button 
            onClick={() => setActiveTab("home")}
            className="font-display text-xs font-bold tracking-widest text-primary text-glow cursor-pointer hover:opacity-85 transition bg-transparent border-none"
          >
            CYBERSENTINEL <span className="text-foreground/75 font-mono text-[10px]">XDR</span>
          </button>
          <div className="ml-1 h-3 w-px bg-border" />
          <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground hidden sm:inline">
            v5.0 · ACTIVE
          </span>
        </div>
        <nav className="glass-panel hidden items-center gap-0.5 px-1.5 py-1.5 lg:flex">
          {links.map((l) => (
            <button
              key={l.tab}
              onClick={() => setActiveTab(l.tab)}
              className={`rounded px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition cursor-pointer ${
                activeTab === l.tab
                  ? "bg-primary/20 text-primary border-b border-primary/60 font-bold"
                  : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
              }`}
            >
              {l.label}
            </button>
          ))}
        </nav>
        <div className="glass-panel hidden items-center gap-2 px-3 py-2.5 md:flex">
          <span className="ticker-dot" />
          <span className="font-mono text-xs uppercase tracking-widest text-primary">
            AI SOC PLATFORM
          </span>
        </div>
      </div>
    </motion.header>
  );
}
