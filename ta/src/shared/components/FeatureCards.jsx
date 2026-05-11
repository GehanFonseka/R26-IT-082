import FeatureCard from './FeatureCard'

const baseCols = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
}

const mdCols = {
  1: 'md:grid-cols-1',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
}

const lgCols = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
}

export default function FeatureCards({ title, subtitle, layout, cards }) {
  const gridClasses = [
    'grid',
    baseCols[layout?.columns?.base] ?? baseCols[1],
    mdCols[layout?.columns?.md] ?? mdCols[2],
    lgCols[layout?.columns?.lg] ?? lgCols[2],
    layout?.gap ?? 'gap-6',
  ].join(' ')

  return (
    <div>
      <h2 className="text-3xl font-semibold text-white">{title}</h2>
      <p className="mt-3 text-white/70">{subtitle}</p>

      <div className={`mt-8 ${gridClasses}`}>
        {cards.map((card) => (
          <FeatureCard key={card.id} {...card} />
        ))}
      </div>
    </div>
  )
}
