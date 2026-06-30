export function HoloGlobe({ size = 460 }: { size?: number }) {
  // SVG-based wireframe globe with rotating rings + orbiting dots
  const s = size;
  const r = s / 2 - 20;
  const cx = s / 2;
  const cy = s / 2;
  const lat = [0, 25, -25, 50, -50, 70, -70];
  const lon = [0, 30, 60, 90, 120, 150];

  return (
    <div className="relative" style={{ width: s, height: s }}>
      {/* outer glow */}
      <div
        className="absolute inset-0 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(0,255,136,0.25), transparent 60%)" }}
      />
      {/* rotating rings */}
      <div className="absolute inset-0 animate-spin-slow">
        <svg viewBox={`0 0 ${s} ${s}`} className="h-full w-full">
          <defs>
            <radialGradient id="globeFill" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(0,255,136,0.12)" />
              <stop offset="70%" stopColor="rgba(0,255,136,0.02)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="url(#globeFill)"
            stroke="rgba(0,255,136,0.6)"
            strokeWidth="1"
          />
          {lat.map((deg) => {
            const ry = r * Math.cos((deg * Math.PI) / 180);
            const y = cy + r * Math.sin((deg * Math.PI) / 180);
            return (
              <ellipse
                key={`lat${deg}`}
                cx={cx}
                cy={y}
                rx={Math.abs(ry)}
                ry={Math.abs(ry) * 0.18}
                fill="none"
                stroke="rgba(0,255,136,0.35)"
                strokeWidth="0.6"
              />
            );
          })}
          {lon.map((deg) => (
            <ellipse
              key={`lon${deg}`}
              cx={cx}
              cy={cy}
              rx={r * Math.abs(Math.cos((deg * Math.PI) / 180))}
              ry={r}
              fill="none"
              stroke="rgba(0,255,136,0.28)"
              strokeWidth="0.6"
              transform={`rotate(${deg} ${cx} ${cy})`}
            />
          ))}
          {/* attack arcs */}
          {[0, 1, 2, 3].map((i) => {
            const a1 = (i * 70 + 10) * (Math.PI / 180);
            const a2 = (i * 70 + 160) * (Math.PI / 180);
            const x1 = cx + r * Math.cos(a1);
            const y1 = cy + r * Math.sin(a1);
            const x2 = cx + r * Math.cos(a2);
            const y2 = cy + r * Math.sin(a2);
            return (
              <path
                key={i}
                d={`M${x1} ${y1} Q ${cx} ${cy - r * 0.6} ${x2} ${y2}`}
                fill="none"
                stroke="rgba(0,255,136,0.8)"
                strokeWidth="1"
                strokeDasharray="3 4"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from="0"
                  to="-40"
                  dur={`${3 + i}s`}
                  repeatCount="indefinite"
                />
              </path>
            );
          })}
        </svg>
      </div>
      {/* counter-rotating outer ring */}
      <div className="absolute -inset-4 animate-spin-rev">
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <circle
            cx="50"
            cy="50"
            r="48"
            fill="none"
            stroke="rgba(0,255,136,0.35)"
            strokeWidth="0.3"
            strokeDasharray="0.6 3"
          />
          {[0, 90, 180, 270].map((deg) => (
            <g key={deg} transform={`rotate(${deg} 50 50)`}>
              <circle cx="50" cy="2" r="1.2" fill="#00ff88" />
            </g>
          ))}
        </svg>
      </div>
      {/* center crosshair */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-mono text-[10px] uppercase tracking-widest text-primary/70">
        <div className="text-center">
          <div className="text-glow">SENTINEL</div>
          <div className="opacity-60">GEO · ACTIVE</div>
        </div>
      </div>
    </div>
  );
}
