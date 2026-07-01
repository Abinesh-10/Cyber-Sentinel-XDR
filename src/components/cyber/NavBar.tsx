import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  BrainCircuit,
  Building2,
  FileBarChart,
  Home,
  Menu,
  Network,
  Radar,
  ShieldAlert,
  ShieldCheck,
  Swords,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useSOC, TabType } from "./SOCContext";

type NavLink = {
  tab: TabType;
  label: string;
  icon: typeof Home;
  hint: string;
};

const links: NavLink[] = [
  { tab: "home", label: "Home", icon: Home, hint: "Overview & posture" },
  { tab: "command-center", label: "Command Center", icon: Radar, hint: "Live operations" },
  { tab: "threat-intel", label: "Threat Intel", icon: ShieldAlert, hint: "Indicators & feeds" },
  { tab: "network-topology", label: "Topology", icon: Network, hint: "Network map" },
  { tab: "attack-simulator", label: "Simulation", icon: Swords, hint: "Run attack scenarios" },
  { tab: "incident-response", label: "Response", icon: ShieldCheck, hint: "Triage & mitigate" },
  { tab: "reports-analytics", label: "Analytics", icon: FileBarChart, hint: "Reports & metrics" },
  { tab: "ai-analyst", label: "AI Analyst", icon: BrainCircuit, hint: "Ask the CISO agent" },
  { tab: "enterprise", label: "Enterprise", icon: Building2, hint: "Org & governance" },
];

export function NavBar() {
  const { activeTab, setActiveTab, incidents, activeAttack } = useSOC();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const openIncidents = incidents.filter((i) => i.status !== "MITIGATED").length;
  const underAttack = Boolean(activeAttack) || openIncidents > 0;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll while the mobile drawer is open
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const go = (tab: TabType) => {
    setActiveTab(tab);
    setDrawerOpen(false);
  };

  const activeLink = links.find((l) => l.tab === activeTab) ?? links[0];

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-x-0 top-0 z-50 no-print"
    >
      <div
        className={`border-b transition-colors duration-300 ${
          scrolled
            ? "border-border bg-background/85 backdrop-blur-xl"
            : "border-transparent bg-background/40 backdrop-blur-md"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-3 px-4 lg:px-6">
          {/* Brand */}
          <button
            onClick={() => go("home")}
            className="group flex shrink-0 items-center gap-2.5 rounded-md py-1 pr-2 text-left"
            aria-label="CyberSentinel home"
          >
            <span
              className={`grid h-9 w-9 place-items-center rounded-lg border ${
                underAttack
                  ? "border-cyber-red/50 bg-cyber-red/10"
                  : "border-border-strong bg-primary/10"
              }`}
            >
              <ShieldCheck
                className={`h-5 w-5 ${underAttack ? "text-cyber-red" : "text-primary"}`}
              />
            </span>
            <span className="leading-tight">
              <span className="block font-display text-sm font-bold tracking-[0.18em] text-foreground">
                CYBER<span className="text-primary">SENTINEL</span>
              </span>
              <span className="block font-mono text-[9px] uppercase tracking-[0.32em] text-muted-foreground">
                XDR · SOC Platform
              </span>
            </span>
          </button>

          {/* Desktop nav */}
          <nav className="ml-2 hidden flex-1 items-center gap-0.5 xl:flex">
            {links.map((l) => {
              const Icon = l.icon;
              const active = activeTab === l.tab;
              return (
                <button
                  key={l.tab}
                  onClick={() => go(l.tab)}
                  data-active={active}
                  title={l.hint}
                  aria-current={active ? "page" : undefined}
                  className="nav-link"
                >
                  <Icon className="h-4 w-4" />
                  {l.label}
                </button>
              );
            })}
          </nav>

          {/* Condensed nav for medium screens (icons only, scrollable) */}
          <nav className="ml-2 hidden flex-1 items-center gap-0.5 overflow-x-auto md:flex xl:hidden">
            {links.map((l) => {
              const Icon = l.icon;
              const active = activeTab === l.tab;
              return (
                <button
                  key={l.tab}
                  onClick={() => go(l.tab)}
                  data-active={active}
                  title={l.label}
                  aria-label={l.label}
                  aria-current={active ? "page" : undefined}
                  className="nav-link !px-2.5"
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
          </nav>

          {/* Status + mobile trigger */}
          <div className="ml-auto flex items-center gap-3">
            <div
              className={`hidden items-center gap-2 rounded-full border px-3 py-1.5 sm:flex ${
                underAttack
                  ? "border-cyber-red/40 bg-cyber-red/10"
                  : "border-border bg-card/60"
              }`}
            >
              <span
                className="ticker-dot"
                style={underAttack ? { background: "var(--cyber-red)" } : undefined}
              />
              <span
                className={`font-mono text-[10px] font-semibold uppercase tracking-widest ${
                  underAttack ? "text-cyber-red" : "text-primary"
                }`}
              >
                {underAttack ? `${openIncidents || 1} Active` : "Operational"}
              </span>
            </div>

            <button
              onClick={() => setDrawerOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-md border border-border bg-card/60 text-foreground md:hidden"
              aria-label="Open navigation menu"
              aria-expanded={drawerOpen}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile / tablet drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm md:hidden"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="fixed right-0 top-0 z-50 flex h-full w-[84%] max-w-[340px] flex-col border-l border-border bg-card/95 backdrop-blur-xl md:hidden"
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
                    Navigate
                  </span>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="grid h-9 w-9 place-items-center rounded-md border border-border text-foreground"
                  aria-label="Close navigation menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3">
                {links.map((l) => {
                  const Icon = l.icon;
                  const active = activeTab === l.tab;
                  return (
                    <button
                      key={l.tab}
                      onClick={() => go(l.tab)}
                      data-active={active}
                      aria-current={active ? "page" : undefined}
                      className={`mb-1 flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition ${
                        active
                          ? "border-border-strong bg-primary/10"
                          : "border-transparent hover:bg-primary/5"
                      }`}
                    >
                      <span
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-md border ${
                          active
                            ? "border-primary/40 bg-primary/15 text-primary"
                            : "border-border bg-background/40 text-muted-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span
                          className={`block text-sm font-semibold ${
                            active ? "text-primary" : "text-foreground"
                          }`}
                        >
                          {l.label}
                        </span>
                        <span className="block truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                          {l.hint}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-border px-4 py-3">
                <div className="flex items-center gap-2">
                  <span
                    className="ticker-dot"
                    style={underAttack ? { background: "var(--cyber-red)" } : undefined}
                  />
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {underAttack
                      ? `${openIncidents || 1} active incident${openIncidents === 1 ? "" : "s"}`
                      : "All systems operational"}
                  </span>
                </div>
                <p className="mt-1 font-mono text-[10px] text-muted-foreground/70">
                  Viewing: <span className="text-foreground/80">{activeLink.label}</span>
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
