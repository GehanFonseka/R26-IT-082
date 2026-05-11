import { motion } from 'framer-motion'
import {
  ArrowUpRight,
  BarChart3,
  FileText,
  GitCompareArrows,
  MessageSquareText,
  Shield,
  Target,
  Workflow,
} from 'lucide-react'
import { Link } from 'react-router-dom'

const iconMap = {
  FileText,
  Target,
  Shield,
  BarChart3,
  MessageSquareText,
  Workflow,
}

const accentMap = {
  FileText: 'from-cyan-500 to-sky-500',
  Target: 'from-emerald-500 to-teal-500',
  Shield: 'from-orange-500 to-amber-500',
  BarChart3: 'from-blue-500 to-indigo-500',
  MessageSquareText: 'from-teal-500 to-cyan-500',
  Workflow: 'from-indigo-500 to-violet-500',
}

export default function FeatureCard({ title, description, to, icon, highlights = [], ctaLabel }) {
  const Icon = iconMap[icon] ?? FileText
  const accent = accentMap[icon] ?? 'from-cyan-500 to-emerald-500'

  return (
    <motion.article
      whileHover={{ y: -6, transition: { duration: 0.24 } }}
      className="surface-card group p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white shadow-md`}>
          <Icon className="h-5 w-5" />
        </div>
        <GitCompareArrows className="h-4 w-4 text-slate-400 dark:text-white/40" />
      </div>

      <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-white/70">{description}</p>

      {highlights.length > 0 ? (
        <ul className="mt-4 space-y-1.5">
          {highlights.slice(0, 3).map((item) => (
            <li key={item} className="text-xs text-slate-600 dark:text-white/65">
              <span className="mr-2 text-cyan-600 dark:text-cyan-200">•</span>
              {item}
            </li>
          ))}
        </ul>
      ) : null}

      <Link
        to={to}
        className="mt-5 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition group-hover:border-cyan-300 group-hover:text-cyan-700 dark:border-white/10 dark:bg-slate-900 dark:text-white/85 dark:group-hover:border-cyan-200/40 dark:group-hover:text-cyan-100"
      >
        {ctaLabel || 'Open Module'}
        <ArrowUpRight className="h-4 w-4" />
      </Link>
    </motion.article>
  )
}
