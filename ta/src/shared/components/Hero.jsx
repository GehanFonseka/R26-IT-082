import { motion } from 'framer-motion'
import { ArrowRight, MoveRight, Sparkles, WandSparkles } from 'lucide-react'
import { fadeInUp, popIn, staggerContainer } from '../utils/motion'

export default function Hero({ headline, subheadline, ctaPrimary, ctaSecondary, visual }) {
  return (
    <section className="surface-card relative overflow-hidden p-6 md:p-8 lg:p-10">
      <div className="pointer-events-none absolute -right-16 -top-14 h-40 w-40 rounded-full bg-cyan-300/25 blur-2xl dark:bg-cyan-400/15" />
      <div className="pointer-events-none absolute -bottom-16 left-1/3 h-44 w-44 rounded-full bg-emerald-300/20 blur-2xl dark:bg-emerald-400/10" />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
        className="relative grid gap-8 lg:grid-cols-[1.05fr_0.95fr]"
      >
        <motion.div variants={fadeInUp}>
          <span className="accent-chip">
            <WandSparkles className="h-3.5 w-3.5" />
            AI Recruitment Platform
          </span>

          <h1 className="mt-5 text-3xl font-semibold leading-tight text-slate-900 dark:text-white md:text-5xl">
            {headline}
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-white/70 md:text-base">
            {subheadline}
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href={ctaPrimary.href}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(6,182,212,0.28)] transition hover:from-cyan-400 hover:to-emerald-400"
            >
              {ctaPrimary.label}
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href={ctaSecondary.href}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:bg-slate-900/70 dark:text-white/80 dark:hover:bg-white/10"
            >
              {ctaSecondary.label}
              <MoveRight className="h-4 w-4" />
            </a>
          </div>
        </motion.div>

        <motion.div variants={popIn} className="rounded-2xl border border-cyan-100 bg-cyan-50/80 p-5 dark:border-cyan-300/20 dark:bg-cyan-500/5">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-700 dark:text-cyan-100">
            <Sparkles className="h-3.5 w-3.5" />
            Workflow Preview
          </p>

          <ul className="mt-4 space-y-2">
            {visual.lines.map((line, index) => (
              <motion.li
                key={line}
                initial={{ opacity: 0, x: 10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: 0.12 * (index + 1) }}
                className="rounded-xl border border-cyan-100/80 bg-white px-3 py-2.5 text-sm text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-white/80"
              >
                {line}
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </motion.div>
    </section>
  )
}
