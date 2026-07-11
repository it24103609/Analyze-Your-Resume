'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { jsPDF } from 'jspdf';
import { 
  Search, BarChart2, Settings, Mail, FileText, Layout, Briefcase, Award, GraduationCap, Pencil, LayoutTemplate, PieChart, Target, Info, CheckCircle
} from 'lucide-react';

function Icon({ name, className = '', title = '' }) {
  // Try to match by title first for the summary cards to perfectly match the screenshot
  const t = title.toLowerCase();
  if (t.includes('contact')) return <Mail className={`icon-inner ${className}`} size={18} strokeWidth={2} />;
  if (t.includes('summary')) return <FileText className={`icon-inner ${className}`} size={18} strokeWidth={2} />;
  if (t.includes('section organization')) return <Settings className={`icon-inner ${className}`} size={18} strokeWidth={2} />;
  if (t.includes('job titles')) return <Briefcase className={`icon-inner ${className}`} size={18} strokeWidth={2} />;
  if (t.includes('skills')) return <Award className={`icon-inner ${className}`} size={18} strokeWidth={2} />;
  if (t.includes('education')) return <GraduationCap className={`icon-inner ${className}`} size={18} strokeWidth={2} />;
  if (t.includes('grammar') || t.includes('readability')) return <Pencil className={`icon-inner ${className}`} size={18} strokeWidth={2} />;
  if (t.includes('quick overview')) return <BarChart2 className={`icon-inner ${className}`} size={18} strokeWidth={2} />;
  if (t.includes('component analysis')) return <Settings className={`icon-inner ${className}`} size={18} strokeWidth={2} />;

  // Fallback to name-based icons for general UI
  const icons = {
    score: <Search size={18} strokeWidth={2.5} />,
    sections: <LayoutTemplate size={18} strokeWidth={2.5} />,
    jd: <Briefcase size={18} strokeWidth={2.5} />,
    summary: <PieChart size={18} strokeWidth={2.5} />,
    format: <Settings size={18} strokeWidth={2.5} />,
    skills: <Award size={18} strokeWidth={2.5} />,
    readability: <Pencil size={18} strokeWidth={2.5} />,
    match: <Target size={18} strokeWidth={2.5} />,
    recommend: <Info size={18} strokeWidth={2.5} />,
    achievement: <CheckCircle size={18} strokeWidth={2.5} />,
    source: <FileText size={18} strokeWidth={2.5} />,
    keyword: <Search size={18} strokeWidth={2.5} />,
  };
  return <span className={`icon-inner ${className}`}>{icons[name] || icons.score}</span>;
}

export default function Analysis() {
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('resume-analysis');

  useEffect(() => {
    const stored = sessionStorage.getItem('ats-analysis-result');
    if (stored) {
      setData(JSON.parse(stored));
    } else {
      setData({
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
        goodToAdd: [],
        mistakesToAvoid: [],
        recommendedJobs: [],
      });
    }
  }, []);

  if (!data) return <div>Loading...</div>;

  const score = Math.round(Number(data.overallScore || 0));
  const metrics = data.metrics || {};
  const keywordScore = metrics.keywordMatch || 0;
  const skillScore = Math.min(100, Math.round((metrics.hardSkills || 0) * 6 + (metrics.softSkills || 0) * 4));
  const readabilityScore = metrics.readability || 0;
  const impactScore = Math.min(100, Math.round((metrics.achievements || 0) * 22 + (metrics.atsSignals || 0) * 0.6));

  const hardSkillCount = metrics.hardSkills || 0;
  const softSkillCount = metrics.softSkills || 0;
  const totalSkillCount = hardSkillCount + softSkillCount;
  const hardSkillPercent = totalSkillCount ? Math.round((hardSkillCount / totalSkillCount) * 100) : 0;

  const missingKeywordsPreview = data.missingKeywords?.slice(0, 3).join(', ');
  const contactText = [data.contactInfo?.email, data.contactInfo?.phone].filter(Boolean).join(' • ') || 'No direct contact details detected yet.';

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    document.querySelector('.insight-stage')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const downloadPDF = () => {
    if (!data) return;
    const doc = new jsPDF();
    const margin = 20;
    let y = 20;
    const lineSpacing = 8;
    const sectionSpacing = 15;

    doc.setFontSize(22);
    doc.setTextColor(47, 107, 255);
    doc.text("Resume ATS Report", margin, y);
    y += sectionSpacing;

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`Overall ATS Score: ${score}% (${data.scoreLabel})`, margin, y);
    y += sectionSpacing;

    // What to add
    doc.setFontSize(14);
    doc.setTextColor(122, 60, 255);
    doc.text("Recommended Additions", margin, y);
    y += 10;
    doc.setFontSize(11);
    doc.setTextColor(60, 70, 80);
    if (data.goodToAdd?.length) {
      data.goodToAdd.forEach(item => {
        const splitText = doc.splitTextToSize(`• ${item}`, 170);
        doc.text(splitText, margin + 5, y);
        y += splitText.length * lineSpacing;
      });
    } else {
      doc.text("• No specific additions recommended.", margin + 5, y);
      y += lineSpacing;
    }
    y += sectionSpacing;

    // What to avoid
    doc.setFontSize(14);
    doc.setTextColor(122, 60, 255);
    doc.text("Mistakes to Avoid", margin, y);
    y += 10;
    doc.setFontSize(11);
    doc.setTextColor(60, 70, 80);
    if (data.mistakesToAvoid?.length) {
      data.mistakesToAvoid.forEach(item => {
        const splitText = doc.splitTextToSize(`• ${item}`, 170);
        doc.text(splitText, margin + 5, y);
        y += splitText.length * lineSpacing;
      });
    } else {
      doc.text("• No specific mistakes detected.", margin + 5, y);
      y += lineSpacing;
    }
    y += sectionSpacing;

    // Recommended Jobs
    doc.setFontSize(14);
    doc.setTextColor(122, 60, 255);
    doc.text("Target Job Roles (Based on Skills)", margin, y);
    y += 10;
    doc.setFontSize(11);
    doc.setTextColor(60, 70, 80);
    if (data.recommendedJobs?.length) {
      data.recommendedJobs.forEach(item => {
        const splitText = doc.splitTextToSize(`• ${item}`, 170);
        doc.text(splitText, margin + 5, y);
        y += splitText.length * lineSpacing;
      });
    } else {
      doc.text("• General professional roles.", margin + 5, y);
      y += lineSpacing;
    }

    doc.save("ATS-Resume-Report.pdf");
  };

  return (
    <main className="analysis-page">
      <section className="hero hero-analysis">
        <div className="hero-copy compact">
          <span className="eyebrow">Resume Analysis</span>
          <h1>ATS Analyzer</h1>
          <p>AI-powered insights and improvements for better ATS performance and recruiter clarity.</p>
        </div>
        <div className="hero-stats">
          <div className="stat-chip"><span className="chip-icon"><Icon name="score" /></span>Overall ATS Score <strong>{score.toFixed(2)}%</strong></div>
          <div className="stat-chip"><span className="chip-icon"><Icon name="sections" /></span>Resume Sections <strong>{data.summary?.length || 0} analyzed</strong></div>
          <div className="stat-chip muted"><span className="chip-icon"><Icon name="jd" /></span>Job Description <strong>{data.jobDescriptionPreview ? (data.jobDescriptionPreview.length > 42 ? `${data.jobDescriptionPreview.slice(0, 42)}...` : data.jobDescriptionPreview) : 'No JD uploaded'}</strong></div>
          <button className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }} onClick={downloadPDF}>
            ⬇ Download Report
          </button>
        </div>
      </section>

      <section className="dashboard-top">
        <article className="panel score-panel">
          <div className="panel-header">
            <h2><span className="section-icon"><Icon name="score" /></span> ATS Score</h2>
          </div>
          <div className="score-ring is-main-score" style={{ '--score': score }}>
            <div className="score-inner">
              <strong>{score}</strong>
              <span>{data.scoreLabel}</span>
            </div>
          </div>
          <p className="center-copy">Your resume rating is <strong>{data.scoreLabel}</strong></p>
        </article>

        <article className="panel readiness-panel">
          <div className="panel-header">
            <h2><span className="section-icon"><Icon name="score" /></span> AI Readiness Overview</h2>
          </div>
          <div className="readiness-hero">
            <div className="readiness-orb">
              <span>{score}</span>
              <small>Ready</small>
            </div>
            <div className="readiness-copy">
              <span className="eyebrow">Smart scan</span>
              <h3>
                {score >= 80 ? 'Strong ATS-ready profile' :
                 score >= 65 ? 'Good resume with upgrade potential' :
                 score >= 45 ? 'Needs keyword and impact tuning' : 'Start by strengthening core sections'}
              </h3>
              <p>
                {missingKeywordsPreview
                  ? `Focus next on missing role terms like ${missingKeywordsPreview}, then add measurable achievement bullets.`
                  : 'Your strongest signals are summarized here from keywords, skills, readability, and quantified impact.'}
              </p>
            </div>
          </div>
          <div className="readiness-grid" aria-label="AI readiness metrics">
            <div className="readiness-metric">
              <span>Keywords</span>
              <strong>{keywordScore}%</strong>
              <div className="metric-track"><i style={{ width: `${keywordScore}%` }}></i></div>
            </div>
            <div className="readiness-metric">
              <span>Skills</span>
              <strong>{skillScore}%</strong>
              <div className="metric-track"><i style={{ width: `${skillScore}%` }}></i></div>
            </div>
            <div className="readiness-metric">
              <span>Readability</span>
              <strong>{readabilityScore}%</strong>
              <div className="metric-track"><i style={{ width: `${readabilityScore}%` }}></i></div>
            </div>
            <div className="readiness-metric">
              <span>Impact</span>
              <strong>{impactScore}%</strong>
              <div className="metric-track"><i style={{ width: `${impactScore}%` }}></i></div>
            </div>
          </div>
        </article>
      </section>

      <section className="insight-switcher" aria-label="Analysis sections">
        <button className={`insight-tab ${activeTab === 'resume-analysis' ? 'is-active' : ''}`} type="button" onClick={() => handleTabClick('resume-analysis')}>
          <span className="tab-art tab-art-analysis"></span>
          <span>
            <strong>Resume Analysis</strong>
            <small>Score breakdown</small>
          </span>
        </button>
        <button className={`insight-tab ${activeTab === 'skills-balance' ? 'is-active' : ''}`} type="button" onClick={() => handleTabClick('skills-balance')}>
          <span className="tab-art tab-art-skills"></span>
          <span>
            <strong>Skills Balance</strong>
            <small>Hard vs soft skills</small>
          </span>
        </button>
        <button className={`insight-tab ${activeTab === 'job-match' ? 'is-active' : ''}`} type="button" onClick={() => handleTabClick('job-match')}>
          <span className="tab-art tab-art-match"></span>
          <span>
            <strong>Job Match</strong>
            <small>JD alignment</small>
          </span>
        </button>
        <button className={`insight-tab ${activeTab === 'recommendations' ? 'is-active' : ''}`} type="button" onClick={() => handleTabClick('recommendations')}>
          <span className="tab-art tab-art-recommend"></span>
          <span>
            <strong>Recommendations</strong>
            <small>Next actions</small>
          </span>
        </button>
      </section>

      <section className="insight-stage">
        <article className={`panel analysis-summary insight-pane ${activeTab === 'resume-analysis' ? 'is-active' : ''}`}>
          <div className="panel-header stacked">
            <div>
              <h2><span className="section-icon"><Icon name="summary" /></span> Resume Analysis</h2>
              <p>Quick Overview • {metrics.words || 0} words parsed</p>
            </div>
            <span className="analysis-pill">AI ENHANCED</span>
          </div>
          <div className="summary-grid">
            {data.summary?.length ? data.summary.map((item, i) => (
              <article key={i} className="summary-card">
                <div className="summary-meta">
                  <strong className="card-title"><span className="card-mini-icon"><Icon name="summary" title={item.title} /></span>{item.title}</strong>
                  <span className="score-badge">{item.score}%</span>
                </div>
                <small>{item.note}</small>
              </article>
            )) : <div className="analysis-empty"><strong>No data yet</strong><p>Upload a resume to generate live analysis.</p></div>}
          </div>
        </article>

        <article className={`panel insight-pane ${activeTab === 'skills-balance' ? 'is-active' : ''}`}>
          <div className="panel-header stacked">
            <div>
              <h2><span className="section-icon"><Icon name="skills" /></span> Skills Balance</h2>
              <p>Technical and soft skill mix</p>
            </div>
          </div>
          <div className="skills-balance">
            <div>
              <div className="donut is-main-balance" style={{ '--ratio': hardSkillPercent }}>
                <strong>{totalSkillCount ? `${hardSkillPercent}%` : '--'}</strong>
              </div>
            </div>
            <div>
              <div className="skills-bars">
                <div><span>Hard Skills</span><strong>{hardSkillCount} hard skills</strong></div>
                <div><span>Soft Skills</span><strong>{softSkillCount} soft skills</strong></div>
              </div>
              <div className="balance-tags">
                <span className="tag is-hard">Technical</span>
                <span className="tag is-soft">Soft skills</span>
              </div>
            </div>
          </div>
          <div className="skill-list">
            {data.skills?.length ? data.skills.map((item, i) => (
              <article key={i} className="skill-card">
                <strong className="card-title"><span className="card-mini-icon"><Icon name="skills" /></span>{item.title}</strong>
                <small>{item.type}</small>
              </article>
            )) : <div className="analysis-empty"><strong>No data yet</strong><p>Upload a resume to generate live analysis.</p></div>}
          </div>
        </article>

        <article className={`panel insight-pane ${activeTab === 'job-match' ? 'is-active' : ''}`}>
          <div className="panel-header stacked">
            <div>
              <h2><span className="section-icon"><Icon name="match" /></span> Job Match</h2>
              <p>Resume analysis and improvements</p>
            </div>
          </div>
          <div className="job-match">
            <div className="job-match-score">
              <strong>{score.toFixed(2)}%</strong>
              <span>ATS Score</span>
            </div>
            <div className="job-match-items">
              {data.jobMatch?.length ? data.jobMatch.map((item, i) => (
                <article key={i} className="job-card">
                  <div className="summary-meta">
                    <strong className="card-title"><span className="card-mini-icon"><Icon name="match" /></span>{item.title}</strong>
                    <span className="score-badge">{item.score}%</span>
                  </div>
                  <p>{item.detail}</p>
                </article>
              )) : <div className="analysis-empty"><strong>No data yet</strong><p>Upload a resume to generate live analysis.</p></div>}
            </div>
          </div>
        </article>

        <article className={`panel recommendations-panel insight-pane ${activeTab === 'recommendations' ? 'is-active' : ''}`}>
          <div className="panel-header stacked">
            <div>
              <h2><span className="section-icon"><Icon name="recommend" /></span> Improvement Recommendations</h2>
              <p>Prioritized suggestions</p>
            </div>
          </div>
          <div className="recommendation-list">
            {data.recommendations?.length ? data.recommendations.map((item, i) => (
              <article key={i} className="recommendation-card">
                <span className="priority high">{item.priority}</span>
                <h3 className="card-title"><span className="card-mini-icon"><Icon name="recommend" /></span>{item.title}</h3>
                <p>{item.detail}</p>
              </article>
            )) : <div className="analysis-empty"><strong>No data yet</strong><p>Upload a resume to generate live analysis.</p></div>}
            
            {/* Show dynamic advice inline below the recommendations if present */}
            {data.goodToAdd?.length > 0 && (
              <article className="recommendation-card" style={{ border: '1px solid var(--purple)' }}>
                <span className="priority high">Good to Add</span>
                <h3 className="card-title"><span className="card-mini-icon"><Icon name="recommend" /></span>Strengthen your profile</h3>
                <p>Consider adding these elements: {data.goodToAdd.join(' • ')}</p>
              </article>
            )}
            
            {data.mistakesToAvoid?.length > 0 && (
              <article className="recommendation-card" style={{ border: '1px solid #ff4444' }}>
                <span className="priority high">Mistakes to Avoid</span>
                <h3 className="card-title"><span className="card-mini-icon"><Icon name="recommend" /></span>Watch out for these</h3>
                <p>{data.mistakesToAvoid.join(' • ')}</p>
              </article>
            )}

            {data.recommendedJobs?.length > 0 && (
              <article className="recommendation-card" style={{ border: '1px solid var(--blue)' }}>
                <span className="priority high">Target Jobs</span>
                <h3 className="card-title"><span className="card-mini-icon"><Icon name="match" /></span>Recommended Roles</h3>
                <p>Based on your skills: {data.recommendedJobs.join(' • ')}</p>
              </article>
            )}
          </div>
        </article>
      </section>

      <section className="analysis-layout">
        <article className="panel section-list">
          <div className="panel-header stacked">
            <div>
              <h2><span className="section-icon"><Icon name="sections" /></span> Resume Sections</h2>
              <p>Sections detected in the resume</p>
            </div>
            <span className="analysis-pill muted">Analyzed</span>
          </div>
          <div className="section-pills">
            {data.resumeSections?.length ? data.resumeSections.map((item, i) => (
              <div key={i} className="section-pill">
                <strong className="card-title"><span className="card-mini-icon"><Icon name="sections" /></span>{item.label}</strong>
                <span className="count">{item.count}</span>
              </div>
            )) : <div className="analysis-empty"><strong>No data yet</strong><p>Upload a resume to generate live analysis.</p></div>}
          </div>
          <div className="missing-box">
            <h3>Missing Sections</h3>
            <p>{data.missingSections?.length ? data.missingSections.join(', ') : 'All core sections detected'}</p>
            <small>{data.missingSections?.length ? 'Add the missing sections to improve ATS parsing.' : 'Core resume sections are present.'}</small>
          </div>
        </article>
        <article className="panel">
          <div className="panel-header stacked">
            <div>
              <h2><span className="section-icon"><Icon name="format" /></span> Formatting Analysis</h2>
              <p>Content flow and structure</p>
            </div>
          </div>
          <div className="format-grid">
            {data.formatting?.length ? data.formatting.map((item, i) => (
              <article key={i} className="format-card">
                <div className="format-meta">
                  <strong className="card-title"><span className="card-mini-icon"><Icon name="format" /></span>{item.title}</strong>
                  <span className="score-badge">{item.score}%</span>
                </div>
                <small>{item.note}</small>
              </article>
            )) : <div className="analysis-empty"><strong>No data yet</strong><p>Upload a resume to generate live analysis.</p></div>}
          </div>
        </article>
      </section>

      <section className="analysis-columns">
        <article className="panel">
          <div className="panel-header stacked">
            <div>
              <h2><span className="section-icon"><Icon name="readability" /></span> Readability Analysis</h2>
              <p>Language clarity and complexity</p>
            </div>
          </div>
          <div className="readability-card">
            <div className="readability-score">
              <strong>{readabilityScore || '--'}</strong>
              <span>{readabilityScore >= 60 ? 'Easy' : readabilityScore >= 40 ? 'Difficult' : 'Very Difficult'}</span>
            </div>
            <div className="meter">
              <span className="meter-fill is-main-readability" style={{ width: `${Math.max(0, Math.min(100, readabilityScore || 0))}%` }}></span>
            </div>
            <p className="muted-copy">
              {readabilityScore >= 60
                ? 'Your resume is readable and ATS-friendly.'
                : 'Your resume has dense wording. Shorten sentences and reduce jargon.'}
            </p>
            <ul className="tips-list">
              <li>Use shorter sentences</li>
              <li>Choose simpler words where possible</li>
              <li>Break up long paragraphs</li>
            </ul>
          </div>
          <div className="complex-box">
            <strong>Complex Words</strong>
            <p>{Math.round((metrics.words || 0) * 0.24)} words, estimated complexity from the parsed text</p>
          </div>
        </article>

        <article className="panel">
          <div className="panel-header stacked">
            <div>
              <h2><span className="section-icon"><Icon name="achievement" /></span> Achievements Analysis</h2>
              <p>Quantified outcomes</p>
            </div>
          </div>
          <div className="achievement-box">
            <strong>{metrics.achievements || 0} achievements</strong>
            <p>
              {data.achievements?.length
                ? `Detected quantified lines such as: ${data.achievements.slice(0, 2).join(' | ')}`
                : 'Adding quantified achievements will strengthen your resume. Focus on metrics like percentage improvements, time savings, cost savings, and team sizes.'}
            </p>
          </div>
        </article>
      </section>

      <section className="analysis-columns full-width">
        <article className="panel">
          <div className="panel-header stacked">
            <div>
              <h2><span className="section-icon"><Icon name="source" /></span> Source Data</h2>
              <p>Parsed text from the uploaded file and job description</p>
            </div>
          </div>
          <div className="source-grid">
            <div className="source-box">
              <strong>Extracted Resume Preview</strong>
              <p>{data.resumeText || 'Upload a resume to see extracted text.'}</p>
            </div>
            <div className="source-box">
              <strong>Job Description Preview</strong>
              <p>{data.jobDescriptionPreview || 'Paste a job description to see matching context.'}</p>
            </div>
            {data.contactInfo && (
              <div className="source-box">
                <strong className="source-title-row"><span className="icon-inner source"><Icon name="source" /></span>Detected Contact Info</strong>
                <p>{contactText}</p>
              </div>
            )}
          </div>
        </article>

        <article className="panel">
          <div className="panel-header stacked">
            <div>
              <h2><span className="section-icon"><Icon name="keyword" /></span> Keyword Match</h2>
              <p>Matched and missing terms derived from the uploaded content</p>
            </div>
          </div>
          <div className="keyword-clouds">
            <div>
              <strong>Matched Keywords</strong>
              <div className="chip-row">
                {data.matchedKeywords?.length ? data.matchedKeywords.map((item, i) => (
                  <span key={i} className="chip">{item}</span>
                )) : <span className="chip is-soft">None</span>}
              </div>
            </div>
            <div>
              <strong>Missing Keywords</strong>
              <div className="chip-row">
                {data.missingKeywords?.length ? data.missingKeywords.map((item, i) => (
                  <span key={i} className="chip is-soft">{item}</span>
                )) : <span className="chip is-soft">None</span>}
              </div>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
