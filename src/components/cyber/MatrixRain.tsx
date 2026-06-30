import { useEffect, useRef } from "react";

export function MatrixRain({ opacity = 0.18 }: { opacity?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    const fontSize = 14;
    let columns = Math.floor(width / fontSize);
    let drops = new Array(columns).fill(1).map(() => Math.random() * -100);
    const chars = "01アイウエオカキクケコｱｲｳｴｵｶｷｸｹｺ<>{}[]/*-+=ABCDEF0123456789".split("");

    const onResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      columns = Math.floor(width / fontSize);
      drops = new Array(columns).fill(1).map(() => Math.random() * -100);
    };
    window.addEventListener("resize", onResize);

    const draw = () => {
      ctx.fillStyle = `rgba(5, 10, 8, 0.08)`;
      ctx.fillRect(0, 0, width, height);
      ctx.font = `${fontSize}px JetBrains Mono, monospace`;
      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        const grad = ctx.createLinearGradient(0, y - 40, 0, y);
        grad.addColorStop(0, `rgba(0,255,136,0)`);
        grad.addColorStop(1, `rgba(0,255,136,${opacity * 4})`);
        ctx.fillStyle = grad;
        ctx.fillText(text, x, y);
        if (Math.random() > 0.975) {
          ctx.fillStyle = `rgba(220,255,235,${opacity * 5})`;
          ctx.fillText(text, x, y);
        }
        if (y > height && Math.random() > 0.97) drops[i] = 0;
        drops[i] += 0.6;
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [opacity]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 -z-10"
      style={{ opacity }}
    />
  );
}
