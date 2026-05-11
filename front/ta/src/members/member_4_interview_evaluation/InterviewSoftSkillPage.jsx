import { motion } from 'framer-motion'
import {
  CheckCircle2,
  Copy,
  Download,
  Gauge,
  LoaderCircle,
  MessageSquareText,
  ShieldAlert,
  TriangleAlert,
} from 'lucide-react'
import { useState } from 'react'
import MinimalInputCard from '../../shared/components/MinimalInputCard'
import ModulePageLayout from '../../shared/components/ModulePageLayout'
import { fadeInUp, staggerContainer } from '../../shared/utils/motion'
import { copyJson, downloadJson } from '../../shared/utils/modelUtils'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
const DEMO_HR = {
  email: 'hr@talentai.local',
  password: 'Recruiter123!',
}
const HR_TOKEN_KEY = 'talent_demo_hr_token'

const breakdownLabels = {
  communication_clarity: 'Communication Clarity',
  confidence_professionalism: 'Confidence & Professionalism',
  collaboration_team_orientation: 'Collaboration Orientation',
  problem_solving_structure: 'Problem-Solving Structure',
  relevance_to_question: 'Relevance To Question',
}

const bandTheme = {
  HIGH: {
    badgeClass:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-300/30 dark:bg-emerald-400/10 dark:text-emerald-100',
    cardClass:
      'border-emerald-200/70 bg-gradient-to-br from-emerald-50 to-cyan-50 dark:border-emerald-300/25 dark:from-emerald-400/10 dark:to-cyan-400/10',
  },
  MEDIUM: {
    badgeClass:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-300/30 dark:bg-amber-400/10 dark:text-amber-100',
    cardClass:
      'border-amber-200/70 bg-gradient-to-br from-amber-50 to-orange-50 dark:border-amber-300/25 dark:from-amber-400/10 dark:to-orange-400/10',
  },
  LOW: {
    badgeClass:
      'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-300/30 dark:bg-rose-400/10 dark:text-rose-100',
    cardClass:
      'border-rose-200/70 bg-gradient-to-br from-rose-50 to-red-50 dark:border-rose-300/25 dark:from-rose-400/10 dark:to-red-400/10',
  },
}

async function request(path, { method = 'GET', body, authToken = '' } = {}) {
  const headers = {}
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`
  }
  if (body) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      payload?.detail?.error ||
      payload?.error ||
      payload?.detail ||
      `Request failed with status ${response.status}`
    const error = new Error(message)
    error.status = response.status
    throw error
  }

  return payload
}

async function loginAsHr() {
  const payload = await request('/api/v1/auth/login', {
    method: 'POST',
    body: DEMO_HR,
  })
  const token = payload?.token || ''
  if (!token) {
    throw new Error('Unable to create HR demo session.')
  }
  window.localStorage.setItem(HR_TOKEN_KEY, token)
  return token
}

async function getHrToken(forceRefresh = false) {
  if (!forceRefresh) {
    const existing = window.localStorage.getItem(HR_TOKEN_KEY) || ''
    if (existing) {
      return existing
    }
  }
  return loginAsHr()
}

async function requestInterviewEvaluation(answerText, questionText, authToken) {
  const response = await fetch(`${API_BASE_URL}/api/v1/interview/evaluate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      answer_text: answerText,
      question_text: questionText || null,
    }),
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      payload?.detail?.error ||
      payload?.error ||
      payload?.detail ||
      `Request failed with status ${response.status}`
    const error = new Error(message)
    error.status = response.status
    throw error
  }

  return payload
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function InterviewOutputCard({ state, output, errorMessage, onCopy, onExport }) {
  const theme = bandTheme[output?.band] || bandTheme.MEDIUM

  return (
    <motion.section variants={fadeInUp} className="surface-card p-5" whileHover={{ y: -2 }}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
            <Gauge className="h-4.5 w-4.5" />
          </span>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Soft-Skill Evaluation</h2>
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

      <div className="mt-4 min-h-[330px] rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/80">
        {state === 'idle' ? (
          <p className="text-sm text-slate-500 dark:text-white/60">
            Submit an interview answer to evaluate communication and soft skills.
          </p>
        ) : null}

        {state === 'loading' ? (
          <p className="flex items-center gap-2 text-sm text-cyan-700 dark:text-cyan-100">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Evaluating answer...
          </p>
        ) : null}

        {state === 'error' ? (
          <p className="flex items-center gap-2 text-sm text-red-600 dark:text-red-300">
            <TriangleAlert className="h-4 w-4" />
            {errorMessage || 'Unable to evaluate this answer right now.'}
          </p>
        ) : null}

        {state === 'success' && output ? (
          <div className="space-y-4">
            <div className={`rounded-xl border p-4 ${theme.cardClass}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${theme.badgeClass}`}>
                    <ShieldAlert className="h-3.5 w-3.5" />
                    {output.band} CONFIDENCE
                  </p>
                  <p className="mt-2 text-sm text-slate-700 dark:text-white/80">{output.summary}</p>
                  <p className="mt-2 text-xs text-slate-600 dark:text-white/65">
                    Model: {output.model} ({output.model_source})
                  </p>
                </div>

                <div className="w-full max-w-[220px] rounded-xl border border-slate-200 bg-white/80 p-3 dark:border-white/15 dark:bg-slate-900/60">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-white/60">
                    Hire Score (0-10)
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
                    {Number(output.hire_recommendation_score_0_10 || 0).toFixed(1)}
                    <span className="text-sm text-slate-500 dark:text-white/60"> / 10</span>
                  </p>
                  <div className="mt-2 h-2 rounded-full bg-slate-200 dark:bg-white/10">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                      style={{ width: `${clamp(Number(output.hire_recommendation_score_0_10 || 0) * 10, 0, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-900">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-white/60">
                  Overall Score
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                  {Number(output.overall_score_0_100 || 0).toFixed(1)} / 100
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-900">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-white/60">
                  Confidence
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                  {Number(output.confidence || 0).toFixed(1)}%
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-900">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-white/60">
                  Predicted Label
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{output.predicted_label}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-900">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-white/60">
                  Word Count
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{output.answer_word_count}</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-white/60">
                Soft-Skill Breakdown
              </p>
              <div className="mt-3 space-y-3">
                {Object.entries(output.soft_skill_breakdown || {}).map(([key, value], index) => {
                  const label = breakdownLabels[key] || key
                  const score = Number(value || 0)
                  const gradient = index % 2 === 0 ? 'from-cyan-500 to-blue-500' : 'from-emerald-500 to-teal-500'

                  return (
                    <div key={key} className="rounded-lg border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-950/70">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-slate-800 dark:text-white/85">{label}</p>
                        <p className="text-xs font-semibold text-slate-700 dark:text-white/80">{score.toFixed(1)}</p>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-slate-200 dark:bg-white/10">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${clamp(score, 0, 100)}%` }}
                          transition={{ duration: 0.6, delay: index * 0.08 }}
                          className={`h-2 rounded-full bg-gradient-to-r ${gradient}`}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-900">
                <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700 dark:text-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Strengths
                </p>
                <ul className="mt-2 space-y-1 text-xs text-slate-700 dark:text-white/80">
                  {(output.strengths || []).map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-900">
                <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.08em] text-rose-700 dark:text-rose-200">
                  <TriangleAlert className="h-3.5 w-3.5" />
                  Concerns
                </p>
                <ul className="mt-2 space-y-1 text-xs text-slate-700 dark:text-white/80">
                  {(output.concerns || []).map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-900">
                <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.08em] text-cyan-700 dark:text-cyan-200">
                  <MessageSquareText className="h-3.5 w-3.5" />
                  Suggestions
                </p>
                <ul className="mt-2 space-y-1 text-xs text-slate-700 dark:text-white/80">
                  {(output.suggestions || []).map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </motion.section>
  )
}

export default function InterviewSoftSkillPage() {
  const [state, setState] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [output, setOutput] = useState(null)

  async function handleSubmit(values) {
    setState('loading')
    setErrorMessage('')
    setOutput(null)

    try {
      let token = await getHrToken()
      let result
      try {
        result = await requestInterviewEvaluation(
          values.answerText,
          values.questionText,
          token,
        )
      } catch (error) {
        if (error?.status !== 401) {
          throw error
        }
        token = await getHrToken(true)
        result = await requestInterviewEvaluation(
          values.answerText,
          values.questionText,
          token,
        )
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
      title="Interview Answer & Soft-Skill Evaluation"
      description="Evaluate answer quality from text with model-backed scoring and recommendations."
      icon={MessageSquareText}
      tone="emerald"
    >
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid gap-4 lg:grid-cols-2"
      >
        <MinimalInputCard
          title="Interview Text Input"
          helperText="Paste candidate answer text. Add question context for relevance scoring."
          icon={MessageSquareText}
          fields={[
            {
              id: 'questionText',
              label: 'Interview Question (optional)',
              type: 'textarea',
              placeholder: 'Tell me about a time you resolved a team conflict...',
            },
            {
              id: 'answerText',
              label: 'Candidate Answer Text',
              type: 'textarea',
              placeholder: 'Paste the full interview answer here...',
            },
          ]}
          action={{ label: 'Evaluate Answer' }}
          onSubmit={handleSubmit}
        />

        <InterviewOutputCard
          state={state}
          output={output}
          errorMessage={errorMessage}
          onCopy={() => output && copyJson(output)}
          onExport={() => output && downloadJson('interview-soft-skill-output.json', output)}
        />
      </motion.div>
    </ModulePageLayout>
  )
}
