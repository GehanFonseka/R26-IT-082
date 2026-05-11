const typeClasses = {
  frontend: 'border-cyan-300/40 bg-cyan-300/10 text-cyan-100',
  tooling: 'border-amber-300/40 bg-amber-300/10 text-amber-100',
  styling: 'border-fuchsia-300/40 bg-fuchsia-300/10 text-fuchsia-100',
  ml: 'border-emerald-300/40 bg-emerald-300/10 text-emerald-100',
  backend: 'border-blue-300/40 bg-blue-300/10 text-blue-100',
  dashboard: 'border-rose-300/40 bg-rose-300/10 text-rose-100',
}

export default function TechStack({ title, items, note }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-8 md:p-10">
      <h2 className="text-3xl font-semibold text-white">{title}</h2>
      <div className="mt-6 flex flex-wrap gap-3">
        {items.map((item) => (
          <span
            key={item.label}
            className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium ${typeClasses[item.type] ?? typeClasses.frontend}`}
          >
            {item.label}
          </span>
        ))}
      </div>
      <p className="mt-5 text-sm text-white/70">{note}</p>
    </div>
  )
}
