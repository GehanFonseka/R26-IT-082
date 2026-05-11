import { ArrowLeft, Clock3, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function ModulePlaceholderPage({ title, description }) {
  return (
    <main className="relative flex min-h-screen items-center bg-slate-950 px-4 py-12 text-white md:px-6">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-16 h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-amber-300/10 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-4xl rounded-3xl border border-white/10 bg-white/5 p-8 md:p-10">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">
            PageHeader
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-cyan-300/50 hover:text-cyan-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Back To Landing
          </Link>
        </header>

        <h1 className="mt-8 text-4xl font-semibold text-white md:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-3xl text-base text-white/70">{description}</p>

        <section className="mt-10 rounded-2xl border border-dashed border-cyan-300/40 bg-slate-900/80 p-8">
          <p className="inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-amber-100">
            <Clock3 className="h-3.5 w-3.5" />
            ComingSoonCard
          </p>
          <h2 className="mt-4 text-2xl font-semibold text-white">Module UI Coming Soon</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/70">
            This route is wired and ready for feature implementation. Add upload,
            analysis, and visualization workflows here when backend integration
            begins.
          </p>
          <div className="mt-6 flex items-center gap-2 text-sm text-cyan-100">
            <Sparkles className="h-4 w-4" />
            Placeholder scaffold aligns with the required module-page contract.
          </div>
        </section>
      </div>
    </main>
  )
}
