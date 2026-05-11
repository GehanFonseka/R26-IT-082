import { motion } from 'framer-motion'
import { BriefcaseBusiness, KeyRound, LoaderCircle, UserRound } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthSession } from '../context/AuthSessionContext'
import { useUserMode } from '../context/UserModeContext'
import { DEMO_CREDENTIALS } from '../utils/portalApi'

const fieldBaseClass =
  'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200/70 dark:border-white/10 dark:bg-slate-900 dark:text-white dark:focus:border-cyan-300 dark:focus:ring-cyan-400/25'

export default function PortalLoginPage({ portalMode = 'candidate' }) {
  const resolvedMode = portalMode === 'hr' ? 'hr' : 'candidate'
  const { mode, setMode } = useUserMode()
  const { login } = useAuthSession()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const activeDemo = useMemo(
    () => (resolvedMode === 'hr' ? DEMO_CREDENTIALS.hr : DEMO_CREDENTIALS.candidate),
    [resolvedMode],
  )

  useEffect(() => {
    if (mode !== resolvedMode) {
      setMode(resolvedMode)
    }
  }, [mode, resolvedMode, setMode])

  function fillCredentials() {
    const demo = resolvedMode === 'hr' ? DEMO_CREDENTIALS.hr : DEMO_CREDENTIALS.candidate
    setEmail(demo.email)
    setPassword(demo.password)
  }

  async function submitLogin(event) {
    event.preventDefault()
    setBusy(true)
    setErrorMessage('')

    try {
      await login({
        mode: resolvedMode,
        email,
        password,
      })

      navigate(resolvedMode === 'hr' ? '/hr/dashboard' : '/candidate/dashboard', { replace: true })
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  const isHrPortal = resolvedMode === 'hr'
  const portalTitle = isHrPortal ? 'HR Sign In' : 'Candidate Sign In'
  const portalCopy = isHrPortal
    ? 'Access recruiter tools, candidate reviews, job posting, interviews, and hiring analytics.'
    : 'Access your job dashboard, application status, available roles, and candidate profile.'
  const PortalIcon = isHrPortal ? BriefcaseBusiness : UserRound
  const accentClass = isHrPortal
    ? 'from-emerald-500/20 via-cyan-500/10 to-slate-500/10 dark:from-emerald-400/15 dark:via-cyan-400/10'
    : 'from-cyan-500/20 via-sky-500/10 to-emerald-500/10 dark:from-cyan-400/15 dark:via-sky-400/10'

  return (
    <main className={`relative min-h-screen overflow-hidden bg-gradient-to-br ${accentClass} px-4 py-8`}>
      <div className="pointer-events-none absolute inset-0 -z-10">
        <motion.div
          animate={{ opacity: [0.45, 0.8, 0.45], scale: [1, 1.06, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute left-[-80px] top-16 h-64 w-64 rounded-full bg-cyan-400/25 blur-3xl dark:bg-cyan-500/20"
        />
        <motion.div
          animate={{ opacity: [0.35, 0.7, 0.35], scale: [1.04, 1, 1.04] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute right-[-110px] bottom-16 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-400/15"
        />
      </div>

      <motion.section
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto w-full max-w-lg surface-card p-6"
      >
        <p className="accent-chip">
          <PortalIcon className="h-3.5 w-3.5" />
          {isHrPortal ? 'Recruiter Portal' : 'Candidate Portal'}
        </p>
        <h1 className="mt-4 text-2xl font-semibold text-slate-900 dark:text-white">
          {portalTitle}
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-white/70">
          {portalCopy}
        </p>

        <div className="mt-4">
          <button type="button" className="btn-secondary" onClick={fillCredentials}>
            Autofill {isHrPortal ? 'HR' : 'Candidate'} Demo
          </button>
        </div>

        <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-white/75">
          Current mode demo: <strong>{activeDemo.email}</strong> / <strong>{activeDemo.password}</strong>
        </p>

        {errorMessage ? (
          <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-300/25 dark:bg-rose-400/10 dark:text-rose-200">
            {errorMessage}
          </p>
        ) : null}

        <form className="mt-4 grid gap-3" onSubmit={submitLogin}>
          <label className="text-sm font-medium text-slate-700 dark:text-white/85">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={fieldBaseClass}
              placeholder="name@example.com"
              autoComplete="username"
              required
            />
          </label>
          <label className="text-sm font-medium text-slate-700 dark:text-white/85">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={fieldBaseClass}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </label>
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            {busy ? 'Signing In...' : `Login as ${isHrPortal ? 'HR' : 'Candidate'}`}
          </button>
        </form>
      </motion.section>
    </main>
  )
}
