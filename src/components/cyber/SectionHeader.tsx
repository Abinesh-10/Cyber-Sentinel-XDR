import { motion } from "framer-motion";

export function SectionHeader({
  eyebrow,
  title,
  description,
  index,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  index?: string;
}) {
  return (
    <div className="mb-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.3em] text-primary">
            {index && <span className="text-foreground/50">{index}</span>}
            <span className="h-px w-10 bg-primary/60" />
            <span>{eyebrow}</span>
          </div>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-5xl">
            <span className="text-gradient text-glow">{title}</span>
          </h2>
        </div>
        {description && (
          <p className="max-w-md text-sm text-muted-foreground md:text-base">{description}</p>
        )}
      </motion.div>
    </div>
  );
}
