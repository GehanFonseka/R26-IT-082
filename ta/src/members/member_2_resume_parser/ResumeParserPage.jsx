import { motion } from 'framer-motion'
import { FileSearch, ListChecks, ScanSearch } from 'lucide-react'
import { useState } from 'react'
import MinimalInputCard from '../../shared/components/MinimalInputCard'
import MinimalOutputCard from '../../shared/components/MinimalOutputCard'
import ModulePageLayout from '../../shared/components/ModulePageLayout'
import { useSharedCv } from '../../shared/context/SharedCvContext'
import { staggerContainer } from '../../shared/utils/motion'
import { copyJson, downloadJson, mockDelay } from '../../shared/utils/modelUtils'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

const skillDictionary = [
  'react',
  'node',
  'python',
  'java',
  'sql',
  'mysql',
  'postgresql',
  'nlp',
  'machine',
  'learning',
  'machine learning',
  'fastapi',
  'spring',
  'tailwind',
  'aws',
  'docker',
  'kubernetes',
  'typescript',
  'data analysis',
  'leadership',
  'communication',
]

function parseResume(resumeText, resumeFileName) {
  const normalizedText = resumeText.trim()

  if (!normalizedText && !resumeFileName) {
    throw new Error('Provide resume text or upload/select a shared resume file before parsing.')
  }

  const emailMatch = normalizedText.match(/[\w.-]+@[\w.-]+\.[A-Za-z]{2,}/)
  const phoneMatch = normalizedText.match(/\+?[\d\s()-]{8,}/)
  const firstLine = normalizedText.split('\n').find((line) => line.trim()) || 'Unknown Candidate'

  const detectedSkills = skillDictionary.filter((skill) =>
    normalizedText.toLowerCase().includes(skill),
  )
  const lines = normalizedText.split('\n').map((line) => line.trim()).filter(Boolean)
  const words = normalizedText.match(/[A-Za-z][A-Za-z0-9+#.-]{1,}/g) || []
  const lowered = normalizedText.toLowerCase()
  const sectionSignals = {
    experience: (lowered.match(/\b(experience|employment|work history|projects)\b/g) || []).length,
    education: (lowered.match(/\b(education|degree|university|college|school)\b/g) || []).length,
    skills: (lowered.match(/\b(skills|technical skills|tools|technologies)\b/g) || []).length,
    certifications: (lowered.match(/\b(certifications?|licenses?|courses?)\b/g) || []).length,
  }
  const detectedSectionCount = Object.values(sectionSignals).filter((value) => value > 0).length
  const skillEvidence = detectedSkills.slice(0, 8).map((skill) => {
    const index = lowered.indexOf(skill)
    const start = Math.max(0, index - 55)
    const end = Math.min(normalizedText.length, index + skill.length + 75)
    return {
      skill,
      evidence: index >= 0 ? normalizedText.slice(start, end).replace(/\s+/g, ' ').trim() : '',
    }
  })
  const completeness = {
    name: Boolean(firstLine && firstLine !== 'Unknown Candidate'),
    email: Boolean(emailMatch),
    phone: Boolean(phoneMatch),
    skills: detectedSkills.length > 0,
    experience_signal: sectionSignals.experience > 0,
    education_signal: sectionSignals.education > 0,
  }
  const completenessScore =
    (Object.values(completeness).filter(Boolean).length / Object.keys(completeness).length) * 100

  const entities = [
    { text: firstLine, label: 'NAME', confidence: 0.93 },
    ...(emailMatch
      ? [{ text: emailMatch[0], label: 'EMAIL', confidence: 0.98 }]
      : []),
    ...(phoneMatch
      ? [{ text: phoneMatch[0].trim(), label: 'PHONE', confidence: 0.9 }]
      : []),
    ...detectedSkills.map((skill) => ({
      text: skill,
      label: 'SKILL',
      confidence: 0.86,
    })),
  ]

  return {
    structuredProfile: {
      full_name: firstLine,
      email: emailMatch?.[0] || 'Not detected',
      phone: phoneMatch?.[0]?.trim() || 'Not detected',
      location: 'Not detected',
      skills: detectedSkills,
      education: [],
      experience: [],
      certifications: [],
      source_file: resumeFileName || 'text-input',
    },
    entities,
    explainable_ai: {
      extraction_stats: {
        text_char_count: normalizedText.length,
        word_count: words.length,
        line_count: lines.length,
        skill_count: detectedSkills.length,
        entity_count: entities.length,
        detected_section_count: detectedSectionCount,
        skill_density_per_100_words: Number(((detectedSkills.length / Math.max(words.length, 1)) * 100).toFixed(2)),
        contact_signal_count: Number(Boolean(emailMatch)) + Number(Boolean(phoneMatch)),
        completeness_score_0_100: Number(completenessScore.toFixed(2)),
      },
      completeness,
      section_signals: sectionSignals,
      skill_evidence: skillEvidence,
      explanation:
        'Resume parser detected contact fields, skill mentions, section headings, and profile completeness signals from the CV text.',
    },
  }
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

  return {
    text: String(payload?.text || ''),
    filename: String(payload?.filename || ''),
  }
}

export default function ResumeParserPage() {
  const {
    sharedCvFile,
    sharedCvCacheId,
    cacheSharedCvFile,
  } = useSharedCv()
  const [state, setState] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [output, setOutput] = useState(null)

  async function handleSubmit(values) {
    setState('loading')
    setErrorMessage('')

    try {
      await mockDelay()
      const inputFile = values.resumeFile instanceof File ? values.resumeFile : null
      let effectiveCacheId = sharedCvCacheId

      if (inputFile) {
        try {
          const payload = await cacheSharedCvFile(inputFile)
          effectiveCacheId = payload?.cv_cache_id || effectiveCacheId
        } catch {
          // Keep local parse flow working even if cache upload fails.
        }
      }

      let resumeText = String(values.resumeText || '')
      let cacheFilename = ''
      if (!resumeText.trim() && effectiveCacheId) {
        const cached = await requestCachedCvText(effectiveCacheId)
        resumeText = cached.text
        cacheFilename = cached.filename
      }

      const activeFile = inputFile || sharedCvFile || null
      const resolvedFileName = activeFile?.name || cacheFilename || ''
      const parsed = parseResume(resumeText, resolvedFileName)
      setOutput(parsed)
      setState('success')
    } catch (error) {
      setState('error')
      setErrorMessage(error.message)
    }
  }

  return (
    <ModulePageLayout
      title="Resume Parsing Module"
      description="Convert unstructured resumes into structured candidate profiles."
      icon={FileSearch}
      tone="cyan"
    >
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid gap-4 lg:grid-cols-2"
      >
        <MinimalInputCard
          title="Resume Input"
          helperText={`Paste text or upload a CV. Shared CV fallback: ${sharedCvFile?.name || 'none'} (auto-text from cache when available).`}
          icon={ScanSearch}
          fields={[
            {
              id: 'resumeText',
              label: 'Resume Text',
              type: 'textarea',
              placeholder: 'Paste resume content here...',
            },
            {
              id: 'resumeFile',
              label: 'Upload Resume (PDF/DOCX)',
              type: 'file',
              placeholder: '',
            },
          ]}
          action={{ label: 'Parse Resume' }}
          onSubmit={handleSubmit}
        />

        <MinimalOutputCard
          title="Parsed Output"
          icon={ListChecks}
          state={state}
          data={output}
          errorMessage={errorMessage}
          onCopy={() => output && copyJson(output)}
          onExport={() => output && downloadJson('resume-parser-output.json', output)}
        />
      </motion.div>

      {output?.explainable_ai ? (
        <div className="mt-4 rounded-xl border border-cyan-100 bg-white p-4 shadow-sm dark:border-cyan-300/20 dark:bg-slate-950/70">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Explainable Extraction</h2>
              <p className="mt-1 text-xs text-slate-600 dark:text-white/65">{output.explainable_ai.explanation}</p>
            </div>
            <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-800 dark:border-cyan-300/30 dark:bg-cyan-400/15 dark:text-cyan-100">
              {Number(output.explainable_ai.extraction_stats.completeness_score_0_100 || 0).toFixed(1)}% complete
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ['Words', output.explainable_ai.extraction_stats.word_count],
              ['Lines', output.explainable_ai.extraction_stats.line_count],
              ['Entities', output.explainable_ai.extraction_stats.entity_count],
              ['Skills', output.explainable_ai.extraction_stats.skill_count],
              ['Sections', output.explainable_ai.extraction_stats.detected_section_count],
              ['Skill Density', `${Number(output.explainable_ai.extraction_stats.skill_density_per_100_words || 0).toFixed(2)} / 100 words`],
              ['Contact Signals', output.explainable_ai.extraction_stats.contact_signal_count],
              ['Characters', output.explainable_ai.extraction_stats.text_char_count],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-slate-900">
                <p className="text-[10px] font-semibold uppercase text-slate-500 dark:text-white/45">{label}</p>
                <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{value || 0}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {Object.entries(output.explainable_ai.section_signals).some(([, value]) => Number(value) > 0) ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-900">
                <p className="text-xs font-semibold text-slate-900 dark:text-white">Section Signals</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {Object.entries(output.explainable_ai.section_signals)
                    .filter(([, value]) => Number(value) > 0)
                    .map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between rounded-md bg-white px-2 py-1 text-xs dark:bg-slate-950/70">
                        <span className="capitalize text-slate-600 dark:text-white/65">{key.replace('_', ' ')}</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{value}</span>
                      </div>
                    ))}
                </div>
              </div>
            ) : null}

            {output.explainable_ai.skill_evidence.length ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-900">
              <p className="text-xs font-semibold text-slate-900 dark:text-white">Skill Evidence</p>
              <div className="mt-2 space-y-2">
                {output.explainable_ai.skill_evidence.slice(0, 4).map((item) => (
                    <p key={`${item.skill}-${item.evidence}`} className="rounded-md bg-white px-2 py-1 text-xs text-slate-600 dark:bg-slate-950/70 dark:text-white/70">
                      <span className="font-semibold text-slate-900 dark:text-white">{item.skill}:</span> {item.evidence || 'Detected in CV text'}
                    </p>
                  ))}
              </div>
            </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </ModulePageLayout>
  )
}
