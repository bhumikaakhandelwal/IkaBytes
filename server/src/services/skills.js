// Skill helpers: normalising user input, parsing resumes, and detecting skills.
import fs from 'node:fs/promises';
import path from 'node:path';
import mammoth from 'mammoth';

const KNOWN_SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'Next.js', 'Vue', 'Angular', 'Node.js', 'Express', 'HTML', 'CSS', 'Tailwind', 'Bootstrap',
  'Python', 'Java', 'C', 'C++', 'C#', 'Golang', 'Rust', 'Kotlin', 'Swift', 'PHP', 'R',
  'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'SQLite', 'Firebase', 'Supabase',
  'Excel', 'Power BI', 'Tableau', 'Pandas', 'NumPy', 'Data Science', 'Data Analysis',
  'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'NLP', 'Computer Vision', 'OpenCV', 'Scikit-Learn',
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Linux', 'Git', 'GitHub', 'CI/CD', 'DevOps',
  'Networking', 'APIs', 'REST', 'GraphQL', 'Microservices',
  'Django', 'Flask', 'FastAPI', 'Spring', 'Spring Boot', 'Figma', 'Data Structures', 'Algorithms',
  'Cybersecurity', 'Cloud Computing',
];

// Different spellings of the same skill → one standard name.
// Keys are lower-case with spaces, dots and hyphens removed (see compact()).
const SKILL_ALIASES = {
  js: 'JavaScript', javascript: 'JavaScript', es6: 'JavaScript', ecmascript: 'JavaScript',
  ts: 'TypeScript', typescript: 'TypeScript',
  react: 'React', reactjs: 'React',
  nextjs: 'Next.js', next: 'Next.js',
  vue: 'Vue', vuejs: 'Vue',
  angular: 'Angular', angularjs: 'Angular',
  node: 'Node.js', nodejs: 'Node.js',
  express: 'Express', expressjs: 'Express',
  html: 'HTML', html5: 'HTML',
  css: 'CSS', css3: 'CSS',
  tailwind: 'Tailwind', tailwindcss: 'Tailwind',
  python: 'Python', python3: 'Python', py: 'Python',
  java: 'Java', cpp: 'C++', 'c++': 'C++', 'c#': 'C#', csharp: 'C#',
  go: 'Golang', golang: 'Golang',
  sql: 'SQL', mysql: 'MySQL', postgres: 'PostgreSQL', postgresql: 'PostgreSQL',
  mongo: 'MongoDB', mongodb: 'MongoDB',
  excel: 'Excel', msexcel: 'Excel', microsoftexcel: 'Excel',
  powerbi: 'Power BI',
  ml: 'Machine Learning', machinelearning: 'Machine Learning',
  dl: 'Deep Learning', deeplearning: 'Deep Learning',
  ai: 'Artificial Intelligence', artificialintelligence: 'Artificial Intelligence',
  nlp: 'NLP', naturallanguageprocessing: 'NLP',
  scikitlearn: 'Scikit-Learn', sklearn: 'Scikit-Learn',
  aws: 'AWS', amazonwebservices: 'AWS',
  gcp: 'GCP', googlecloud: 'GCP', googlecloudplatform: 'GCP',
  azure: 'Azure', microsoftazure: 'Azure',
  k8s: 'Kubernetes', kubernetes: 'Kubernetes',
  git: 'Git', github: 'GitHub',
  cicd: 'CI/CD', 'ci/cd': 'CI/CD',
  api: 'APIs', apis: 'APIs', restapi: 'REST', restapis: 'REST', rest: 'REST', restful: 'REST',
  dsa: 'Data Structures', datastructures: 'Data Structures',
  datastructuresandalgorithms: 'Data Structures',
  algorithms: 'Algorithms', algo: 'Algorithms',
  oop: 'OOP', oops: 'OOP', objectorientedprogramming: 'OOP',
  springboot: 'Spring Boot',
};

const compact = (s) => String(s).toLowerCase().replace(/[\s.\-_]+/g, '');

/** Standard display name for a skill, e.g. "nodejs" → "Node.js", "React.js" → "React". */
export function canonicalSkill(name) {
  const value = String(name ?? '').trim();
  if (!value) return '';
  return SKILL_ALIASES[compact(value)] || value;
}

/** Comparison key: two skills are "the same" when their keys are equal. */
export function skillKey(name) {
  return compact(canonicalSkill(name));
}

/** Cleans a skills list: standard names, no duplicates (by skillKey). */
export function normalizeSkills(input, { max = 50 } = {}) {
  const seen = new Set();
  const out = [];
  for (const raw of normalizeList(input, { max: max * 2 })) {
    const name = canonicalSkill(raw).slice(0, 60);
    const key = skillKey(name);
    if (key && !seen.has(key)) {
      seen.add(key);
      out.push(name);
    }
    if (out.length >= max) break;
  }
  return out;
}

/**
 * Returns a safe http(s) URL or '' — student-typed links are only made clickable
 * when they are real web addresses (blocks "javascript:" and similar).
 * "github.com/you/repo" becomes "https://github.com/you/repo".
 */
export function safeUrl(input) {
  let value = String(input ?? '').trim();
  if (!value) return '';
  if (!/^[a-z][a-z0-9+.-]*:/i.test(value)) value = `https://${value.replace(/^\/+/, '')}`;
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
    if (!url.hostname.includes('.')) return '';
    return url.toString();
  } catch {
    return '';
  }
}

/** Accepts "React, CSS" or ["React", " css "] and returns a de-duplicated, trimmed array. */
export function normalizeList(input, { max = 50 } = {}) {
  const raw = Array.isArray(input) ? input : String(input ?? '').split(',');
  const seen = new Set();
  const out = [];
  for (const item of raw) {
    const value = String(item).trim();
    const key = value.toLowerCase();
    if (value && !seen.has(key)) {
      seen.add(key);
      out.push(value.slice(0, 200));
    }
    if (out.length >= max) break;
  }
  return out;
}

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * True if `skill` is mentioned in `text` as a whole word.
 * Single-letter languages (C, R) are only counted when written in capitals next to a
 * word like "programming" or "language", so initials or "R." on a receipt don't count.
 */
export function mentionsSkill(text, skill) {
  if (!text || !skill) return false;
  const s = escape(skill);
  if (skill.length === 1) {
    const near = new RegExp(
      `(^|[^A-Za-z0-9+#])${s}\\s*(programming|language|lang\\b)|(programming|languages?)[^.\\n]{0,40}(^|[^A-Za-z0-9+#])${s}($|[^A-Za-z0-9+#])`,
      'i'
    );
    const exactCase = new RegExp(`(^|[^A-Za-z0-9+#])${s}($|[^A-Za-z0-9+#])`); // case-sensitive
    return exactCase.test(text) && near.test(text);
  }
  return new RegExp(`(^|[^a-z0-9+#])${escape(skill.toLowerCase())}($|[^a-z0-9+#])`, 'i').test(text);
}

/** Finds known skills mentioned in free text (e.g. from resume). */
export function extractSkillsFromText(text) {
  if (!text) return [];
  return KNOWN_SKILLS.filter((skill) => mentionsSkill(text, skill));
}

/** Extracts readable text from uploaded TXT, PDF, or DOCX files. */
export async function parseResumeText(filePath, originalName) {
  const ext = path.extname(originalName || filePath).toLowerCase();
  try {
    if (ext === '.txt') {
      return await fs.readFile(filePath, 'utf8');
    }
    if (ext === '.pdf') {
      const { PDFParse } = await import('pdf-parse');
      const buffer = await fs.readFile(filePath);
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      return typeof result === 'string' ? result : (result?.text || '');
    }
    if (ext === '.docx' || ext === '.doc') {
      const res = await mammoth.extractRawText({ path: filePath });
      return res.value || '';
    }
  } catch (err) {
    console.error(`Failed to parse resume text from ${originalName}:`, err.message);
  }
  return '';
}
