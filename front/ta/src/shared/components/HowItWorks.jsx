import { motion } from 'framer-motion'
import { Binary, Brain, ClipboardCheck } from 'lucide-react'
import SectionTitle from './SectionTitle'
import { fadeInUp, staggerContainer } from '../utils/motion'

const stepIcons = [Binary, Brain, ClipboardCheck]

export default function HowItWorks({ title, steps }) {
  return (
    <section>
      <SectionTitle title={title} icon={Binary} tag="Pipeline" />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        className="mt-6 grid gap-3 md:grid-cols-3"
      >
        {steps.map((step, index) => {
          const Icon = stepIcons[index] ?? ClipboardCheck

          return (
            <motion.article
              key={step.n}
              variants={fadeInUp}
              className="surface-card p-4"
            >
              <div className="flex items-center justify-between">
                <span className="accent-chip">Step {step.n}</span>
                <Icon className="h-4 w-4 text-cyan-600 dark:text-cyan-200" />
              </div>
              <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-white">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-white/70">{step.text}</p>
            </motion.article>
          )
        })}
      </motion.div>
    </section>
  )
}
