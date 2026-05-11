import { CheckCircle2 } from 'lucide-react'

export default function Overview({ title, description, bullets }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-8 md:p-10">
      <h2 className="text-3xl font-semibold text-white">{title}</h2>
      <p className="mt-4 max-w-4xl text-base leading-relaxed text-white/70">
        {description}
      </p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {bullets.map((bullet) => (
          <li
            key={bullet}
            className="flex items-start gap-3 rounded-xl border border-white/10 bg-slate-900/60 p-4 text-sm text-white/80"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
