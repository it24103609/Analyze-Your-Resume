const STORAGE_KEY = 'ats-analysis-result';

function $(selector) {
  return document.querySelector(selector);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function textPreview(value, length = 280) {
  const compact = String(value || '').replace(/\s+/g, ' ').trim();
  if (!compact) return '';
  return compact.length > length ? `${compact.slice(0, length).trim()}...` : compact;
}

function iconSvg(name) {
  const icons = {
    score: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4a8 8 0 1 0 8 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M12 12l6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M17 4h3v3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    sections: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h10a2 2 0 0 1 2 2v14H5V6a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 9h8M8 13h8M8 17h5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    jd: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14v14H5z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 9h8M8 13h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="m15 15 2 2 3-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    summary: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 15c4-8 12-8 16 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M12 8v8M8 12h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    format: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h12M8 5v14M16 5v14M6 19h12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M10 10h4M10 14h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    skills: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7 4v6c0 4-3 7-7 8-4-1-7-4-7-8V7l7-4Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="m9 12 2 2 4-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    readability: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6.5c2.4-1.4 5-1.4 8 0 3-1.4 5.6-1.4 8 0v12c-2.4-1.4-5-1.4-8 0-3-1.4-5.6-1.4-8 0v-12Z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 6.5v12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    match: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="5" fill="none" stroke="currentColor" stroke-width="2"/><path d="m14 14 5 5M8 10l1.5 1.5L13 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    recommend: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 5 20l7-4 7 4-7-17Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 3v13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    achievement: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 20h8M12 14v6M6 7H4a3 3 0 0 0 3 3M18 7h2a3 3 0 0 1-3 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    source: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h9l3 3v15H6V3Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M15 3v4h4M9 12h6M9 16h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    keyword: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M8 5v14M16 5v14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  };

  return `<span class="icon-inner ${name}">${icons[name] || icons.score}</span>`;
}

function panelIconForTitle(title) {
  const map = {
    'ATS Score': 'score',
    'AI Readiness Overview': 'score',
    'Resume Analysis': 'summary',
    'Resume Sections': 'sections',
    'Formatting Analysis': 'format',
    'Skills Balance': 'skills',
    'Readability Analysis': 'readability',
    'Job Match': 'match',
    'Improvement Recommendations': 'recommend',
    'Achievements Analysis': 'achievement',
    'Source Data': 'source',
    'Keyword Match': 'keyword',
  };

  return map[title] || 'score';
}

function decorateAnalysisIcons() {
  document.querySelectorAll('.hero-stats .stat-chip').forEach((chip, index) => {
    if (chip.querySelector('.chip-icon')) return;
    const iconName = ['score', 'sections', 'jd'][index] || 'score';
    chip.insertAdjacentHTML('afterbegin', `<span class="chip-icon">${iconSvg(iconName)}</span>`);
  });

  document.querySelectorAll('.panel-header h2').forEach((heading) => {
    if (heading.querySelector('.section-icon')) return;
    const iconName = panelIconForTitle(heading.textContent.trim());
    heading.insertAdjacentHTML('afterbegin', `<span class="section-icon">${iconSvg(iconName)}</span>`);
  });
}

function renderCards(container, items, template) {
  if (!container) return;
  container.innerHTML = items.map(template).join('') || '<div class="analysis-empty"><strong>No data yet</strong><p>Upload a resume to generate live analysis.</p></div>';
}

function renderChips(container, items, soft = false) {
  if (!container) return;
  if (!items.length) {
    container.innerHTML = '<span class="chip is-soft">None</span>';
    return;
  }
  container.innerHTML = items.map((item) => `<span class="chip ${soft ? 'is-soft' : ''}">${escapeHtml(item)}</span>`).join('');
}

function setMetric(selector, value) {
  const node = $(selector);
  if (node) node.textContent = `${Math.round(value || 0)}%`;
}

function setMetricBar(selector, value) {
  const node = $(selector);
  if (node) node.style.width = `${Math.max(0, Math.min(100, Math.round(value || 0)))}%`;
}

function renderReadinessOverview(result) {
  const metrics = result.metrics || {};
  const score = Number(result.overallScore || 0);
  const keywordScore = metrics.keywordMatch || 0;
  const skillScore = Math.min(100, Math.round((metrics.hardSkills || 0) * 6 + (metrics.softSkills || 0) * 4));
  const readabilityScore = metrics.readability || 0;
  const impactScore = Math.min(100, Math.round((metrics.achievements || 0) * 22 + (metrics.atsSignals || 0) * 0.6));

  const readinessScore = $('#readiness-score');
  if (readinessScore) readinessScore.textContent = Math.round(score) || '--';

  const readinessTitle = $('#readiness-title');
  if (readinessTitle) {
    readinessTitle.textContent = score >= 80
      ? 'Strong ATS-ready profile'
      : score >= 65
        ? 'Good resume with upgrade potential'
        : score >= 45
          ? 'Needs keyword and impact tuning'
          : 'Start by strengthening core sections';
  }

  const readinessCopy = $('#readiness-copy');
  if (readinessCopy) {
    const missingKeywords = result.missingKeywords?.slice(0, 3).join(', ');
    readinessCopy.textContent = missingKeywords
      ? `Focus next on missing role terms like ${missingKeywords}, then add measurable achievement bullets.`
      : 'Your strongest signals are summarized here from keywords, skills, readability, and quantified impact.';
  }

  setMetric('#overview-keywords', keywordScore);
  setMetric('#overview-skills', skillScore);
  setMetric('#overview-readability', readabilityScore);
  setMetric('#overview-impact', impactScore);
  setMetricBar('#overview-keywords-bar', keywordScore);
  setMetricBar('#overview-skills-bar', skillScore);
  setMetricBar('#overview-readability-bar', readabilityScore);
  setMetricBar('#overview-impact-bar', impactScore);
}

function setLoadingState(button, loading, label) {
  if (!button) return;
  button.disabled = loading;
  button.textContent = loading ? label : button.dataset.defaultLabel || label;
}

function setupInsightTabs() {
  const tabs = document.querySelectorAll('[data-tab-target]');
  const panes = document.querySelectorAll('[data-insight-pane]');
  if (!tabs.length || !panes.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const targetId = tab.dataset.tabTarget;
      tabs.forEach((item) => {
        const isActive = item === tab;
        item.classList.toggle('is-active', isActive);
        item.setAttribute('aria-selected', String(isActive));
      });
      panes.forEach((pane) => {
        pane.classList.toggle('is-active', pane.id === targetId);
      });
      document.querySelector('.insight-stage')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

async function analyzeResume() {
  const fileInput = $('#resume-file');
  const jobDescription = $('#job-description');
  const status = $('#upload-status');
  const button = $('#upload-analyze-btn');
  const file = fileInput?.files?.[0];

  if (!file) {
    if (status) {
      status.textContent = 'Please select a resume file first.';
      status.classList.add('is-error');
    }
    return;
  }

  const formData = new FormData();
  formData.append('resume', file);
  formData.append('jobDescription', jobDescription?.value || '');

  try {
    if (status) {
      status.textContent = 'Analyzing uploaded resume...';
      status.classList.remove('is-error');
    }
    setLoadingState(button, true, 'Analyzing...');

    const response = await fetch('/api/analyze', { method: 'POST', body: formData });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || 'Analysis failed.');
    }

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    window.location.href = 'analysis.html';
  } catch (error) {
    if (status) {
      status.textContent = error.message;
      status.classList.add('is-error');
    }
  } finally {
    setLoadingState(button, false, button?.dataset.defaultLabel || 'Analyze Now');
  }
}

function setupHome() {
  const fileInput = $('#resume-file');
  const fileLabel = $('#selected-file');
  const status = $('#upload-status');
  const button = $('#upload-analyze-btn');
  const quickButton = $('#quick-analyze-btn');

  if (button) button.dataset.defaultLabel = 'Analyze Now';

  fileInput?.addEventListener('change', () => {
    if (fileLabel) fileLabel.textContent = fileInput.files?.[0]?.name || 'No file selected';
    if (status) {
      status.textContent = '';
      status.classList.remove('is-error');
    }
  });

  button?.addEventListener('click', analyzeResume);
  quickButton?.addEventListener('click', analyzeResume);
}

function renderAnalysis(result) {
  if (!result) return;

  const score = Number(result.overallScore || 0);
  const scoreLabel = result.scoreLabel || 'No analysis';
  const metrics = result.metrics || {};

  document.title = `ATS Analysis | ${result.fileName || 'Resume'}`;

  const scoreRing = $('#score-ring');
  if (scoreRing) scoreRing.style.setProperty('--score', String(score));

  const scoreValue = $('#score-value');
  if (scoreValue) scoreValue.textContent = Math.round(score) || '--';

  const scoreLabelNode = $('#score-label');
  if (scoreLabelNode) scoreLabelNode.textContent = scoreLabel;

  const scoreChip = $('#overall-score-chip');
  if (scoreChip) scoreChip.textContent = `${score.toFixed(2)}%`;

  const sectionCountChip = $('#section-count-chip');
  if (sectionCountChip) sectionCountChip.textContent = `${(result.summary || []).length} analyzed`;

  const jdStatus = $('#jd-status');
  if (jdStatus) jdStatus.textContent = result.jobDescriptionPreview ? textPreview(result.jobDescriptionPreview, 42) : 'No JD uploaded';

  const centerCopy = document.querySelector('.center-copy');
  if (centerCopy) centerCopy.innerHTML = `Your resume rating is <strong>${escapeHtml(scoreLabel)}</strong>`;

  renderReadinessOverview(result);

  renderCards($('#summary-grid'), result.summary || [], (item) => `
    <article class="summary-card">
      <div class="summary-meta">
        <strong class="card-title">${iconSvg('summary')}${escapeHtml(item.title)}</strong>
        <span class="score-badge">${escapeHtml(item.score)}%</span>
      </div>
      <small>${escapeHtml(item.note)}</small>
    </article>
  `);

  renderCards($('#format-grid'), result.formatting || [], (item) => `
    <article class="format-card">
      <div class="format-meta">
        <strong class="card-title">${iconSvg('format')}${escapeHtml(item.title)}</strong>
        <span class="score-badge">${escapeHtml(item.score)}%</span>
      </div>
      <small>${escapeHtml(item.note)}</small>
    </article>
  `);

  renderCards($('#resume-sections'), result.resumeSections || [], (item) => `
    <div class="section-pill">
      <strong class="card-title">${iconSvg('sections')}${escapeHtml(item.label)}</strong>
      <span class="count">${escapeHtml(item.count)}</span>
    </div>
  `);

  const missingSections = result.missingSections || [];
  const missingBox = document.querySelector('.missing-box');
  if (missingBox) {
    const title = missingSections.length ? missingSections.join(', ') : 'All core sections detected';
    const note = missingSections.length ? 'Add the missing sections to improve ATS parsing.' : 'Core resume sections are present.';
    missingBox.innerHTML = `<h3>Missing Sections</h3><p>${escapeHtml(title)}</p><small>${escapeHtml(note)}</small>`;
  }

  renderCards($('#skill-list'), result.skills || [], (item) => `
    <article class="skill-card">
      <strong class="card-title">${iconSvg('skills')}${escapeHtml(item.title)}</strong>
      <small>${escapeHtml(item.type)}</small>
    </article>
  `);

  renderCards($('#job-match-items'), result.jobMatch || [], (item) => `
    <article class="job-card">
      <div class="summary-meta">
        <strong class="card-title">${iconSvg('match')}${escapeHtml(item.title)}</strong>
        <span class="score-badge">${escapeHtml(item.score)}%</span>
      </div>
      <p>${escapeHtml(item.detail)}</p>
    </article>
  `);

  renderCards($('#recommendation-list'), result.recommendations || [], (item) => `
    <article class="recommendation-card">
      <span class="priority high">${escapeHtml(item.priority)}</span>
      <h3 class="card-title">${iconSvg('recommend')}${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.detail)}</p>
    </article>
  `);

  const resumePreview = $('#resume-preview');
  if (resumePreview) resumePreview.textContent = result.resumeText || 'No extracted resume text available.';

  const jobPreview = $('#job-preview');
  if (jobPreview) jobPreview.textContent = result.jobDescriptionPreview || 'Paste a job description to see matching context.';

  renderChips($('#matched-keywords'), result.matchedKeywords || []);
  renderChips($('#missing-keywords'), result.missingKeywords || [], true);

  const hardSkillCount = metrics.hardSkills || 0;
  const softSkillCount = metrics.softSkills || 0;
  const totalSkillCount = hardSkillCount + softSkillCount;
  const hardSkillPercent = totalSkillCount ? Math.round((hardSkillCount / totalSkillCount) * 100) : 0;
  const skillsDonut = document.querySelector('.donut.is-main-balance');
  if (skillsDonut) skillsDonut.style.setProperty('--ratio', String(hardSkillPercent));
  const skillsPercent = $('#skills-balance-percent');
  if (skillsPercent) skillsPercent.textContent = totalSkillCount ? `${hardSkillPercent}%` : '--';
  const hardCount = $('#hard-skill-count');
  if (hardCount) hardCount.textContent = `${hardSkillCount} hard skills`;
  const softCount = $('#soft-skill-count');
  if (softCount) softCount.textContent = `${softSkillCount} soft skills`;
  const jobScore = $('#job-match-score');
  if (jobScore) jobScore.textContent = `${score.toFixed(2)}%`;

  const sectionSummary = result.summary?.length ? `${result.summary.length} analyzed` : '--';
  if (sectionCountChip) sectionCountChip.textContent = sectionSummary;

  const summaryBox = document.querySelector('.analysis-summary .panel-header p');
  if (summaryBox) summaryBox.textContent = `Quick Overview • ${metrics.words || 0} words parsed`;

  const readable = document.querySelector('.readability-card');
  if (readable) {
    const readabilityValue = readable.querySelector('.readability-score strong');
    const readabilityLabel = readable.querySelector('.readability-score span');
    const readabilityCopy = readable.querySelector('.muted-copy');
    const readabilityMeter = readable.querySelector('.meter-fill');

    if (readabilityValue) readabilityValue.textContent = metrics.readability ?? '--';
    if (readabilityLabel) readabilityLabel.textContent = metrics.readability >= 60 ? 'Easy' : metrics.readability >= 40 ? 'Difficult' : 'Very Difficult';
    if (readabilityCopy) readabilityCopy.textContent = metrics.readability >= 60
      ? 'Your resume is readable and ATS-friendly.'
      : 'Your resume has dense wording. Shorten sentences and reduce jargon.';
    if (readabilityMeter) readabilityMeter.style.width = `${Math.max(0, Math.min(100, metrics.readability || 0))}%`;
  }

  const complexBox = document.querySelector('.complex-box');
  if (complexBox) {
    const complexTitle = complexBox.querySelector('strong');
    const complexCopy = complexBox.querySelector('p');
    if (complexTitle) complexTitle.textContent = 'Complex Words';
    if (complexCopy) complexCopy.textContent = `${Math.round((metrics.words || 0) * 0.24)} words, estimated complexity from the parsed text`;
  }

  const achievementBox = document.querySelector('.achievement-box');
  if (achievementBox) {
    achievementBox.querySelector('strong').textContent = `${metrics.achievements || 0} achievements`;
    achievementBox.querySelector('p').textContent = result.achievements?.length
      ? `Detected quantified lines such as: ${result.achievements.slice(0, 2).join(' | ')}`
      : 'Adding quantified achievements will strengthen your resume. Focus on metrics like percentage improvements, time savings, cost savings, and team sizes.';
  }

  const sourceGrid = document.querySelector('.source-grid');
  if (sourceGrid && result.contactInfo) {
    const contactText = [result.contactInfo.email, result.contactInfo.phone].filter(Boolean).join(' • ') || 'No direct contact details detected yet.';
    sourceGrid.insertAdjacentHTML('beforeend', `
      <div class="source-box">
        <strong class="source-title-row">${iconSvg('source')}Detected Contact Info</strong>
        <p>${escapeHtml(contactText)}</p>
      </div>
    `);
  }

  if (result.fileType) {
    const heroStatus = $('#jd-status');
    if (heroStatus && result.fileName) heroStatus.textContent = result.jobDescriptionPreview ? textPreview(result.jobDescriptionPreview, 42) : 'No JD uploaded';
  }
}

function setupAnalysis() {
  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (stored) {
    renderAnalysis(JSON.parse(stored));
    return;
  }

  const fallback = {
    overallScore: 0,
    scoreLabel: 'No analysis',
    summary: [],
    formatting: [],
    skills: [],
    jobMatch: [],
    recommendations: [],
    resumeSections: [],
    missingSections: [],
    matchedKeywords: [],
    missingKeywords: [],
    resumeText: 'Upload a resume from the home page to generate a real ATS analysis.',
    jobDescriptionPreview: '',
    metrics: {},
  };
  renderAnalysis(fallback);
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.body.dataset.page === 'home') {
    setupHome();
  }

  if (document.body.dataset.page === 'analysis') {
    setupAnalysis();
    decorateAnalysisIcons();
    setupInsightTabs();
  }
});
