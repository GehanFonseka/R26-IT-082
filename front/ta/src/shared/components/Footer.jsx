import { motion } from 'framer-motion'
import { ArrowUpRight, CircuitBoard } from 'lucide-react'
import { fadeInUp } from '../utils/motion'

export default function Footer({ brandText, links, copyright }) {
  return (
    <motion.footer
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.4 }}
      className="border-t border-white/70 py-10 dark:border-white/10"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-5 px-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <CircuitBoard className="h-4 w-4 text-cyan-600 dark:text-cyan-200" />
            {brandText}
          </p>
          <p className="mt-1 text-xs text-slate-600 dark:text-white/65">
            Built for intelligent, transparent, and fairness-aware hiring workflows.
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 transition hover:text-cyan-700 dark:text-white/70 dark:hover:text-cyan-100"
            >
              {link.label}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-6 max-w-5xl px-4">
        <p className="text-xs text-slate-500 dark:text-white/55">{copyright}</p>
      </div>
    </motion.footer>
  )
}
