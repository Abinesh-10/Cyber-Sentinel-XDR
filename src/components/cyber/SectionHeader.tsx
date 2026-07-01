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
  /** kept for backwards compatibility; no longer rendered as a "// NN" tag */
  index?: string;
}) {
  void index;
  return (
    <div className="mb-9">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
        className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3"
      >
        <div className="max-w-2xl">
          <span className="eyebrow">{eyebrow}</span>
          <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-foreground md:text-[2rem] md:leading-[1.1]">
            {title}
          </h2>
        </div>
        {description && (
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}
      </motion.div>
      <div className="mt-6 h-px w-full bg-gradient-to-r from-border-strong via-border to-transparent" />
    </div>
  );
}
