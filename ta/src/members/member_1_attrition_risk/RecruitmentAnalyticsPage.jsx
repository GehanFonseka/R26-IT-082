import { motion } from 'framer-motion'
import {
  Activity,
  BadgeCheck,
  BriefcaseBusiness,
  ChartNoAxesColumn,
  CheckCircle2,
  Clock3,
  Copy,
  Download,
  FileUp,
  Gauge,
  LoaderCircle,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react'
import { useState } from 'react'
import ModulePageLayout from '../../shared/components/ModulePageLayout'
import { useSharedCv } from '../../shared/context/SharedCvContext'
import { fadeInUp, staggerContainer } from '../../shared/utils/motion'
import { copyJson, downloadJson } from '../../shared/utils/modelUtils'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

const fieldBaseClass =
  'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200/70 dark:border-white/10 dark:bg-slate-900 dark:text-white dark:focus:border-cyan-300 dark:focus:ring-cyan-400/25'

const employmentIconMap = {
  TotalWorkingYears: BriefcaseBusiness,
  YearsAtCompany: Clock3,
  YearsInCurrentRole: Activity,
  YearsSinceLastPromotion: BadgeCheck,
  YearsWithCurrManager: ShieldCheck,
  NumCompaniesWorked: ChartNoAxesColumn,
}

async function requestAttritionRisk(file, cvCacheId) {
  const formData = new FormData()

  if (file instanceof File) {
    formData.append('cv_file', file)
  } else if (cvCacheId) {
    formData.append('cv_cache_id', cvCacheId)
  } else {
    throw new Error('Upload a CV or use a valid shared CV cache before scoring.')
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/attrition/score-from-cv`, {
    method: 'POST',
    body: formData,
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      payload?.detail?.error ||
      payload?.error ||
      payload?.detail ||
      `Request failed with status ${response.status}`
    throw new Error(message)
  }

  return payload
}

const riskThemeByBand = {
  LOW: {
    label: 'LOW RISK',
    summary:
      'This resume appears low risk for early resignation based on CV signals.',
    Icon: ShieldCheck,
    badgeClass:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-300/30 dark:bg-emerald-400/10 dark:text-emerald-100',
    cardClass:
      'border-emerald-200/70 bg-gradient-to-br from-emerald-50 to-cyan-50 dark:border-emerald-300/25 dark:from-emerald-400/10 dark:to-cyan-400/10',
    barClass: 'from-emerald-500 to-cyan-500',
  },
  MEDIUM: {
    label: 'MEDIUM RISK',
    summary:
      'This resume is medium risk. Use interview checks to validate retention fit.',
    Icon: ShieldAlert,
    badgeClass:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-300/30 dark:bg-amber-400/10 dark:text-amber-100',
    cardClass:
      'border-amber-200/70 bg-gradient-to-br from-amber-50 to-orange-50 dark:border-amber-300/25 dark:from-amber-400/10 dark:to-orange-400/10',
    barClass: 'from-amber-500 to-orange-500',
  },
  HIGH: {
    label: 'HIGH RISK',
    summary:
      'This resume is high risk for early attrition. Hire only with mitigation plan.',
    Icon: TriangleAlert,
    badgeClass:
      'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-300/30 dark:bg-rose-400/10 dark:text-rose-100',
    cardClass:
      'border-rose-200/70 bg-gradient-to-br from-rose-50 to-red-50 dark:border-rose-300/25 dark:from-rose-400/10 dark:to-red-400/10',
    barClass: 'from-rose-500 to-red-500',
  },
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function normalizeRiskBand(rawBand, attritionProbability) {
  const normalized = String(rawBand || '')
    .trim()
    .toUpperCase()

  if (normalized === 'LOW' || normalized === 'MEDIUM' || normalized === 'HIGH') {
    return normalized
  }

  if (attritionProbability < 0.35) {
    return 'LOW'
  }
  if (attritionProbability <= 0.65) {
    return 'MEDIUM'
  }
  return 'HIGH'
}

function formatPercent(value) {
  return `${(value * 100).toFixed(1)}%`
}

function formatMetricValue(item) {
  if (item.key === 'NumCompaniesWorked') {
    return `${Math.max(1, Math.round(item.value))} companies`
  }

  return Number.isInteger(item.value) ? `${item.value} yrs` : `${item.value.toFixed(1)} yrs`
}

function sourceText(source) {
  if (source === 'inferred') {
    return 'Inferred from CV'
  }
  if (source === 'defaulted') {
    return 'Default fallback'
  }
  return 'Provided profile value'
}

function buildEmploymentHistoryData(payload) {
  const metrics = Array.isArray(payload?.metrics) ? payload.metrics : []

  const items = metrics
    .map((metric) => ({
      key: String(metric?.key || ''),
      label: String(metric?.label || metric?.key || ''),
      value: Number(metric?.value),
      source: String(metric?.source || 'provided').toLowerCase(),
    }))
    .filter((metric) => metric.key && Number.isFinite(metric.value) && metric.value >= 0)
    .map((metric) => ({
      ...metric,
      Icon: employmentIconMap[metric.key] || ChartNoAxesColumn,
    }))

  return {
    items,
    chartMax: Math.max(...items.map((item) => item.value), 1),
  }
}

function buildHiringSummary(result) {
  const attritionProbability = clamp(
    Number(result?.attrition_probability ?? 0),
    0,
    1,
  )
  const retentionProbability = clamp(
    Number(result?.retention_probability ?? 1 - attritionProbability),
    0,
    1,
  )
  const riskBand = normalizeRiskBand(result?.risk_band, attritionProbability)
  const hiringSafetyScore = Number((retentionProbability * 10).toFixed(1))
  const attritionRiskScore = Number(
    (
      Number(result?.attrition_risk_score_0_100 ?? attritionProbability * 100) || 0
    ).toFixed(1),
  )

  const recommendation =
    riskBand === 'LOW'
      ? 'Good to hire'
      : riskBand === 'MEDIUM'
        ? 'Interview deeper before decision'
        : 'Do not hire without strong mitigation'

  const employment = buildEmploymentHistoryData(result?.employment_history)

  return {
    riskBand,
    attritionProbability,
    retentionProbability,
    hiringSafetyScore,
    attritionRiskScore,
    recommendation,
    employment,
  }
}

function HiringRiskDashboard({ state, output, errorMessage, onCopy, onExport }) {
  const summary = output ? buildHiringSummary(output) : null
  const theme = riskThemeByBand[summary?.riskBand || 'MEDIUM']
  const RiskIcon = theme.Icon

  return (
    <motion.section variants={fadeInUp} className="surface-card p-5" whileHover={{ y: -2 }}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
            <Gauge className="h-4.5 w-4.5" />
          </span>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Hiring Risk Summary</h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCopy}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-slate-900 dark:text-white/80 dark:hover:border-cyan-200/40 dark:hover:text-cyan-100"
            disabled={state !== 'success'}
          >
            <Copy className="h-3.5 w-3.5" />
            Copy
          </button>
          <button
            type="button"
            onClick={onExport}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-slate-900 dark:text-white/80 dark:hover:border-cyan-200/40 dark:hover:text-cyan-100"
            disabled={state !== 'success'}
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
        </div>
      </div>

      <div className="mt-4 min-h-[360px] rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/80">
        {state === 'idle' ? (
          <p className="text-sm text-slate-500 dark:text-white/60">
            Upload a CV and run prediction to view the complete risk dashboard.
          </p>
        ) : null}

        {state === 'loading' ? (
          <p className="flex items-center gap-2 text-sm text-cyan-700 dark:text-cyan-100">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Scoring hiring risk...
          </p>
        ) : null}

        {state === 'error' ? (
          <p className="flex items-center gap-2 text-sm text-red-600 dark:text-red-300">
            <TriangleAlert className="h-4 w-4" />
            {errorMessage || 'Unable to score this resume right now.'}
          </p>
        ) : null}

        {state === 'success' && summary ? (
          <div className="space-y-4">
            <div className={`rounded-xl border p-4 ${theme.cardClass}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <p className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${theme.badgeClass}`}>
                    <RiskIcon className="h-3.5 w-3.5" />
                    {theme.label}
                  </p>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    {theme.summary}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-white/70">
                    Recommendation: <strong>{summary.recommendation}</strong>
                  </p>
                </div>

                <div className="w-full max-w-[220px] rounded-xl border border-slate-200 bg-white/80 p-3 dark:border-white/15 dark:bg-slate-900/60">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-white/60">
                    Hire Safety Score (0-10)
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
                    {summary.hiringSafetyScore.toFixed(1)}
                    <span className="text-sm text-slate-500 dark:text-white/60"> / 10</span>
                  </p>
                  <div className="mt-2 h-2 rounded-full bg-slate-200 dark:bg-white/10">
                    <div
                      className={`h-2 rounded-full bg-gradient-to-r ${theme.barClass}`}
                      style={{ width: `${summary.hiringSafetyScore * 10}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-900">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-white/60">
                  Attrition Probability
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                  {formatPercent(summary.attritionProbability)}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-900">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-white/60">
                  Retention Probability
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                  {formatPercent(summary.retentionProbability)}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-900">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-white/60">
                  Attrition Risk Score
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                  {summary.attritionRiskScore.toFixed(1)} / 100
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-900">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-white/60">
                  Decision
                </p>
                <p className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-slate-900 dark:text-white">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  {summary.recommendation}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-white/60">
                <ChartNoAxesColumn className="h-4 w-4" />
                Employment History (Auto from CV)
              </p>

              {summary.employment.items.length === 0 ? (
                <p className="mt-3 text-sm text-slate-600 dark:text-white/70">
                  Employment timeline could not be inferred from this CV.
                </p>
              ) : (
                <div className="mt-3 space-y-3">
                  {summary.employment.items.map((item, index) => {
                    const width = clamp(
                      (item.value / summary.employment.chartMax) * 100,
                      4,
                      100,
                    )
                    const itemGradient =
                      index % 2 === 0
                        ? 'from-cyan-500 to-blue-500'
                        : 'from-emerald-500 to-teal-500'

                    return (
                      <div key={item.key} className="rounded-lg border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-950/70">
                        <div className="flex items-center justify-between gap-2">
                          <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-white/85">
                            <item.Icon className="h-4 w-4 text-cyan-600 dark:text-cyan-200" />
                            {item.label}
                          </p>
                          <p className="text-xs font-semibold text-slate-700 dark:text-white/80">
                            {formatMetricValue(item)}
                          </p>
                        </div>

                        <div className="mt-2 h-2 rounded-full bg-slate-200 dark:bg-white/10">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${width}%` }}
                            transition={{ duration: 0.6, delay: index * 0.08 }}
                            className={`h-2 rounded-full bg-gradient-to-r ${itemGradient}`}
                          />
                        </div>

                        <p className="mt-2 text-[11px] text-slate-500 dark:text-white/55">
                          {sourceText(item.source)}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-white/60">
                Top Risk Factors
              </p>

              {Array.isArray(output?.top_factors) && output.top_factors.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {output.top_factors.map((factor, index) => (
                    <div key={`${factor.name}-${index}`} className="rounded-lg border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-950/70">
                      <p className="text-sm font-semibold text-slate-800 dark:text-white/90">
                        {factor.name}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-white/70">
                        {factor.effect}: {factor.note}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-600 dark:text-white/70">
                  No major drivers were returned for this candidate.
                </p>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </motion.section>
  )
}

export default function RecruitmentAnalyticsPage() {
  const {
    sharedCvFile,
    sharedCvCacheId,
    cacheSharedCvFile,
  } = useSharedCv()
  const [state, setState] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [output, setOutput] = useState(null)
  const [cvFile, setCvFile] = useState(null)
  const activeCvFile = cvFile || sharedCvFile || null

  async function handleSubmit(event) {
    event.preventDefault()
    setState('loading')
    setErrorMessage('')
    setOutput(null)

    try {
      const fileToScore = activeCvFile
      const result = await requestAttritionRisk(fileToScore, sharedCvCacheId)
      if (fileToScore instanceof File) {
        await cacheSharedCvFile(fileToScore)
      }
      setOutput(result)
      setState('success')
    } catch (error) {
      setState('error')
      setErrorMessage(error.message)
    }
  }

  return (
    <ModulePageLayout
      title="Hiring Risk & Early Attrition Prediction"
      description="Upload a CV and get a direct hiring risk verdict with safety score and auto-inferred employment chart."
      icon={Activity}
      tone="blue"
    >
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid gap-4 lg:grid-cols-2"
      >
        <motion.section variants={fadeInUp} className="surface-card p-5" whileHover={{ y: -2 }}>
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 text-white">
              <FileUp className="h-4.5 w-4.5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Candidate CV Input</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-white/70">
                Upload CV only. Employment history chart is auto-extracted from CV text.
              </p>
            </div>
          </div>

          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-slate-700 dark:text-white/85">
              CV File (PDF/DOCX/TXT)
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                className={`${fieldBaseClass} file:mr-3 file:rounded-lg file:border-0 file:bg-gradient-to-r file:from-cyan-500 file:to-emerald-500 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white dark:file:from-cyan-400 dark:file:to-emerald-400`}
                onChange={async (event) => {
                  const file = event.target.files?.[0] || null
                  setCvFile(file)
                  if (file) {
                    try {
                      await cacheSharedCvFile(file)
                    } catch {
                      // Error is surfaced by request flow and shared context.
                    }
                  }
                }}
              />
              {activeCvFile ? (
                <p className="mt-1 text-xs text-cyan-700 dark:text-cyan-200">
                  Using CV: {activeCvFile.name}
                </p>
              ) : null}
              {!activeCvFile && sharedCvCacheId ? (
                <p className="mt-1 text-xs text-cyan-700 dark:text-cyan-200">
                  Using cached CV ID: {sharedCvCacheId.slice(0, 8)}
                </p>
              ) : null}
            </label>

            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(6,182,212,0.25)] transition hover:from-cyan-400 hover:to-emerald-400"
            >
              Predict Hiring Risk
            </motion.button>
          </form>
        </motion.section>

        <HiringRiskDashboard
          state={state}
          output={output}
          errorMessage={errorMessage}
          onCopy={() => output && copyJson(output)}
          onExport={() => output && downloadJson('attrition-risk-output.json', output)}
        />
      </motion.div>
    </ModulePageLayout>
  )
}
