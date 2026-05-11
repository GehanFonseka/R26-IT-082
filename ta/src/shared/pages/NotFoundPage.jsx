import { motion } from 'framer-motion'
import { Compass, House } from 'lucide-react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'

export default function NotFoundPage() {
  return (
    <main className="min-h-screen">
      <Header
        brandText="AI Talent Acquisition"
        tagline="Route not found"
        navLinks={[]}
      />
      <section className="grid min-h-[calc(100vh-88px)] place-items-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="surface-card max-w-md p-7 text-center"
        >
          <span className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 text-white">
            <Compass className="h-5 w-5" />
          </span>
          <h1 className="mt-4 text-2xl font-semibold text-slate-900 dark:text-white">Page not found</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-white/70">
            This route is not available in the current module set.
          </p>
          <Link
            to="/"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-2.5 text-sm font-semibold text-white"
          >
            <House className="h-4 w-4" />
            Go to Landing
          </Link>
        </motion.div>
      </section>
    </main>
  )
}
