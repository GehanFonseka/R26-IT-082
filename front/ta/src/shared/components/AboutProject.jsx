import { motion } from 'framer-motion'
import { FlaskConical, SearchCheck, ShieldCheck } from 'lucide-react'
import SectionTitle from './SectionTitle'
import { fadeInUp, staggerContainer } from '../utils/motion'

const points = [
  {
    title: 'Research-Oriented',
    text: 'Designed for academic exploration of fair, data-driven recruitment.',
    icon: FlaskConical,
  },
  {
    title: 'Explainable Decisions',
    text: 'Every module produces transparent outputs for review and validation.',
    icon: SearchCheck,
  },
  {
    title: 'Matching Ready',
    text: 'Job-candidate matching includes explainable signals for transparent recommendations.',
    icon: ShieldCheck,
  },
]

export default function AboutProject({ title, text }) {
  return (
    <section className="surface-card p-6">
      <SectionTitle title={title} subtitle={text} icon={FlaskConical} tag="Project Context" />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="mt-5 grid gap-3 md:grid-cols-3"
      >
        {points.map((point) => {
          const Icon = point.icon

          return (
            <motion.article
              key={point.title}
              variants={fadeInUp}
              className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950"
            >
              <Icon className="h-4 w-4 text-cyan-600 dark:text-cyan-200" />
              <h3 className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
                {point.title}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-white/70">
                {point.text}
              </p>
            </motion.article>
          )
        })}
      </motion.div>
    </section>
  )
}
