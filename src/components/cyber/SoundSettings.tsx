import React, { useState, useEffect } from "react";
import { Volume2, VolumeX, Settings, X, Activity, Play } from "lucide-react";
import { soundEngine } from "../../lib/sound";

export function SoundSettings() {
  const [isOpen, setIsOpen] = useState(false);
  const [enabled, setEnabled] = useState(soundEngine.isEnabled());
  const [volume, setVolume] = useState(soundEngine.getVolume());

  // Listen to modal openings/closings globally via MutationObserver in the background
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of Array.from(m.addedNodes)) {
          if (node instanceof HTMLElement) {
            // Match backdrop overlays or modal containers
            const isModal =
              node.classList.contains("fixed") &&
              (node.classList.contains("backdrop-blur-md") ||
                node.classList.contains("backdrop-blur-sm") ||
                node.classList.contains("glass-panel") ||
                node.querySelector(".glass-panel"));
            if (isModal) {
              soundEngine.play("whoosh");
            }
          }
        }
        for (const node of Array.from(m.removedNodes)) {
          if (node instanceof HTMLElement) {
            const isModal =
              node.classList.contains("fixed") &&
              (node.classList.contains("backdrop-blur-md") ||
                node.classList.contains("backdrop-blur-sm") ||
                node.classList.contains("glass-panel") ||
                node.querySelector(".glass-panel"));
            if (isModal) {
              soundEngine.play("reverse-whoosh");
            }
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  const handleToggle = () => {
    const nextVal = !enabled;
    setEnabled(nextVal);
    soundEngine.setEnabled(nextVal);
    // Play test tick on state change
    if (nextVal) {
      setTimeout(() => soundEngine.play("tick"), 50);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    soundEngine.setVolume(val);
  };

  // Play a quick test tick when adjusting slider stops
  const handleVolumeMouseUp = () => {
    soundEngine.play("click");
  };

  const testSounds: { label: string; type: Parameters<typeof soundEngine.play>[0] }[] = [
    { label: "Normal Click", type: "click" },
    { label: "Navigation Tab", type: "tick" },
    { label: "Open Modal", type: "whoosh" },
    { label: "Close Modal", type: "reverse-whoosh" },
    { label: "Execute / Launch", type: "execute" },
    { label: "Success Tone", type: "success" },
    { label: "Error Warning", type: "error" },
    { label: "Security Alert", type: "alert" },
    { label: "Toggle Switch", type: "toggle" },
    { label: "Dropdown Select", type: "select" },
  ];

  return (
    <div className="fixed bottom-6 left-6 z-50 no-print">
      {/* Floating Speaker Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`flex h-11 w-11 items-center justify-center rounded-full border bg-black/90 text-primary transition-all duration-300 hover:scale-105 cursor-pointer ${
            enabled
              ? "border-primary/50 shadow-[0_0_15px_rgba(0,255,136,0.35)]"
              : "border-border/60 text-muted-foreground"
          }`}
          aria-label="Open Audio Panel"
        >
          {enabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
        </button>
      )}

      {/* Cyber Sound Panel Card */}
      {isOpen && (
        <div className="w-80 glass-panel border border-primary/30 bg-black/95 p-5 shadow-[0_0_35px_rgba(0,255,136,0.2)] rounded-xl animate-in fade-in slide-in-from-bottom-6 duration-300 font-mono">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-4">
            <div className="flex items-center gap-2 text-primary">
              <Activity className="h-4.5 w-4.5 animate-pulse" />
              <span className="font-display text-xs font-bold uppercase tracking-wider">
                AUDIO INTERFACE MODULE
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded p-1 text-muted-foreground hover:bg-white/10 hover:text-white transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4 text-xs">
            {/* Toggle Enable Checkbox */}
            <div className="flex items-center justify-between border border-border/20 bg-black/20 p-3 rounded-lg">
              <span className="text-[10px] uppercase text-muted-foreground tracking-wider font-bold">
                ENABLE UI SOUNDS
              </span>
              <button
                onClick={handleToggle}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  enabled ? "bg-primary" : "bg-muted"
                }`}
                role="switch"
                aria-checked={enabled}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out ${
                    enabled ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Volume Control Slider */}
            <div className="space-y-2 border border-border/20 bg-black/20 p-3 rounded-lg">
              <div className="flex items-center justify-between text-[10px] uppercase text-muted-foreground tracking-wider font-bold">
                <span>MASTER VOLUME</span>
                <span className="text-primary font-bold">{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={handleVolumeChange}
                onMouseUp={handleVolumeMouseUp}
                onTouchEnd={handleVolumeMouseUp}
                disabled={!enabled}
                className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-primary disabled:opacity-50"
              />
            </div>

            {/* Test Sounds Grid */}
            <div className="border border-border/20 bg-black/20 p-3 rounded-lg space-y-2">
              <span className="text-[9px] uppercase text-muted-foreground tracking-widest block font-bold">
                // MODULE SIGNALS TEST DECK
              </span>
              <div className="grid grid-cols-2 gap-2">
                {testSounds.map((snd) => (
                  <button
                    key={snd.type}
                    onClick={() => soundEngine.play(snd.type)}
                    disabled={!enabled}
                    className="border border-border/40 hover:border-primary/50 bg-black/40 hover:bg-primary/5 p-2 rounded text-[9.5px] text-muted-foreground hover:text-primary transition text-left cursor-pointer flex items-center justify-between disabled:opacity-50 disabled:pointer-events-none group"
                  >
                    <span className="truncate">{snd.label}</span>
                    <Play className="h-2.5 w-2.5 opacity-50 group-hover:opacity-100 shrink-0 ml-1" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/30 text-center font-mono text-[8px] text-muted-foreground uppercase tracking-widest">
            v5.0 Sound Interface MODULE
          </div>
        </div>
      )}
    </div>
  );
}
