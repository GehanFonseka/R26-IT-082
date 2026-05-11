import { motion } from 'framer-motion'
import {
  Activity,
  ArrowLeft,
  FileSearch,
  LayoutPanelTop,
  MessageSquareText,
  ShieldAlert,
  Workflow,
} from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { useSharedCv } from '../context/SharedCvContext'
import { useUserMode } from '../context/UserModeContext'
import ThemeToggleButton from './ThemeToggleButton'
import { fadeInUp } from '../utils/motion'

const toneMap = {
  cyan: 'from-cyan-500 to-sky-500',
  emerald: 'from-emerald-500 to-teal-500',
  orange: 'from-orange-500 to-amber-500',
  blue: 'from-blue-500 to-indigo-500',
}

const moduleLinks = [
  {
    label: 'Resume Parser',
    path: '/resume-parser',
    Icon: FileSearch,
  },
  {
    label: 'Job Matching',
    path: '/job-candidate-matching',
    Icon: ShieldAlert,
  },
]

const hrModuleLinks = [
  {
    label: 'Post Jobs',
    path: '/hr-post-jobs',
    Icon: Workflow,
  },
  {
    label: 'Full Cycle',
    path: '/full-hiring-cycle',
    Icon: Workflow,
  },
  {
    label: 'Hiring Risk',
    path: '/recruitment-analytics',
    Icon: Activity,
  },
  {
    label: 'Interview Eval',
    path: '/interview-soft-skills',
    Icon: MessageSquareText,
  },
]

export default function ModulePageLayout({ title, description, children, icon: Icon = LayoutPanelTop, tone = 'cyan' }) {
  const toneClass = toneMap[tone] ?? toneMap.cyan
  const { mode, isCandidate, setMode } = useUserMode()
  const {
    sharedCvFile,
    sharedCvCacheId,
    sharedCvExpiresAt,
    cacheStatus,
    cacheError,
    cacheSharedCvFile,
    clearSharedCvFile,
  } = useSharedCv()

  const cacheStateMessage =
    cacheStatus === 'uploading'
      ? 'Caching CV...'
      : cacheStatus === 'ready'
        ? `Cached ID: ${sharedCvCacheId?.slice(0, 8)}`
        : cacheStatus === 'error'
          ? cacheError || 'Cache upload failed.'
          : 'Cache not ready yet.'
  const activeModuleLinks = mode === 'hr' ? hrModuleLinks : moduleLinks

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 md:py-8">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[-70px] top-10 h-56 w-56 rounded-full bg-cyan-400/18 blur-3xl dark:bg-cyan-400/12" />
        <div className="absolute right-[-90px] top-52 h-64 w-64 rounded-full bg-emerald-400/15 blur-3xl dark:bg-emerald-400/10" />
      </div>

      <div className="mx-auto max-w-6xl">
        <motion.header
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="surface-card p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 dark:border-white/10 dark:bg-slate-900 dark:text-white/85 dark:hover:border-cyan-200/40 dark:hover:text-cyan-100"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>

              <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${toneClass} text-white shadow-md`}>
                <Icon className="h-5 w-5" />
              </span>

              <div>
                <p className="text-base font-semibold text-slate-900 dark:text-white">{title}</p>
                <p className="text-xs text-slate-600 dark:text-white/70">{description}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {mode === 'hr' ? (
                <Link
                  to="/"
                  className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 dark:border-white/10 dark:bg-slate-900 dark:text-white/80 dark:hover:border-cyan-300/35 dark:hover:text-cyan-100"
                >
                  Jobs
                </Link>
              ) : null}
              {mode === 'hr' ? (
                <Link
                  to="/hr-post-jobs"
                  className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 dark:border-white/10 dark:bg-slate-900 dark:text-white/80 dark:hover:border-cyan-300/35 dark:hover:text-cyan-100"
                >
                  Post Jobs
                </Link>
              ) : null}
              <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-0.5 dark:border-white/10 dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => setMode('candidate')}
                  className={`rounded-lg px-2 py-1 text-[11px] font-semibold transition ${
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
                  className={`rounded-lg px-2 py-1 text-[11px] font-semibold transition ${
                    mode === 'hr'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-400/20 dark:text-emerald-100'
                      : 'text-slate-600 hover:text-emerald-700 dark:text-white/70 dark:hover:text-emerald-200'
                  }`}
                >
                  HR
                </button>
              </div>
              <ThemeToggleButton />
            </div>
          </div>
        </motion.header>

        <div className="mt-6 grid gap-4 lg:grid-cols-[250px_minmax(0,1fr)]">
          <motion.aside
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.05 }}
            className="surface-card h-fit p-4"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-white/60">
              Module Navigation
            </p>

            <nav className="mt-3 space-y-2">
              {activeModuleLinks.map(({ label, path, Icon: LinkIcon }) => (
                <NavLink
                  key={path}
                  to={path}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                      isActive
                        ? 'border-cyan-300 bg-cyan-50 text-cyan-700 dark:border-cyan-300/35 dark:bg-cyan-400/10 dark:text-cyan-100'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-cyan-300 hover:text-cyan-700 dark:border-white/10 dark:bg-slate-900 dark:text-white/80 dark:hover:border-cyan-200/35 dark:hover:text-cyan-100'
                    }`
                  }
                >
                  <LinkIcon className="h-4 w-4" />
                  {label}
                </NavLink>
              ))}
            </nav>

            {isCandidate ? (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-900">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-white/60">
                  Shared CV
                </p>
                <p className="mt-1 text-xs text-slate-700 dark:text-white/80">
                  {sharedCvFile ? sharedCvFile.name : 'No CV uploaded yet.'}
                </p>
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  className="mt-2 block w-full text-xs text-slate-700 file:mr-2 file:rounded-md file:border-0 file:bg-gradient-to-r file:from-cyan-500 file:to-emerald-500 file:px-2.5 file:py-1.5 file:text-xs file:font-semibold file:text-white dark:text-white/80 dark:file:from-cyan-400 dark:file:to-emerald-400"
                  onChange={async (event) => {
                    const file = event.target.files?.[0]
                    if (!file) {
                      return
                    }
                    try {
                      await cacheSharedCvFile(file)
                    } catch {
                      // Error state is exposed by shared context.
                    }
                  }}
                />
                <p className="mt-1 text-[11px] text-slate-500 dark:text-white/55">
                  {cacheStateMessage}
                </p>
                {sharedCvExpiresAt ? (
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-white/55">
                    Expires: {new Date(sharedCvExpiresAt).toLocaleString()}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={clearSharedCvFile}
                  className="mt-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 dark:border-white/10 dark:bg-slate-900 dark:text-white/75 dark:hover:border-cyan-300/35 dark:hover:text-cyan-100"
                >
                  Clear Shared CV
                </button>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-white/55">
                  Upload from any candidate module and reuse the cached CV.
                </p>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-900">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-white/60">
                  HR Workspace
                </p>
                <p className="mt-1 text-xs text-slate-700 dark:text-white/80">
                  HR mode shows only recruiter/admin workflow pages.
                </p>
              </div>
            )}
          </motion.aside>

          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.08 }}
          >
            {children}
          </motion.div>
        </div>
      </div>
    </main>
  )
}
