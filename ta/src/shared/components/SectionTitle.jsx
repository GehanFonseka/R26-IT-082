import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { fadeInUp } from '../utils/motion'

export default function SectionTitle({ title, subtitle, icon: Icon = Sparkles, tag = 'Section' }) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.35 }}
    >
      <span className="accent-chip">
        <Icon className="h-3.5 w-3.5" />
        {tag}
      </span>
      <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white md:text-3xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-white/70 md:text-base">
          {subtitle}
        </p>
      ) : null}
    </motion.div>
  )
}
