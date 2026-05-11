import { motion } from 'framer-motion'
import {
  CheckCircle2,
  Copy,
  Download,
  LoaderCircle,
  Radar,
  TriangleAlert,
} from 'lucide-react'
import { fadeInUp } from '../utils/motion'

function displayValue(value) {
  if (value === null || value === undefined) {
    return 'N/A'
  }

  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }

  return String(value)
}

export default function MinimalOutputCard({
  title,
  state,
  data,
  errorMessage,
  onCopy,
  onExport,
  icon: Icon = Radar,
}) {
  return (
    <motion.section variants={fadeInUp} className="surface-card p-5" whileHover={{ y: -2 }}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
            <Icon className="h-4.5 w-4.5" />
          </span>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCopy}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-slate-900 dark:text-white/80 dark:hover:border-cyan-200/40 dark:hover:text-cyan-100"
            disabled={state !== 'success'}
          >
            <Copy className="h-3.5 w-3.5" />
            Copy
          </button>
          <button
            type="button"
            onClick={onExport}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-slate-900 dark:text-white/80 dark:hover:border-cyan-200/40 dark:hover:text-cyan-100"
            disabled={state !== 'success'}
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
        </div>
      </div>

      <div className="mt-4 min-h-[260px] rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/80">
        {state === 'idle' ? (
          <p className="text-sm text-slate-500 dark:text-white/60">Run an action to view output.</p>
        ) : null}

        {state === 'loading' ? (
          <div className="space-y-3">
            <p className="flex items-center gap-2 text-sm text-cyan-700 dark:text-cyan-100">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Processing
              <span className="processing-dots">
                <span />
                <span />
                <span />
              </span>
            </p>
            <div className="processing-bar">
              <span />
            </div>
            <div className="grid gap-2">
              <div className="shimmer-skeleton h-12" />
              <div className="shimmer-skeleton h-16" />
              <div className="shimmer-skeleton h-16" />
            </div>
          </div>
        ) : null}

        {state === 'error' ? (
          <p className="flex items-center gap-2 text-sm text-red-600 dark:text-red-300">
            <TriangleAlert className="h-4 w-4" />
            {errorMessage || 'Something went wrong.'}
          </p>
        ) : null}

        {state === 'success' ? (
          <div className="space-y-3 text-sm">
            <p className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Completed
            </p>

            {Object.entries(data ?? {}).map(([key, value], index) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
                className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-900"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-white/60">
                  {key}
                </p>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs text-slate-700 dark:text-white/80">
                  {displayValue(value)}
                </pre>
              </motion.div>
            ))}
          </div>
        ) : null}
      </div>
    </motion.section>
  )
}
