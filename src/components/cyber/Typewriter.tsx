import { useEffect, useState } from "react";

export function Typewriter({
  phrases,
  className = "",
  speed = 55,
  pause = 1600,
}: {
  phrases: string[];
  className?: string;
  speed?: number;
  pause?: number;
}) {
  const [text, setText] = useState("");
  const [idx, setIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = phrases[idx % phrases.length];
    if (!deleting && text === current) {
      const t = setTimeout(() => setDeleting(true), pause);
      return () => clearTimeout(t);
    }
    if (deleting && text === "") {
      setDeleting(false);
      setIdx((i) => i + 1);
      return;
    }
    const t = setTimeout(
      () => {
        setText(deleting ? current.slice(0, text.length - 1) : current.slice(0, text.length + 1));
      },
      deleting ? speed / 2 : speed,
    );
    return () => clearTimeout(t);
  }, [text, deleting, idx, phrases, speed, pause]);

  return (
    <span className={className}>
      {text}
      <span className="ml-1 inline-block h-[1em] w-[2px] -translate-y-[-2px] bg-primary align-middle animate-pulse" />
    </span>
  );
}
