import { motion } from 'framer-motion'
import { Github, Mail, MessagesSquare } from 'lucide-react'
import SectionTitle from './SectionTitle'
import { fadeInUp, staggerContainer } from '../utils/motion'

function contactMeta(type) {
  if (type === 'email') {
    return {
      icon: Mail,
      accent: 'from-cyan-500 to-sky-500',
      prefix: 'mailto',
    }
  }

  return {
    icon: Github,
    accent: 'from-emerald-500 to-teal-500',
    prefix: 'repository',
  }
}

export default function ContactSection({ title, methods }) {
  return (
    <section>
      <SectionTitle
        title={title}
        subtitle="Reach out for collaboration, demos, or implementation support."
        icon={MessagesSquare}
        tag="Get In Touch"
      />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="mt-4 grid gap-3 md:grid-cols-2"
      >
        {methods.map((method) => {
          const href = method.type === 'email' ? `mailto:${method.value}` : method.value
          const meta = contactMeta(method.type)
          const Icon = meta.icon

          return (
            <motion.a
              key={method.label}
              variants={fadeInUp}
              href={href}
              target={method.type === 'github' ? '_blank' : undefined}
              rel={method.type === 'github' ? 'noreferrer' : undefined}
              className="surface-card group p-4"
            >
              <div className="flex items-center gap-3">
                <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${meta.accent} text-white`}>
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{method.label}</p>
                  <p className="text-[11px] uppercase tracking-[0.1em] text-slate-500 dark:text-white/60">
                    {meta.prefix}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-600 transition group-hover:text-cyan-700 dark:text-white/70 dark:group-hover:text-cyan-100">
                {method.value}
              </p>
            </motion.a>
          )
        })}
      </motion.div>
    </section>
  )
}
