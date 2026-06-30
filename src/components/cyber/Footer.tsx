import { Shield } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative border-t border-border bg-background/60">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-mono text-sm font-bold tracking-widest text-primary text-glow">
              CYBERSENTINEL XDR
            </span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Autonomous defense for the post-perimeter era. Built by operators who lived in the SOC.
          </p>
          <div className="mt-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-primary">
            <span className="ticker-dot" /> Global ops · all regions nominal
          </div>
        </div>
        {[
          {
            t: "Platform",
            l: [
              ["XDR Core", "#intel"],
              ["Attack Simulator", "#simulation"],
              ["Threat Intel", "#intel"],
              ["Response Engine", "#response"],
            ],
          },
          {
            t: "Solutions",
            l: [
              ["Enterprise", "#about"],
              ["Critical Infra", "#topology"],
              ["Government", "#reports"],
              ["MSSP", "#analytics"],
            ],
          },
          {
            t: "Company",
            l: [
              ["Threat Lab", "#analytics"],
              ["Research", "#intel"],
              ["Careers", "#about"],
              ["Press", "#about"],
            ],
          },
        ].map((c) => (
          <div key={c.t}>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {c.t}
            </div>
            <ul className="mt-3 space-y-2 text-sm">
              {c.l.map(([i, href]) => (
                <li key={i}>
                  <a href={href} className="text-foreground/80 transition hover:text-primary">
                    {i}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          <div>© 2026 CyberSentinel Systems · Classified · Tier 4</div>
          <div className="flex items-center gap-4">
            <span>Build 4.281.7-rc2</span>
            <span>uptime 99.997%</span>
            <span className="flex items-center gap-1.5 text-primary">
              <span className="ticker-dot" /> SOC live
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
