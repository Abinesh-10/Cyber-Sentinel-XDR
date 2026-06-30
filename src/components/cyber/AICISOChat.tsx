import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Bot, Shield, X, HelpCircle, AlertTriangle, ShieldCheck, Activity } from "lucide-react";
import { useSOC } from "./SOCContext";

interface AICISOChatProps {
  inline?: boolean;
}

export function AICISOChat({ inline = false }: AICISOChatProps) {
  const { chatHistory, askCISO, activeAttack, incidents } = useSOC();
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, isOpen, inline]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    askCISO(input.trim());
    setInput("");
  };

  const quickQueries = [
    "How secure is the organization?",
    "What should be fixed first?",
    "Which threat is most dangerous?",
    "What security improvements are recommended?",
  ];

  // Typewriter streaming effect for new replies
  function TypewrittenMessage({ text }: { text: string }) {
    const [displayed, setDisplayed] = useState("");

    useEffect(() => {
      let idx = 0;
      setDisplayed("");
      const timer = setInterval(() => {
        setDisplayed((prev) => prev + text.charAt(idx));
        idx++;
        if (idx >= text.length) {
          clearInterval(timer);
        }
      }, 10);
      return () => clearInterval(timer);
    }, [text]);

    return <span>{displayed}</span>;
  }

  const isCisoThinking = chatHistory.length > 0 && chatHistory[chatHistory.length - 1].sender === "user";

  // If inline = true, render full-screen premium cockpit
  if (inline) {
    const activeAlerts = incidents.filter(i => i.status !== "MITIGATED");
    return (
      <div className="space-y-8 py-8">
        {/* Title Block */}
        <div>
          <span className="font-mono text-xs uppercase tracking-[0.25em] text-primary block mb-2">
            // COGNITIVE ASSISTANT & RISK DIAGNOSTICS
          </span>
          <h1 className="font-display text-4xl font-black tracking-tight text-foreground uppercase">
            AI SOC Security Analyst
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl mt-1.5">
            Interact with the virtual CISO assistant, inspect live root-cause investigations, and audit automated remediation recommendations.
          </p>
        </div>

        {/* 2-Column Spacious Grid Layout */}
        <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          
          {/* Left Column: Interactive Chat Console */}
          <div className="glass-panel corner-frame h-[600px] flex flex-col justify-between overflow-hidden relative bg-black/90">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            
            {/* Console Header */}
            <div className="flex items-center gap-3 border-b border-border/40 bg-primary/10 px-5 py-4 shrink-0">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-full border border-primary/45 bg-primary/20 text-primary">
                <Bot className="h-5 w-5" />
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
              </div>
              <div>
                <h4 className="font-display text-sm font-bold text-primary tracking-wide">
                  COGNITIVE SECURITY CONTROLLER
                </h4>
                <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest">
                  Secure Agent Instance · Active Monitoring
                </p>
              </div>
            </div>

            {/* Message Area */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent bg-black/30"
            >
              {chatHistory.map((msg, index) => {
                const isLatest = index === chatHistory.length - 1;
                return (
                  <div
                    key={index}
                    className={`flex gap-3 max-w-[80%] ${
                      msg.sender === "user" ? "ml-auto flex-row-reverse" : ""
                    }`}
                  >
                    {msg.sender === "ciso" && (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/20 text-primary text-[10px]">
                        <Shield className="h-3.5 w-3.5" />
                      </div>
                    )}
                    <div>
                      <div
                        className={`rounded-lg px-4 py-3 text-xs leading-relaxed font-mono ${
                          msg.sender === "user"
                            ? "bg-primary/25 border border-primary/45 text-primary shadow-[0_0_12px_rgba(0,255,136,0.1)]"
                            : "bg-muted/15 border border-border/60 text-foreground"
                        }`}
                      >
                        {msg.sender === "ciso" && isLatest ? (
                          <TypewrittenMessage text={msg.text} />
                        ) : (
                          msg.text
                        )}
                      </div>
                      <span className="mt-1 block font-mono text-[8px] text-muted-foreground text-right px-1">
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Pulsing thinking indicator */}
              {isCisoThinking && (
                <div className="flex gap-3 max-w-[80%]">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/20 text-primary text-[10px]">
                    <Shield className="h-3.5 w-3.5" />
                  </div>
                  <div className="rounded-lg px-4 py-3 text-xs bg-muted/15 border border-border/60 text-muted-foreground flex items-center gap-1.5 font-mono">
                    <span className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-2 w-2 bg-primary rounded-full animate-bounce" />
                    <span className="text-[10px] uppercase tracking-wider ml-1.5">Analyzing network logs...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Queries list */}
            <div className="px-5 py-3 border-t border-border/30 bg-black/40 shrink-0">
              <div className="flex items-center gap-1.5 font-mono text-[9px] text-muted-foreground uppercase tracking-widest mb-2 font-bold">
                <HelpCircle className="h-3.5 w-3.5 text-primary" /> Suggested Analyst Queries
              </div>
              <div className="flex flex-wrap gap-2">
                {quickQueries.map((q) => (
                  <button
                    key={q}
                    onClick={() => askCISO(q)}
                    className="rounded bg-muted/20 border border-border/50 px-3 py-1 font-mono text-[9.5px] text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition text-left cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Form */}
            <form
              onSubmit={handleSend}
              className="border-t border-border/40 p-4 flex gap-3 bg-black/80 shrink-0"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Query AI SOC Analyst about system status..."
                className="flex-1 bg-background border border-border px-4 py-3 rounded font-mono text-xs text-primary focus:outline-none focus:border-primary/65 placeholder:text-muted-foreground/45 placeholder:font-mono"
              />
              <button
                type="submit"
                className="btn-cyber flex items-center justify-center"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* Right Column: AI Insights & Posture Diagnosis */}
          <div className="space-y-6">
            
            {/* Root Cause Analysis Panel */}
            <div className="glass-panel p-6 relative overflow-hidden space-y-4">
              <h3 className="font-display text-sm font-bold border-b border-border/30 pb-3 tracking-wider flex items-center gap-2">
                <AlertTriangle className="h-4.5 w-4.5 text-cyber-amber animate-pulse" /> ROOT CAUSE ANALYSIS
              </h3>
              {activeAttack ? (
                <div className="font-mono text-xs space-y-3.5">
                  <div className="flex items-center justify-between border-b border-border/20 pb-2">
                    <span className="text-muted-foreground">ACTIVE THREAT</span>
                    <span className="text-cyber-red font-bold text-glow">{activeAttack.title}</span>
                  </div>
                  <div className="border border-border/30 bg-black/30 p-3 rounded-lg leading-relaxed text-foreground/90">
                    <span className="font-bold text-primary block mb-1">// ANOMALOUS ROOT VECTOR</span>
                    {activeAttack.analystInfo.rootCause ?? "Configuration drift or vulnerable listener on edge networks."}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Target node identifier: <span className="text-foreground font-semibold">{activeAttack.targetNodeId}</span>
                  </div>
                </div>
              ) : (
                <div className="font-mono text-xs text-muted-foreground/75 leading-relaxed py-4 text-center">
                  <ShieldCheck className="h-9 w-9 text-primary/30 mx-auto mb-2" />
                  No active threat intrusion triggers active. Intranet nodes routing packets securely.
                </div>
              )}
            </div>

            {/* Risk Assessment Panel */}
            <div className="glass-panel p-6 relative overflow-hidden space-y-4">
              <h3 className="font-display text-sm font-bold border-b border-border/30 pb-3 tracking-wider flex items-center gap-2">
                <Activity className="h-4.5 w-4.5 text-cyber-cyan" /> COGNITIVE RISK ASSESSMENT
              </h3>
              <div className="font-mono text-xs space-y-4">
                <div>
                  <div className="flex justify-between text-[10px] text-muted-foreground uppercase mb-1">
                    <span>Edge Firewall Vulnerability</span>
                    <span className="text-primary">Low risk</span>
                  </div>
                  <div className="h-2 w-full bg-border/25 rounded overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: "20%" }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-muted-foreground uppercase mb-1">
                    <span>Administrative Access Gateways</span>
                    <span className="text-cyber-amber">Elevated risk</span>
                  </div>
                  <div className="h-2 w-full bg-border/25 rounded overflow-hidden">
                    <div className="h-full bg-cyber-amber" style={{ width: "55%" }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-muted-foreground uppercase mb-1">
                    <span>Database Vault Isolation</span>
                    <span className="text-primary">Optimized</span>
                  </div>
                  <div className="h-2 w-full bg-border/25 rounded overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: "12%" }} />
                  </div>
                </div>
              </div>
            </div>

            {/* AI Security Recommendations */}
            <div className="glass-panel p-6 relative overflow-hidden space-y-4">
              <h3 className="font-display text-sm font-bold border-b border-border/30 pb-3 tracking-wider flex items-center gap-2">
                <Shield className="h-4.5 w-4.5 text-primary text-glow" /> SYSTEM SECURITY REMEDIES
              </h3>
              <div className="font-mono text-[11px] leading-relaxed text-muted-foreground space-y-3">
                {activeAttack ? (
                  activeAttack.analystInfo.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-2.5 border-b border-border/20 pb-2">
                      <span className="text-primary font-bold">{`0${i+1}.`}</span>
                      <span className="text-foreground/90">{rec}</span>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex items-start gap-2.5 border-b border-border/20 pb-2">
                      <span className="text-primary font-bold">01.</span>
                      <span className="text-foreground/90">Audit port scanning attempts originating through anonymized subnet proxies regularly.</span>
                    </div>
                    <div className="flex items-start gap-2.5 border-b border-border/20 pb-2">
                      <span className="text-primary font-bold">02.</span>
                      <span className="text-foreground/90">Verify administrative credential structures globally; enforce SSH key authentication.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="text-primary font-bold">03.</span>
                      <span className="text-foreground/90">Deploy dynamic ingress scrubbers for packet flood containment.</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Floating Chat widget mode (retained on other pages)
  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-background border border-primary shadow-[0_0_20px_rgba(0,255,136,0.65)] hover:scale-105 transition-all duration-300 cursor-pointer"
          aria-label="Open AI CISO Assistant"
        >
          <Bot className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white animate-pulse">
            AI
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 glass-panel border border-primary/30 bg-black/95 shadow-[0_0_35px_rgba(0,255,136,0.25)] flex flex-col h-[500px] overflow-hidden rounded-xl animate-in fade-in slide-in-from-bottom-8 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/60 bg-primary/10 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-full border border-primary/40 bg-primary/20 text-primary">
                <Bot className="h-4 w-4" />
                <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-primary animate-pulse" />
              </div>
              <div>
                <h4 className="font-display text-sm font-bold text-primary tracking-wide">
                  AI CISO ASSISTANT
                </h4>
                <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest">
                  Secure Agent · Online
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded p-1 text-muted-foreground hover:bg-white/10 hover:text-white transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent"
          >
            {chatHistory.map((msg, index) => {
              const isLatest = index === chatHistory.length - 1;
              return (
                <div
                  key={index}
                  className={`flex gap-2 max-w-[85%] ${
                    msg.sender === "user" ? "ml-auto flex-row-reverse" : ""
                  }`}
                >
                  {msg.sender === "ciso" && (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/20 text-primary text-[10px]">
                      <Shield className="h-3 w-3" />
                    </div>
                  )}
                  <div>
                    <div
                      className={`rounded-lg px-3 py-2 text-xs leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-primary/25 border border-primary/40 text-primary"
                          : "bg-muted/10 border border-border/80 text-foreground"
                      }`}
                    >
                      {msg.sender === "ciso" && isLatest ? (
                        <TypewrittenMessage text={msg.text} />
                      ) : (
                        msg.text
                      )}
                    </div>
                    <span className="mt-1 block font-mono text-[8px] text-muted-foreground text-right px-1">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Pulsing thinking indicator */}
            {isCisoThinking && (
              <div className="flex gap-2 max-w-[85%]">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/20 text-primary text-[10px]">
                  <Shield className="h-3 w-3" />
                </div>
                <div className="rounded-lg px-3 py-2 text-xs bg-muted/10 border border-border/80 text-muted-foreground flex items-center gap-1 font-mono">
                  <span className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce" />
                  <span className="text-[9px] uppercase tracking-wider ml-1">Analyzing incident scope...</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Queries */}
          <div className="px-4 py-2 border-t border-border/40 bg-black/40">
            <div className="flex items-center gap-1 font-mono text-[8px] text-muted-foreground uppercase tracking-widest mb-1.5">
              <HelpCircle className="h-3 w-3" /> Quick queries
            </div>
            <div className="flex flex-wrap gap-1">
              {quickQueries.map((q) => (
                <button
                  key={q}
                  onClick={() => askCISO(q)}
                  className="rounded bg-muted/20 border border-border/60 px-2 py-0.5 font-mono text-[9px] text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition text-left cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Input Form */}
          <form
            onSubmit={handleSend}
            className="border-t border-border/60 p-3 flex gap-2 bg-black/80"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Query corporate threat posture..."
              className="flex-1 bg-background border border-border px-3 py-2 rounded font-mono text-xs text-primary focus:outline-none focus:border-primary/60 placeholder:text-muted-foreground/50 placeholder:font-mono"
            />
            <button
              type="submit"
              className="btn-cyber !p-2 flex items-center justify-center"
              aria-label="Send message"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
