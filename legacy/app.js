const analysisData = {
  resumeSections: [
    { label: "Summary", count: 1 },
    { label: "Experience", count: 3 },
    { label: "Education", count: 1 },
    { label: "Skills", count: 1 },
    { label: "Projects", count: 2 },
    { label: "Contact Info", count: 1 },
  ],
  summary: [
    { title: "Contact Information", score: 85, note: "1 issues" },
    { title: "Professional Summary", score: 80, note: "1 improvements, 1 issues" },
    { title: "Section Organization", score: 80, note: "1 improvements, 1 issues" },
    { title: "Job Titles & Experience", score: 75, note: "1 improvements, 1 issues" },
    { title: "Skills Organization", score: 80, note: "1 improvements, 1 issues" },
    { title: "Education & Certifications", score: 75, note: "1 improvements, 1 issues" },
    { title: "Grammar & Readability", score: 85, note: "1 improvements, 1 issues" },
    { title: "Keyword Match", score: 72, note: "Upload job description" },
  ],
  formatting: [
    { title: "Bullet Points", score: 90, note: "Good use of bullet points to highlight your experience." },
    { title: "Verb Tense", score: 92, note: "✅ Good use of appropriate verb tenses." },
    { title: "Length", score: 68, note: "Your resume might benefit from some additional details." },
    { title: "Section Headers", score: 95, note: "✅ Clear section headers help ATS parsing." },
  ],
  skills: [
    { title: "javascript", type: "Hard" },
    { title: "html", type: "Hard" },
    { title: "testing", type: "Hard" },
    { title: "programming", type: "Hard" },
    { title: "python", type: "Hard" },
    { title: "communication", type: "Soft" },
    { title: "teamwork", type: "Soft" },
    { title: "problem solving", type: "Soft" },
    { title: "leadership", type: "Soft" },
  ],
  recommendations: [
    {
      title: "Add quantified achievements to strengthen your impact",
      priority: "High priority",
      detail: "Increased customer satisfaction by 35% through implementation of new service protocols.",
    },
    {
      title: "Review for grammar and spelling errors",
      priority: "High priority",
      detail: "Ensure proper spelling, grammar, and punctuation throughout your resume.",
    },
    {
      title: "Add relevant certifications",
      priority: "Medium priority",
      detail: "Certifications can improve keyword match and show stronger role alignment.",
    },
  ],
  jobMatch: [
    { title: "Resume Section Overview", score: 85, detail: "Contact and summary sections are easy to parse." },
    { title: "Professional Summary", score: 80, detail: "Add role-specific keywords from the job description." },
    { title: "Grammar & Readability", score: 85, detail: "Improve sentence flow to increase ATS and recruiter clarity." },
  ],
};

const radarData = [
  { label: "Readability", value: 51 },
  { label: "Keyword Match", value: 12 },
  { label: "Formatting", value: 86 },
  { label: "Skills", value: 90 },
  { label: "Achievements", value: 40 },
];

function iconPath(name) {
  const icons = {
    upload: '<path d="M12 16V5m0 0 4 4m-4-4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 18.5A2.5 2.5 0 0 1 3.5 16V9.5A2.5 2.5 0 0 1 6 7h2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M18 7h2a2.5 2.5 0 0 1 2.5 2.5V16A2.5 2.5 0 0 1 20 18.5H8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    spark: '<path d="M12 2l1.8 5.3L19 9.1l-5.2 1.8L12 16l-1.8-5.1L5 9.1l5.2-1.8L12 2Z" fill="currentColor"/>',
    shield: '<path d="M12 3 19 6v5c0 4.5-3 8.6-7 10-4-1.4-7-5.5-7-10V6l7-3Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9.5 12l1.8 1.8 3.8-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    check: '<path d="M20 6 9 17l-5-5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>',
  };

  return `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>`;
}

function renderRadarChart() {
  const svg = document.querySelector(".radar-chart");
  if (!svg) return;

  const cx = 210;
  const cy = 170;
  const radius = 110;
  const levels = 5;
  const sides = radarData.length;

  const angleOffset = -Math.PI / 2;
  const pointsFor = (value, sideIndex) => {
    const angle = angleOffset + (Math.PI * 2 * sideIndex) / sides;
    const r = radius * (value / 100);
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  };

  const gridPolygons = Array.from({ length: levels }, (_, level) => {
    const r = (radius * (level + 1)) / levels;
    const points = Array.from({ length: sides }, (_, side) => {
      const angle = angleOffset + (Math.PI * 2 * side) / sides;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
    return `<polygon points="${points}" class="radar-grid"></polygon>`;
  }).join("");

  const spokes = radarData
    .map((_, sideIndex) => {
      const angle = angleOffset + (Math.PI * 2 * sideIndex) / sides;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" class="radar-spoke"></line>`;
    })
    .join("");

  const polygonPoints = radarData.map((item, index) => pointsFor(item.value, index)).join(" ");

  const labels = radarData
    .map((item, index) => {
      const angle = angleOffset + (Math.PI * 2 * index) / sides;
      const labelRadius = radius + 38;
      const x = cx + labelRadius * Math.cos(angle);
      const y = cy + labelRadius * Math.sin(angle);
      const anchor = Math.cos(angle) > 0.25 ? "start" : Math.cos(angle) < -0.25 ? "end" : "middle";
      return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${anchor}" class="radar-text">${item.label}</text>`;
    })
    .join("");

  svg.innerHTML = `
    <defs>
      <linearGradient id="radarFill" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#7a3cff" stop-opacity="0.34" />
        <stop offset="100%" stop-color="#2f6bff" stop-opacity="0.18" />
      </linearGradient>
    </defs>
    ${gridPolygons}
    ${spokes}
    <polygon points="${polygonPoints}" class="radar-fill"></polygon>
    <polygon points="${polygonPoints}" class="radar-outline"></polygon>
    ${labels}
  `;
}

function populateHome() {
  const fileInput = document.querySelector("#resume-file");
  const fileLabel = document.querySelector("#selected-file");
  const jobDescription = document.querySelector("#job-description");
  const analyzeBtn = document.querySelector("#upload-analyze-btn");
  const quickAnalyzeBtn = document.querySelector("#quick-analyze-btn");

  const goToAnalysis = () => {
    if (fileInput?.files?.[0]) {
      sessionStorage.setItem("selectedResumeName", fileInput.files[0].name);
    }
    if (jobDescription?.value?.trim()) {
      sessionStorage.setItem("jobDescriptionText", jobDescription.value.trim());
    } else {
      sessionStorage.removeItem("jobDescriptionText");
    }
    window.location.href = "analysis.html";
  };

  fileInput?.addEventListener("change", () => {
    fileLabel.textContent = fileInput.files?.[0]?.name || "No file selected";
  });

  analyzeBtn?.addEventListener("click", goToAnalysis);
  quickAnalyzeBtn?.addEventListener("click", goToAnalysis);
}

function populateAnalysis() {
  const resumeSections = document.querySelector("#resume-sections");
  const summaryGrid = document.querySelector("#summary-grid");
  const formatGrid = document.querySelector("#format-grid");
  const skillList = document.querySelector("#skill-list");
  const recommendationList = document.querySelector("#recommendation-list");
  const jobMatchItems = document.querySelector("#job-match-items");

  if (resumeSections) {
    resumeSections.innerHTML = analysisData.resumeSections
      .map(
        (item) => `
          <div class="section-pill">
            <strong>${item.label}</strong>
            <span class="count">${item.count}</span>
          </div>
        `,
      )
      .join("");
  }

  if (summaryGrid) {
    summaryGrid.innerHTML = analysisData.summary
      .map(
        (item) => `
          <article class="summary-card">
            <div class="summary-meta">
              <strong>${item.title}</strong>
              <span class="score-badge">${item.score}%</span>
            </div>
            <small>${item.note}</small>
          </article>
        `,
      )
      .join("");
  }

  if (formatGrid) {
    formatGrid.innerHTML = analysisData.formatting
      .map(
        (item) => `
          <article class="format-card">
            <div class="format-meta">
              <strong>${item.title}</strong>
              <span class="score-badge">${item.score}%</span>
            </div>
            <small>${item.note}</small>
          </article>
        `,
      )
      .join("");
  }

  if (skillList) {
    skillList.innerHTML = analysisData.skills
      .map(
        (item) => `
          <article class="skill-card">
            <strong>${item.title}</strong>
            <small>${item.type}</small>
          </article>
        `,
      )
      .join("");
  }

  if (recommendationList) {
    recommendationList.innerHTML = analysisData.recommendations
      .map(
        (item) => `
          <article class="recommendation-card">
            <span class="priority high">${item.priority}</span>
            <h3>${item.title}</h3>
            <p>${item.detail}</p>
          </article>
        `,
      )
      .join("");
  }

  if (jobMatchItems) {
    jobMatchItems.innerHTML = analysisData.jobMatch
      .map(
        (item) => `
          <article class="job-card">
            <div class="summary-meta">
              <strong>${item.title}</strong>
              <span class="score-badge">${item.score}%</span>
            </div>
            <p>${item.detail}</p>
          </article>
        `,
      )
      .join("");
  }

  const selectedName = sessionStorage.getItem("selectedResumeName");
  if (selectedName) {
    document.title = `ATS Analysis | ${selectedName}`;
  }

  const jobDescriptionText = sessionStorage.getItem("jobDescriptionText");
  const jdStatus = document.querySelector("#jd-status");
  if (jdStatus && jobDescriptionText) {
    const preview = jobDescriptionText.length > 42 ? `${jobDescriptionText.slice(0, 42)}...` : jobDescriptionText;
    jdStatus.textContent = preview;
  }
}

function decorateIcons() {
  document.querySelectorAll(".card-icon").forEach((el, index) => {
    const names = ["upload", "spark", "shield"];
    el.innerHTML = iconPath(names[index] || "spark");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderRadarChart();
  decorateIcons();

  if (document.body.dataset.page === "home") {
    populateHome();
  }

  if (document.body.dataset.page === "analysis") {
    populateAnalysis();
  }
});