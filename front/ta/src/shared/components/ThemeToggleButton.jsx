import { motion } from 'framer-motion'
import { MoonStar, SunMedium } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

export default function ThemeToggleButton() {
  const { mode, toggleTheme } = useTheme()

  return (
    <motion.button
      type="button"
      onClick={toggleTheme}
      whileTap={{ scale: 0.95 }}
      whileHover={{ y: -1 }}
      className="inline-flex items-center gap-2 rounded-xl border border-cyan-200 bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-cyan-300 hover:text-slate-900 dark:border-cyan-300/30 dark:bg-slate-900/70 dark:text-cyan-100 dark:hover:border-cyan-200/50"
      aria-label="Toggle theme"
    >
      <motion.span
        key={mode}
        initial={{ rotate: -20, opacity: 0.5 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 0.25 }}
      >
        {mode === 'dark' ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
      </motion.span>
      {mode === 'dark' ? 'Light' : 'Dark'}
    </motion.button>
  )
}
