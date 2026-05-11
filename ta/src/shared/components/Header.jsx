import { motion } from 'framer-motion'
import { CircuitBoard, Github } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useUserMode } from '../context/UserModeContext'
import ThemeToggleButton from './ThemeToggleButton'

export default function Header({ brandText, tagline, navLinks, repoHref }) {
  const { mode, setMode } = useUserMode()
  const roleLinks =
    mode === 'hr'
      ? [
          { to: '/hr/dashboard', label: 'Dashboard' },
          { to: '/hr/candidates', label: 'Candidates' },
          { to: '/hr/post-jobs', label: 'Post Jobs' },
          { to: '/recruitment-analytics', label: 'Hiring Risk' },
        ]
      : []

  return (
    <motion.header
      initial={{ y: -18, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="sticky top-0 z-30 border-b border-white/70 bg-white/75 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <div className="min-w-0">
          <Link to="/" className="inline-flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-emerald-400 text-slate-950">
              <CircuitBoard className="h-4 w-4" />
            </span>
            <span className="truncate text-sm font-semibold text-slate-900 dark:text-white">
              {brandText}
            </span>
          </Link>
          <p className="mt-1 truncate text-xs text-slate-600 dark:text-white/70">{tagline}</p>
        </div>

        <nav className="hidden items-center gap-2 lg:flex">
          {roleLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 dark:border-white/10 dark:bg-slate-900 dark:text-white/80 dark:hover:border-cyan-300/35 dark:hover:text-cyan-100"
            >
              {link.label}
            </Link>
          ))}
          {(navLinks || []).map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-700 transition hover:text-cyan-700 dark:text-white/75 dark:hover:text-cyan-200"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {roleLinks.slice(0, 2).map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 dark:border-white/10 dark:bg-slate-900 dark:text-white/80 dark:hover:border-cyan-300/35 dark:hover:text-cyan-100 lg:hidden"
            >
              {link.label}
            </Link>
          ))}
          <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-0.5 dark:border-white/10 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setMode('candidate')}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                mode === 'candidate'
                  ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-400/20 dark:text-cyan-100'
                  : 'text-slate-600 hover:text-cyan-700 dark:text-white/70 dark:hover:text-cyan-200'
              }`}
            >
              Candidate
            </button>
            <button
              type="button"
              onClick={() => setMode('hr')}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                mode === 'hr'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-400/20 dark:text-emerald-100'
                  : 'text-slate-600 hover:text-emerald-700 dark:text-white/70 dark:hover:text-emerald-200'
              }`}
            >
              HR
            </button>
          </div>
          <span
            className={`hidden rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] sm:inline ${
              mode === 'hr'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-300/35 dark:bg-emerald-400/10 dark:text-emerald-100'
                : 'border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-300/35 dark:bg-cyan-400/10 dark:text-cyan-100'
            }`}
          >
            {mode === 'hr' ? 'HR View' : 'Candidate View'}
          </span>
          {repoHref ? (
            <a
              href={repoHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-200 bg-white/90 text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 dark:border-cyan-300/30 dark:bg-slate-900/70 dark:text-cyan-100"
              aria-label="Open repository"
            >
              <Github className="h-4 w-4" />
            </a>
          ) : null}
          <ThemeToggleButton />
        </div>
      </div>
    </motion.header>
  )
}
