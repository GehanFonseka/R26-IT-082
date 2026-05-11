export const landingContent = {
  header: {
    brandText: 'AI Recruitment Intelligence System',
    tagline: 'ML + NLP powered recruitment insights',
    repoHref: 'https://github.com/your-repo-link',
    navLinks: [
      { label: 'Home', href: '#home' },
      { label: 'Modules', href: '#modules' },
      { label: 'How', href: '#how' },
      { label: 'About', href: '#about' },
      { label: 'Contact', href: '#contact' },
    ],
  },
  hero: {
    headline: 'Recruitment, simplified with AI.',
    subheadline:
      'Run a complete hiring lifecycle with ATS workflow automation plus AI parsing, matching, interview scoring, and risk analytics.',
    ctaPrimary: { label: 'View Modules', href: '#modules' },
    ctaSecondary: { label: 'How it works', href: '#how' },
    visual: {
      lines: [
        'Resume -> Structured profile',
        'Job -> Requirements map',
        'Matching model -> Explainable fit scoring',
        'Dashboard -> Insights + exports',
      ],
    },
  },
  modules: {
    title: 'Core Modules',
    subtitle: 'Each module focuses on one high-impact step in recruitment intelligence.',
    cards: [
      {
        title: 'Full Hiring Cycle Workspace',
        description: 'Execute end-to-end ATS flow: vacancy, apply, shortlist, interview, final decision, and admin reports.',
        highlights: ['Role-based flows', 'Pipeline status tracking', 'Recruiter + admin dashboards'],
        ctaLabel: 'Open Full Cycle',
        to: '/full-hiring-cycle',
        icon: 'Workflow',
      },
      {
        title: 'Resume Parsing',
        description: 'Extract skills, education, entities, and candidate metadata from CV text.',
        highlights: ['NER extraction', 'Skills detection', 'Profile normalization'],
        ctaLabel: 'Try Parser',
        to: '/resume-parser',
        icon: 'FileText',
      },
      {
        title: 'Job Matching + Explainability',
        description: 'Rank jobs for a CV and rank candidates for a job with transparent similarity explanations.',
        highlights: ['CV -> Jobs ranking', 'Job -> Candidates ranking', 'Matched/missing signals'],
        ctaLabel: 'Run Matching',
        to: '/job-candidate-matching',
        icon: 'Shield',
      },
      {
        title: 'Interview Soft-Skill Evaluation',
        description: 'Evaluate interview answer quality from text with communication and confidence scoring.',
        highlights: ['Text-based scoring', 'Soft-skill breakdown', 'Hire recommendation'],
        ctaLabel: 'Evaluate Answers',
        to: '/interview-soft-skills',
        icon: 'MessageSquareText',
      },
      {
        title: 'Hiring Risk & Attrition',
        description: 'Estimate early attrition probability from uploaded CVs with explainable risk signals.',
        highlights: ['CV-based scoring', 'Risk bands', 'Default/inference trace'],
        ctaLabel: 'Open Predictor',
        to: '/recruitment-analytics',
        icon: 'BarChart3',
      },
    ],
  },
  how: {
    title: 'How it works',
    steps: [
      {
        n: 1,
        title: 'Input Data',
        text: 'Provide resumes and job descriptions in text or JSON format.',
      },
      {
        n: 2,
        title: 'Model Processing',
        text: 'Module-specific logic extracts structure, computes scores, and generates explainable recommendations.',
      },
      {
        n: 3,
        title: 'Review Outputs',
        text: 'Inspect card-based results and export JSON artifacts for downstream usage.',
      },
    ],
  },
  about: {
    title: 'About',
    text: 'An academic system designed to improve recruitment quality with transparent ML outputs and explainable AI recommendations.',
  },
  contact: {
    title: 'Contact',
    methods: [
      { type: 'email', label: 'Email', value: 'your-email@example.com' },
      {
        type: 'github',
        label: 'Repository',
        value: 'https://github.com/your-repo-link',
      },
    ],
  },
  footer: {
    brandText: 'AI Recruitment Intelligence System',
    links: [
      { label: 'Home', href: '#home' },
      { label: 'Modules', href: '#modules' },
      { label: 'How', href: '#how' },
      { label: 'Contact', href: '#contact' },
    ],
    copyright: '© 2026 AI Recruitment Intelligence System. All rights reserved.',
  },
}
