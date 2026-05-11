import { motion } from 'framer-motion'
import { Grid2X2 } from 'lucide-react'
import FeatureCard from './FeatureCard'
import SectionTitle from './SectionTitle'
import { fadeInUp, staggerContainer } from '../utils/motion'

export default function ModulesGrid({ title, subtitle, cards }) {
  return (
    <section>
      <SectionTitle
        title={title}
        subtitle={subtitle}
        icon={Grid2X2}
        tag="Core Modules"
      />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        className="mt-6 grid gap-4 md:grid-cols-2"
      >
        {cards.map((card) => (
          <motion.div key={card.to} variants={fadeInUp}>
            <FeatureCard {...card} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
