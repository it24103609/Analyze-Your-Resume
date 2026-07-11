const express = require('express');
const multer = require('multer');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const WordExtractor = require('word-extractor');

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const PORT = process.env.PORT || 3000;
const extractor = new WordExtractor();

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'your', 'you', 'are', 'our', 'have', 'has', 'will', 'was', 'were', 'been', 'can', 'able', 'using', 'used', 'use', 'into', 'their', 'they', 'them', 'about', 'across', 'work', 'team', 'role', 'responsible', 'responsibility', 'responsibilities', 'job', 'description', 'apply', 'able', 'must', 'should', 'years', 'year', 'experience', 'skills', 'skill'
]);

const SECTION_KEYWORDS = {
  summary: ['summary', 'professional summary', 'profile', 'objective'],
  experience: ['experience', 'work experience', 'professional experience', 'employment history', 'career history'],
  education: ['education', 'academics', 'academic background'],
  skills: ['skills', 'technical skills', 'core competencies', 'tools'],
  projects: ['projects', 'project experience', 'selected projects'],
  contact: ['contact', 'contact information', 'personal details'],
  certifications: ['certifications', 'certification', 'licenses', 'licences'],
};

const TECH_SKILLS = [
  'javascript', 'typescript', 'react', 'node', 'express', 'python', 'java', 'c#', 'c++', 'html', 'css', 'sql', 'nosql', 'mongodb', 'postgresql', 'mysql', 'aws', 'azure', 'docker', 'kubernetes', 'git', 'testing', 'jest', 'cypress', 'playwright', 'graphql', 'rest api', 'api integration', 'accessibility', 'redux', 'next.js', 'vite', 'fastapi', 'django', 'flask', 'tailwind', 'figma', 'excel', 'power bi', 'tableau', 'linux', 'ci/cd'
];

const SOFT_SKILLS = [
  'communication', 'teamwork', 'leadership', 'problem solving', 'critical thinking', 'adaptability', 'collaboration', 'organization', 'time management', 'presentation', 'mentoring', 'ownership', 'decision making', 'analytical', 'stakeholder management'
];

const ACTION_VERBS = [
  'built', 'developed', 'designed', 'implemented', 'improved', 'led', 'managed', 'created', 'optimized', 'delivered', 'reduced', 'increased', 'automated', 'launched', 'owned', 'coordinated', 'achieved', 'generated', 'streamlined', 'supported', 'refactored', 'shipped', 'mentored'
];

const ATS_SIGNAL_WORDS = [
  'results', 'metrics', 'stakeholders', 'requirements', 'production', 'scalable', 'performance', 'security', 'quality', 'analytics', 'workflow', 'automation', 'customer', 'revenue', 'cost', 'growth', 'delivery', 'collaboration'
];

function parseSectionCandidates(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return lines.filter((line) => {
    const cleaned = line.replace(/[:\-–—]+$/, '').toLowerCase();
    return Object.values(SECTION_KEYWORDS).flat().some((keyword) => cleaned === keyword || cleaned.startsWith(keyword + ' '));
  });
}

function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9+.#/%\-\s]/g, ' ');
}

function tokenize(text) {
  return normalize(text)
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word && !STOP_WORDS.has(word) && word.length > 2);
}

function extractKeywordPhrases(text, limit = 40) {
  const words = tokenize(text);
  const phrases = [];
  for (let index = 0; index < words.length - 1; index += 1) {
    phrases.push(`${words[index]} ${words[index + 1]}`);
  }
  for (let index = 0; index < words.length - 2; index += 1) {
    phrases.push(`${words[index]} ${words[index + 1]} ${words[index + 2]}`);
  }
  const counts = new Map();
  [...words, ...phrases].forEach((keyword) => {
    counts.set(keyword, (counts.get(keyword) || 0) + 1);
  });
  return [...counts.entries()]
    .sort((a, b) => (b[1] * b[0].length) - (a[1] * a[0].length))
    .slice(0, limit)
    .map(([keyword]) => keyword);
}

function unique(list) {
  return [...new Set(list)];
}

function countSyllables(word) {
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!cleaned) return 0;
  if (cleaned.length <= 3) return 1;
  const vowels = cleaned.match(/[aeiouy]+/g);
  let count = vowels ? vowels.length : 1;
  if (cleaned.endsWith('e')) count -= 1;
  if (cleaned.endsWith('le') && cleaned.length > 2 && !/[aeiouy]/.test(cleaned[cleaned.length - 3])) count += 1;
  return Math.max(count, 1);
}

function computeFlesch(text) {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length || 1;
  const words = text.match(/\b\w+\b/g) || [];
  const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0);
  if (!words.length) return 0;
  return Number((206.835 - 1.015 * (words.length / sentences) - 84.6 * (syllables / words.length)).toFixed(1));
}

function getResumeTextPreview(text, maxLength = 1200) {
  const preview = text.replace(/\s+/g, ' ').trim();
  if (preview.length <= maxLength) return preview;
  return `${preview.slice(0, maxLength).trim()}...`;
}

function extractKeywords(text, limit = 32) {
  const counts = new Map();
  tokenize(text).forEach((word) => {
    counts.set(word, (counts.get(word) || 0) + 1);
  });
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([keyword]) => keyword);
}

function matchSkills(text) {
  const normalized = normalize(text);
  const matchedHard = TECH_SKILLS.filter((skill) => normalized.includes(skill.toLowerCase()));
  const matchedSoft = SOFT_SKILLS.filter((skill) => normalized.includes(skill.toLowerCase()));
  return { hard: unique(matchedHard), soft: unique(matchedSoft) };
}

function detectSections(text) {
  const normalizedLines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const found = new Set();
  const normalizedText = normalize(text);
  normalizedLines.forEach((line) => {
    const cleaned = line.toLowerCase().replace(/[:\-–—]+$/, '');
    Object.entries(SECTION_KEYWORDS).forEach(([key, keywords]) => {
      if (keywords.some((keyword) => cleaned === keyword || cleaned.startsWith(keyword + ' '))) {
        found.add(key);
      }
    });
  });
  if (extractEmail(text) || extractPhone(text)) found.add('contact');
  if (/\b(certified|certification|certificate|aws certified|azure fundamentals|scrum master|pmp)\b/i.test(text)) found.add('certifications');
  if (/\b(project|portfolio|github|case study)\b/i.test(normalizedText)) found.add('projects');
  return found;
}

function extractPhone(text) {
  const match = text.match(/(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{3}\)?[\s-]?)?\d{3}[\s-]?\d{4}/);
  return match ? match[0].trim() : null;
}

function extractEmail(text) {
  const match = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  return match ? match[0] : null;
}

function extractAchievements(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return lines.filter((line) => /\b\d+%|\$\d+|\b(increased|reduced|improved|grew|saved|cut|boosted|delivered|drove)\b/i.test(line));
}

function scoreKeywordCoverage(resumeText, jobKeywords) {
  const normalizedResume = normalize(resumeText);
  const matched = [];
  const missing = [];
  jobKeywords.forEach((keyword) => {
    if (normalizedResume.includes(keyword.toLowerCase())) {
      matched.push(keyword);
    } else {
      missing.push(keyword);
    }
  });
  const weightedMatches = matched.reduce((sum, keyword) => sum + (keyword.includes(' ') ? 1.4 : 1), 0);
  const weightedTotal = jobKeywords.reduce((sum, keyword) => sum + (keyword.includes(' ') ? 1.4 : 1), 0) || 1;
  return {
    matched,
    missing,
    score: Math.round((weightedMatches / weightedTotal) * 100),
  };
}

function scoreAtsSignals(text) {
  const normalizedText = normalize(text);
  const signalMatches = ATS_SIGNAL_WORDS.filter((word) => normalizedText.includes(word));
  return Math.min(100, Math.round(signalMatches.length * 8));
}

function summarizeSections(text, detectedSections, jobDescriptionText) {
  const resumeSkills = matchSkills(text);
  const resumeKeywords = extractKeywordPhrases(text, 46);
  const jobKeywords = jobDescriptionText ? extractKeywordPhrases(jobDescriptionText, 34) : [];
  const keywordCoverage = jobDescriptionText ? scoreKeywordCoverage(text, jobKeywords) : { matched: [], missing: [], score: 0 };
  const overlap = keywordCoverage.matched;
  const missing = keywordCoverage.missing;
  const readability = computeFlesch(text);
  const wordCount = tokenize(text).length;
  const bulletCount = (text.match(/(^|\n)\s*[-•*]/g) || []).length;
  const achievements = extractAchievements(text);
  const actionVerbCount = ACTION_VERBS.filter((verb) => normalize(text).includes(verb)).length;
  const atsSignalScore = scoreAtsSignals(text);
  const contactScore = extractEmail(text) && extractPhone(text) ? 100 : extractEmail(text) || extractPhone(text) ? 74 : 45;

  const requiredSections = ['summary', 'experience', 'education', 'skills', 'projects', 'contact', 'certifications'];
  const sectionScore = Math.round((detectedSections.size / requiredSections.length) * 100);
  const keywordScore = keywordCoverage.score;
  const skillScore = Math.min(100, Math.round((resumeSkills.hard.length * 6) + (resumeSkills.soft.length * 4)));
  const readabilityScore = Math.max(0, Math.min(100, Math.round(readability)));
  const achievementScore = Math.min(100, achievements.length * 20 + Math.min(actionVerbCount * 3, 30));
  const formattingScore = Math.max(55, Math.min(100, Math.round(45 + bulletCount * 4 + (wordCount > 250 ? 10 : 0) + (detectedSections.has('contact') ? 10 : 0))));

  const overallScore = Math.max(0, Math.min(100, Math.round(
    sectionScore * 0.18 +
    keywordScore * 0.24 +
    skillScore * 0.18 +
    readabilityScore * 0.14 +
    achievementScore * 0.12 +
    formattingScore * 0.08 +
    atsSignalScore * 0.06
  )));

  const scoreLabel = overallScore >= 80 ? 'Excellent' : overallScore >= 65 ? 'Good' : overallScore >= 50 ? 'Fair' : 'Needs Work';

  const missingSections = requiredSections.filter((section) => !detectedSections.has(section));

  const sectionCards = [
    { title: 'Contact Information', score: contactScore, note: contactScore >= 100 ? 'Phone and email detected' : 'Add both email and phone near the top' },
    { title: 'Professional Summary', score: detectedSections.has('summary') ? 88 : 62, note: detectedSections.has('summary') ? 'Summary section detected' : 'Add a 2-4 line summary' },
    { title: 'Section Organization', score: sectionScore, note: `${detectedSections.size} sections detected` },
    { title: 'Job Titles & Experience', score: detectedSections.has('experience') ? 84 : 58, note: detectedSections.has('experience') ? 'Experience section found' : 'Add role history and impact' },
    { title: 'Skills Organization', score: skillScore, note: `${resumeSkills.hard.length} hard skills, ${resumeSkills.soft.length} soft skills` },
    { title: 'Education & Certifications', score: detectedSections.has('education') ? 78 : 56, note: missingSections.includes('certifications') ? 'Certifications section missing' : 'Education is present' },
    { title: 'Grammar & Readability', score: readabilityScore, note: readability >= 60 ? 'Readable and consistent' : 'Simplify long sentences' },
    { title: 'ATS Signal Strength', score: atsSignalScore, note: atsSignalScore >= 60 ? 'Strong result and delivery wording' : 'Add more impact, quality, and outcome terms' },
    { title: 'Keyword Match', score: jobDescriptionText ? keywordScore : 0, note: jobDescriptionText ? `${overlap.length} matched keywords and phrases` : 'Upload a job description' },
  ];

  const formattingCards = [
    { title: 'Bullet Points', score: Math.min(100, bulletCount * 18), note: bulletCount > 3 ? 'Good use of bullets' : 'Use more bullet points' },
    { title: 'Verb Tense', score: actionVerbCount > 0 ? 90 : 68, note: actionVerbCount > 0 ? 'Action verbs detected' : 'Start bullets with action verbs' },
    { title: 'Length', score: wordCount >= 250 ? 85 : 65, note: wordCount >= 250 ? `${wordCount} words found` : 'Add more measurable detail' },
    { title: 'Section Headers', score: sectionScore, note: `${detectedSections.size} headers found` },
  ];

  const skillsList = [...resumeSkills.hard.map((skill) => ({ title: skill, type: 'Hard' })), ...resumeSkills.soft.map((skill) => ({ title: skill, type: 'Soft' }))];
  const topResumeSkills = skillsList.slice(0, 18);

  const recommendations = [];
  if (!detectedSections.has('certifications')) {
    recommendations.push({ title: 'Add certifications to strengthen credibility', priority: 'High priority', detail: 'Certifications can help ATS keyword match and show verified expertise.' });
  }
  if (jobDescriptionText && keywordScore < 60) {
    recommendations.push({ title: 'Increase keyword overlap with the job description', priority: 'High priority', detail: `Naturally add missing terms like ${missing.slice(0, 5).join(', ') || 'role-specific keywords'} inside your summary, skills, and experience bullets.` });
  }
  if (readabilityScore < 60) {
    recommendations.push({ title: 'Improve readability with shorter lines', priority: 'Medium priority', detail: 'Break long sentences into concise bullets and reduce dense paragraphs.' });
  }
  if (achievements.length < 2) {
    recommendations.push({ title: 'Add quantified achievements', priority: 'High priority', detail: 'Use metrics such as percentages, cost savings, time reduction, or team size.' });
  }
  if (!extractEmail(text) || !extractPhone(text)) {
    recommendations.push({ title: 'Check contact details', priority: 'Medium priority', detail: 'Include both email and phone number near the top of the resume.' });
  }
  if (atsSignalScore < 60) {
    recommendations.push({ title: 'Make bullets more outcome-driven', priority: 'Medium priority', detail: 'Use this pattern: action verb + project/task + measurable result + tool or business impact.' });
  }
  if (recommendations.length < 3) {
    recommendations.push({ title: 'Tune bullet structure and action verbs', priority: 'Medium priority', detail: 'Lead with strong action verbs and keep every bullet result-oriented.' });
  }

  const jobMatch = jobDescriptionText
    ? [
        { title: 'Resume Section Overview', score: sectionScore, detail: `${detectedSections.size} key sections detected from the uploaded file.` },
        { title: 'Keyword & Phrase Match', score: keywordScore, detail: `${overlap.length} job keywords/phrases matched. Add ${missing.slice(0, 3).join(', ') || 'more role-specific language'} for better alignment.` },
        { title: 'Professional Summary', score: detectedSections.has('summary') ? 84 : 60, detail: detectedSections.has('summary') ? 'Summary aligns with the document structure.' : 'Add a stronger opening summary with keywords.' },
        { title: 'Grammar & Readability', score: readabilityScore, detail: readability >= 60 ? 'Text is reasonably readable.' : 'Simplify long sentences and reduce jargon.' },
      ]
    : [
        { title: 'Job Description', score: 0, detail: 'Paste a job description for keyword matching.' },
      ];

  return {
    overallScore,
    scoreLabel,
    fileName: null,
    fileType: null,
    resumeText: getResumeTextPreview(text),
    resumeTextFull: text,
    jobDescription: jobDescriptionText || '',
    jobDescriptionPreview: jobDescriptionText ? getResumeTextPreview(jobDescriptionText, 500) : '',
    resumeSections: Array.from(detectedSections).map((section) => ({ label: section.charAt(0).toUpperCase() + section.slice(1), count: 1 })),
    missingSections,
    summary: sectionCards,
    formatting: formattingCards,
    skills: topResumeSkills,
    recommendations,
    jobMatch,
    metrics: {
      readability: readabilityScore,
      words: wordCount,
      bullets: bulletCount,
      achievements: achievements.length,
      hardSkills: resumeSkills.hard.length,
      softSkills: resumeSkills.soft.length,
      keywordMatch: keywordScore,
      atsSignals: atsSignalScore,
    },
    detectedSections: Array.from(detectedSections).map((section) => section.charAt(0).toUpperCase() + section.slice(1)),
    missingKeywords: missing.slice(0, 14),
    matchedKeywords: overlap.slice(0, 14),
    resumeKeywords: resumeKeywords.slice(0, 14),
    highlightedSkills: topResumeSkills.slice(0, 12),
    sectionCandidates: parseSectionCandidates(text),
    contactInfo: {
      email: extractEmail(text),
      phone: extractPhone(text),
    },
    achievements,
  };
}

async function extractResumeText(file) {
  const originalName = file.originalname || 'resume';
  const extension = path.extname(originalName).toLowerCase();

  if (extension === '.pdf' || file.mimetype === 'application/pdf') {
    const result = await pdfParse(file.buffer);
    return { text: result.text || '', fileType: 'PDF' };
  }

  if (extension === '.docx' || file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return { text: result.value || '', fileType: 'DOCX' };
  }

  if (extension === '.doc' || file.mimetype === 'application/msword') {
    const doc = await extractor.extract(file.buffer);
    return { text: doc.getBody() || '', fileType: 'DOC' };
  }

  throw new Error('Unsupported file type. Please upload PDF, DOC, or DOCX.');
}

app.use(express.static(__dirname));

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/analyze', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a resume file.' });
    }

    const jobDescriptionText = typeof req.body.jobDescription === 'string' ? req.body.jobDescription.trim() : '';
    const parsed = await extractResumeText(req.file);
    const result = summarizeSections(parsed.text, detectSections(parsed.text), jobDescriptionText);

    return res.json({
      ...result,
      fileName: req.file.originalname,
      fileType: parsed.fileType,
      fileSize: req.file.size,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Failed to analyze resume.' });
  }
});

app.listen(PORT, () => {
  console.log(`ATS Analyzer running on http://localhost:${PORT}`);
});
