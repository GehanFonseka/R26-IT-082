import { motion } from 'framer-motion'
import { ClipboardPenLine } from 'lucide-react'
import { useEffect, useState } from 'react'
import { fadeInUp } from '../utils/motion'

const fieldBaseClass =
  'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200/70 dark:border-white/10 dark:bg-slate-900 dark:text-white dark:focus:border-cyan-300 dark:focus:ring-cyan-400/25'

function initialValues(fields) {
  return fields.reduce((acc, field) => {
    acc[field.id] = field.type === 'file' ? null : ''
    return acc
  }, {})
}

export default function MinimalInputCard({ title, helperText, fields, action, onSubmit, icon: Icon = ClipboardPenLine }) {
  const [values, setValues] = useState(initialValues(fields))

  useEffect(() => {
    setValues(initialValues(fields))
  }, [fields])

  function updateValue(fieldId, value) {
    setValues((prev) => ({ ...prev, [fieldId]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit(values)
  }

  return (
    <motion.section variants={fadeInUp} className="surface-card p-5" whileHover={{ y: -2 }}>
      <div className="flex items-start gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 text-white">
          <Icon className="h-4.5 w-4.5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
          {helperText ? (
            <p className="mt-1 text-sm text-slate-600 dark:text-white/70">{helperText}</p>
          ) : null}
        </div>
      </div>

      <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
        {fields.map((field) => (
          <label key={field.id} className="block text-sm font-medium text-slate-700 dark:text-white/85">
            {field.label}

            {field.type === 'textarea' ? (
              <textarea
                value={values[field.id]}
                onChange={(event) => updateValue(field.id, event.target.value)}
                placeholder={field.placeholder}
                rows={6}
                className={fieldBaseClass}
              />
            ) : null}

            {field.type === 'text' ? (
              <input
                type="text"
                value={values[field.id]}
                onChange={(event) => updateValue(field.id, event.target.value)}
                placeholder={field.placeholder}
                className={fieldBaseClass}
              />
            ) : null}

            {field.type === 'file' ? (
              <>
                <input
                  type="file"
                  className={`${fieldBaseClass} file:mr-3 file:rounded-lg file:border-0 file:bg-gradient-to-r file:from-cyan-500 file:to-emerald-500 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white dark:file:from-cyan-400 dark:file:to-emerald-400`}
                  onChange={(event) => {
                    const selected = event.target.files?.[0] || null
                    updateValue(field.id, selected)
                  }}
                />
                {values[field.id] instanceof File ? (
                  <p className="mt-1 text-xs text-cyan-700 dark:text-cyan-200">
                    Selected: {values[field.id].name}
                  </p>
                ) : null}
              </>
            ) : null}

            {field.type === 'select' ? (
              <select
                value={values[field.id]}
                onChange={(event) => updateValue(field.id, event.target.value)}
                className={fieldBaseClass}
              >
                <option value="">Select</option>
                {(field.options ?? []).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : null}
          </label>
        ))}

        <motion.button
          whileTap={{ scale: 0.97 }}
          type="submit"
          className="btn-primary"
        >
          {action.label}
        </motion.button>
      </form>
    </motion.section>
  )
}
