export const skillCatalog = [
  ["Java", "java"], ["Python", "python"], ["JavaScript", "javascript", "js"], ["TypeScript", "typescript", "ts"],
  ["React", "react", "reactjs"], ["Node.js", "node.js", "nodejs", "node js"], ["Express.js", "express", "express.js"],
  ["HTML", "html", "html5"], ["CSS", "css", "css3"], ["REST APIs", "rest api", "rest apis"], ["GraphQL", "graphql"],
  ["SQL", "sql"], ["MongoDB", "mongodb", "mongo"], ["PostgreSQL", "postgresql", "postgres"], ["MySQL", "mysql"],
  ["Docker", "docker"], ["Kubernetes", "kubernetes", "k8s"], ["AWS", "aws", "amazon web services"], ["Azure", "azure"],
  ["Git", "git", "github", "gitlab"], ["CI/CD", "ci/cd", "continuous integration"], ["Machine Learning", "machine learning", "ml"],
  ["NLP", "natural language processing", "nlp"], ["TensorFlow", "tensorflow"], ["PyTorch", "pytorch"], ["Figma", "figma"],
  ["Testing", "testing", "jest", "cypress", "selenium"], ["Agile", "agile", "scrum"], ["Linux", "linux"], ["C++", "c++"],
];

export const skillPattern = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export const findSkill = (text, item) => item.slice(1).some((alias) => new RegExp(`(?:^|[^a-z0-9])${skillPattern(alias)}(?=$|[^a-z0-9])`, "i").test(text));
export const countSkillOccurrences = (text, item) => item.slice(1).reduce((total, alias) => total + ((String(text).match(new RegExp(`(?:^|[^a-z0-9])${skillPattern(alias)}(?=$|[^a-z0-9])`, "gi")) || []).length), 0);
export const canonicalSkill = (value) => {
  const needle = String(value || "").toLowerCase();
  return skillCatalog.find((item) => item.slice(1).some((alias) => alias === needle || needle.includes(alias)))?.[0] || String(value || "").trim();
};
