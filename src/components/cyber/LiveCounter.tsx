import { useEffect, useState } from "react";

export function LiveCounter({
  start = 0,
  step = 1,
  intervalMs = 90,
  format,
  value,
}: {
  start?: number;
  step?: number;
  intervalMs?: number;
  format?: (n: number) => string;
  value?: number;
}) {
  const [n, setN] = useState(start);
  useEffect(() => {
    if (value !== undefined) {
      setN(value);
      return;
    }

    const t = setInterval(() => {
      setN((v) => v + Math.floor(Math.random() * step) + 1);
    }, intervalMs);
    return () => clearInterval(t);
  }, [step, intervalMs, value]);
  return <span>{format ? format(n) : n.toLocaleString()}</span>;
}
