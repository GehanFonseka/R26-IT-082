export const demoCandidate = {
  id: "EMP-2048",
  name: "Alicia Morgan",
  initials: "AM",
  role: "Senior Product Designer",
  department: "Product & Design",
  location: "Austin, Texas",
  email: "alicia.morgan@northstar.io",
  phone: "+1 (512) 555-0187",
  status: "Active employee",
  manager: "Jordan Lee",
  joinedDate: "2022-05-16",
  lastReviewDate: "2025-11-08",
  lastPromotionDate: "2024-12-02",
  compensation: {
    current: 104000,
    market: 118000,
    currency: "USD",
  },
  engagement: {
    satisfaction: 0.56,
    careerGrowth: 0.42,
    workload: 0.82,
    managerSatisfaction: 0.61,
    remotePreference: "hybrid",
    currentWorkModel: "remote",
    absencesLastQuarter: 3,
  },
  history: [
    { year: "2022", role: "Product Designer", company: "Northstar", duration: "1 yr 7 mos" },
    { year: "2024", role: "Senior Product Designer", company: "Northstar", duration: "1 yr 8 mos" },
  ],
  profile: {
    skills: ["Product strategy", "Design systems", "User research", "Figma"],
    reports: 0,
  },
};

export const defaultSimulation = {
  salaryAdjustment: 0,
  roleChange: false,
  managerChange: false,
  remoteWork: false,
};
