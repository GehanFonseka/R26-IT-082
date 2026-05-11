import { motion } from 'framer-motion'
import { BriefcaseBusiness, LogOut, UserRound } from 'lucide-react'
import ThemeToggleButton from '../ThemeToggleButton'

export default function WorkspaceShell({
  mode,
  title,
  subtitle,
  activeItemKey,
  navItems,
  onSelectItem,
  onLogout,
  children,
}) {
  return (
    <main className="min-h-screen">
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-30 border-b border-white/70 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-white/55">
              Talent Dashboard
            </p>
            <h1 className="truncate text-sm font-semibold text-slate-900 dark:text-white">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggleButton />
            <button type="button" onClick={onLogout} className="btn-secondary">
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </button>
          </div>
        </div>
      </motion.header>

      <div className="mx-auto flex max-w-7xl flex-col md:flex-row">
        <motion.aside
          initial={{ opacity: 0, x: -14 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="border-b border-slate-200 bg-white/70 px-3 py-3 dark:border-white/10 dark:bg-slate-950/50 md:min-h-[calc(100vh-65px)] md:w-64 md:border-b-0 md:border-r"
        >
          <div className="mb-3 hidden items-center gap-2 px-2 md:flex">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-emerald-400 text-slate-950">
              {mode === 'hr' ? <BriefcaseBusiness className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}
            </span>
            <div>
              <p className="text-xs font-semibold text-slate-900 dark:text-white">
                {mode === 'hr' ? 'HR Workspace' : 'Candidate Workspace'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-white/55">{subtitle}</p>
            </div>
          </div>

          <nav className="flex gap-2 overflow-x-auto pb-1 md:flex-col md:overflow-visible">
            {navItems.map((item) => {
              const isActive = item.key === activeItemKey
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onSelectItem(item.key)}
                  className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition ${
                    isActive
                      ? 'border-cyan-300 bg-cyan-50 text-cyan-800 dark:border-cyan-300/35 dark:bg-cyan-400/15 dark:text-cyan-100'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-cyan-200 hover:text-cyan-700 dark:border-white/10 dark:bg-slate-900 dark:text-white/75 dark:hover:border-cyan-300/30 dark:hover:text-cyan-100'
                  }`}
                >
                  <item.icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="whitespace-nowrap">{item.label}</span>
                </button>
              )
            })}
          </nav>
        </motion.aside>

        <section className="flex-1 px-4 py-4 md:px-6 md:py-6">{children}</section>
      </div>
    </main>
  )
}
