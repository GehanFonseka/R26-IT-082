import { motion } from 'framer-motion'
import {
  Bot,
  BriefcaseBusiness,
  Copy,
  Download,
  LoaderCircle,
  Sparkles,
  TriangleAlert,
  UserRoundSearch,
} from 'lucide-react'
import { useState } from 'react'
import ModulePageLayout from '../../shared/components/ModulePageLayout'
import { useSharedCv } from '../../shared/context/SharedCvContext'
import { fadeInUp, staggerContainer } from '../../shared/utils/motion'
import { copyJson, downloadJson, safeJsonParse } from '../../shared/utils/modelUtils'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

const fieldBaseClass =
  'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200/70 dark:border-white/10 dark:bg-slate-900 dark:text-white dark:focus:border-cyan-300 dark:focus:ring-cyan-400/25'

function normalizeTargetItem(item, index, fallbackPrefix) {
  if (typeof item === 'string') {
    const text = item.trim()
    if (!text) {
      return null
    }

    return {
      id: `${fallbackPrefix}_${index + 1}`,
      title: `${fallbackPrefix.toUpperCase()} ${index + 1}`,
      text,
    }
  }

  if (!item || typeof item !== 'object') {
    return null
  }

  const id =
    item.id ||
    item.job_id ||
    item.candidate_id ||
    `${fallbackPrefix}_${index + 1}`
  const title =
    item.title ||
    item.job_title ||
    item.role ||
    item.name ||
    String(id)
  const text =
    item.text ||
    item.description ||
    item.requirements ||
    item.profile ||
    item.resume ||
    ''

  if (!String(text).trim()) {
    return null
  }

  return {
    id: String(id),
    title: String(title),
    text: String(text),
  }
}

function parseTargets(raw, label, fallbackPrefix) {
  const text = String(raw || '').trim()
  if (!text) {
    throw new Error(`${label} is required.`)
  }

  const parsed = safeJsonParse(text, null)
  if (Array.isArray(parsed)) {
    const items = parsed
      .map((item, index) => normalizeTargetItem(item, index, fallbackPrefix))
      .filter(Boolean)

    if (items.length === 0) {
      throw new Error(`${label} JSON has no valid entries.`)
    }

    return items
  }

  const chunks = text.split(/\n\s*\n+/).map((chunk) => chunk.trim()).filter(Boolean)
  if (chunks.length === 0) {
    throw new Error(`${label} has no valid entries.`)
  }

  return chunks.map((chunk, index) => {
    const lines = chunk.split('\n').map((line) => line.trim()).filter(Boolean)
    const firstLine = lines[0] || `${fallbackPrefix.toUpperCase()} ${index + 1}`
    const title = firstLine.replace(/^title\s*:\s*/i, '')
    return {
      id: `${fallbackPrefix}_${index + 1}`,
      title,
      text: chunk,
    }
  })
}

async function requestCachedCvText(cvCacheId) {
  const response = await fetch(`${API_BASE_URL}/api/v1/cv-cache/${cvCacheId}/text`)
  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      payload?.detail?.error ||
      payload?.error ||
      payload?.detail ||
      `Failed to read cached CV (${response.status})`
    throw new Error(message)
  }

  return String(payload?.text || '')
}

async function requestMatching(payload) {
  const response = await fetch(`${API_BASE_URL}/api/v1/matching/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      body?.detail?.error ||
      body?.error ||
      body?.detail ||
      `Matching request failed (${response.status})`
    throw new Error(message)
  }

  return body
}

function modeLabel(mode) {
  return mode === 'cv_to_jobs' ? 'CV -> Jobs' : 'Job -> Candidates'
}

function scoreColor(score) {
  if (score >= 75) {
    return 'text-emerald-600 dark:text-emerald-300'
  }
  if (score >= 50) {
    return 'text-amber-600 dark:text-amber-300'
  }
  return 'text-rose-600 dark:text-rose-300'
}

export default function CandidateMatchingPage() {
  const { sharedCvFile, sharedCvCacheId } = useSharedCv()
  const [mode, setMode] = useState('cv_to_jobs')
  const [state, setState] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [output, setOutput] = useState(null)
  const [cvText, setCvText] = useState('')
  const [jobCatalog, setJobCatalog] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [candidateProfiles, setCandidateProfiles] = useState('')
  const [topK, setTopK] = useState(5)

  async function handleSubmit(event) {
    event.preventDefault()
    setState('loading')
    setErrorMessage('')
    setOutput(null)

    try {
      if (mode === 'cv_to_jobs') {
        let sourceText = cvText.trim()
        if (!sourceText && sharedCvCacheId) {
          sourceText = await requestCachedCvText(sharedCvCacheId)
        }
        if (!sourceText) {
          throw new Error('Add CV text or upload a shared CV first.')
        }

        const targets = parseTargets(jobCatalog, 'Job list', 'job')
        const result = await requestMatching({
          mode: 'cv_to_jobs',
          source_text: sourceText,
          targets,
          top_k: Number(topK) || 5,
        })
        setOutput(result)
      } else {
        const sourceText = jobDescription.trim()
        if (!sourceText) {
          throw new Error('Job description is required.')
        }

        const targets = parseTargets(candidateProfiles, 'Candidate profiles', 'candidate')
        const result = await requestMatching({
          mode: 'job_to_candidates',
          source_text: sourceText,
          targets,
          top_k: Number(topK) || 5,
        })
        setOutput(result)
      }

      setState('success')
    } catch (error) {
      setState('error')
      setErrorMessage(error.message)
    }
  }

  const recommendations = Array.isArray(output?.recommendations)
    ? output.recommendations
    : []

  return (
    <ModulePageLayout
      title="Job-Candidate Matching & Explainable AI"
      description="Compute similarity rankings and explain why a CV or candidate is recommended for a role."
      icon={Bot}
      tone="orange"
    >
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid gap-4 lg:grid-cols-2"
      >
        <motion.section variants={fadeInUp} className="surface-card p-5" whileHover={{ y: -2 }}>
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white">
              <Sparkles className="h-4.5 w-4.5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Matching Input</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-white/70">
                Run both directions: CV to jobs or job description to candidate ranking.
              </p>
            </div>
          </div>

          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-white/85">Mode</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {[
                  { id: 'cv_to_jobs', label: 'CV -> Jobs', Icon: BriefcaseBusiness },
                  { id: 'job_to_candidates', label: 'Job -> Candidates', Icon: UserRoundSearch },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMode(item.id)}
                    className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                      mode === item.id
                        ? 'border-cyan-300 bg-cyan-50 text-cyan-700 dark:border-cyan-300/35 dark:bg-cyan-400/10 dark:text-cyan-100'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-cyan-300 hover:text-cyan-700 dark:border-white/10 dark:bg-slate-900 dark:text-white/80 dark:hover:border-cyan-200/35 dark:hover:text-cyan-100'
                    }`}
                  >
                    <item.Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {mode === 'cv_to_jobs' ? (
              <>
                <label className="block text-sm font-medium text-slate-700 dark:text-white/85">
                  CV Text (optional if shared CV cache exists)
                  <textarea
                    value={cvText}
                    onChange={(event) => setCvText(event.target.value)}
                    rows={6}
                    placeholder="Paste CV text. If empty, engine tries shared CV cache."
                    className={fieldBaseClass}
                  />
                </label>

                <p className="text-xs text-slate-600 dark:text-white/65">
                  Shared CV: {sharedCvFile?.name || 'none'} | Cache ID: {sharedCvCacheId?.slice(0, 8) || 'not available'}
                </p>

                <label className="block text-sm font-medium text-slate-700 dark:text-white/85">
                  Job List (JSON array or text blocks)
                  <textarea
                    value={jobCatalog}
                    onChange={(event) => setJobCatalog(event.target.value)}
                    rows={9}
                    placeholder='[{"id":"J1","title":"Data Analyst","text":"SQL, Python, dashboards..."}]'
                    className={fieldBaseClass}
                  />
                </label>
              </>
            ) : (
              <>
                <label className="block text-sm font-medium text-slate-700 dark:text-white/85">
                  Job Description
                  <textarea
                    value={jobDescription}
                    onChange={(event) => setJobDescription(event.target.value)}
                    rows={6}
                    placeholder="Paste role requirements and responsibilities..."
                    className={fieldBaseClass}
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700 dark:text-white/85">
                  Candidate Profiles (JSON array or text blocks)
                  <textarea
                    value={candidateProfiles}
                    onChange={(event) => setCandidateProfiles(event.target.value)}
                    rows={9}
                    placeholder='[{"id":"C1","title":"Alice","text":"5 years python, SQL, NLP..."}]'
                    className={fieldBaseClass}
                  />
                </label>
              </>
            )}

            <label className="block text-sm font-medium text-slate-700 dark:text-white/85">
              Top K Results
              <input
                type="number"
                min={1}
                max={50}
                value={topK}
                onChange={(event) => setTopK(event.target.value)}
                className={fieldBaseClass}
              />
            </label>

            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(249,115,22,0.25)] transition hover:from-orange-400 hover:to-amber-400"
            >
              Run Matching Model
            </motion.button>
          </form>
        </motion.section>

        <motion.section variants={fadeInUp} className="surface-card p-5" whileHover={{ y: -2 }}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white">
                <Sparkles className="h-4.5 w-4.5" />
              </span>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Explainable Recommendations
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => output && copyJson(output)}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-slate-900 dark:text-white/80 dark:hover:border-cyan-200/40 dark:hover:text-cyan-100"
                disabled={state !== 'success'}
              >
                <Copy className="h-3.5 w-3.5" />
                Copy
              </button>
              <button
                type="button"
                onClick={() => output && downloadJson('model-0-matching-output.json', output)}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-slate-900 dark:text-white/80 dark:hover:border-cyan-200/40 dark:hover:text-cyan-100"
                disabled={state !== 'success'}
              >
                <Download className="h-3.5 w-3.5" />
                Export
              </button>
            </div>
          </div>

          <div className="mt-4 min-h-[420px] rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/80">
            {state === 'idle' ? (
              <p className="text-sm text-slate-500 dark:text-white/60">
                Run matching to see ranked recommendations and explainability signals.
              </p>
            ) : null}

            {state === 'loading' ? (
              <p className="flex items-center gap-2 text-sm text-cyan-700 dark:text-cyan-100">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Running {modeLabel(mode)} engine...
              </p>
            ) : null}

            {state === 'error' ? (
              <p className="flex items-center gap-2 text-sm text-red-600 dark:text-red-300">
                <TriangleAlert className="h-4 w-4" />
                {errorMessage || 'Unable to run matching right now.'}
              </p>
            ) : null}

            {state === 'success' ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-orange-200/70 bg-gradient-to-br from-orange-50 to-amber-50 p-4 dark:border-orange-300/25 dark:from-orange-400/10 dark:to-amber-400/10">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{output?.summary}</p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-white/70">
                    Mode: {modeLabel(output?.mode)} | Source chars: {output?.source_text_char_count}
                  </p>
                </div>

                {recommendations.length === 0 ? (
                  <p className="text-sm text-slate-600 dark:text-white/70">
                    No recommendations were generated.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recommendations.map((item) => (
                      <div
                        key={`${item.target_id}-${item.rank}`}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-900"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            #{item.rank} {item.target_title}
                          </p>
                          <p className={`text-sm font-semibold ${scoreColor(Number(item.score_0_100 || 0))}`}>
                            {Number(item.score_0_100 || 0).toFixed(1)} / 100 ({item.match_band})
                          </p>
                        </div>

                        <p className="mt-2 text-xs text-slate-600 dark:text-white/70">{item.explanation}</p>

                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-700 dark:text-emerald-200">
                              Matched Signals
                            </p>
                            <p className="mt-1 text-xs text-slate-700 dark:text-white/80">
                              {(item.matched_keywords || []).slice(0, 6).join(', ') || 'None'}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-rose-700 dark:text-rose-200">
                              Missing Signals
                            </p>
                            <p className="mt-1 text-xs text-slate-700 dark:text-white/80">
                              {(item.missing_keywords || []).slice(0, 6).join(', ') || 'None'}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {Object.entries(item.breakdown || {}).map(([key, value]) => (
                            <div key={key} className="rounded-lg border border-slate-200 bg-white p-2 dark:border-white/10 dark:bg-slate-950/70">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-white/60">
                                {key.replaceAll('_', ' ')}
                              </p>
                              <p className="mt-1 text-xs font-semibold text-slate-800 dark:text-white/85">
                                {Number(value || 0).toFixed(1)}%
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </motion.section>
      </motion.div>
    </ModulePageLayout>
  )
}
