import { motion } from "framer-motion";
import { Brain, Eye, Lock, Network, Sparkles, Zap } from "lucide-react";
import { SectionHeader } from "./SectionHeader";

const items = [
  {
    icon: Brain,
    title: "Autonomous AI Core",
    text: "Neural threat-modeling pipeline retrains every 9 minutes against fresh telemetry.",
  },
  {
    icon: Eye,
    title: "Total Visibility",
    text: "Single pane across endpoint, cloud, identity, OT and network with 0-trust enforcement.",
  },
  {
    icon: Zap,
    title: "Sub-second Response",
    text: "Edge-deployed agents act in 240ms — quarantine, isolate, rotate creds, rollback.",
  },
  {
    icon: Network,
    title: "Adversary Graph",
    text: "Maps every relationship between assets, identities, and TTPs across MITRE ATT&CK.",
  },
  {
    icon: Lock,
    title: "Quantum-Ready Crypto",
    text: "CRYSTALS-Kyber + Dilithium hybrid suites embedded throughout the control plane.",
  },
  {
    icon: Sparkles,
    title: "Red-Team Simulator",
    text: "Generative attack engine produces novel exploit chains to stress your defenses.",
  },
];

export function About() {
  return (
    <section id="about" className="relative mx-auto max-w-7xl px-4 py-28">
      <SectionHeader
        index="// 01"
        eyebrow="About CyberSentinel"
        title="A defense fabric built for machine-speed warfare"
        description="A unified XDR core fusing AI, deception, and autonomous response into one weapons-grade platform."
      />
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {items.map((it, i) => (
          <motion.div
            key={it.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: i * 0.07 }}
            className="glass-panel glass-panel-hover corner-frame group relative overflow-hidden p-6"
          >
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl transition group-hover:bg-primary/20" />
            <it.icon className="h-7 w-7 text-primary" />
            <h3 className="mt-4 font-display text-lg font-bold text-foreground">{it.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{it.text}</p>
            <div className="mt-5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-primary/80">
              <span className="ticker-dot" /> Module · operational
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
