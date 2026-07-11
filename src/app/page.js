'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [status, setStatus] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus('');
      setIsError(false);
    }
  };

  const analyzeResume = async () => {
    if (!file) {
      setStatus('Please select a resume file first.');
      setIsError(true);
      return;
    }

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('jobDescription', jobDescription);

    try {
      setStatus('Analyzing uploaded resume...');
      setIsError(false);
      setLoading(true);

      const response = await fetch('/api/analyze', { method: 'POST', body: formData });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Analysis failed.');
      }

      sessionStorage.setItem('ats-analysis-result', JSON.stringify(payload));
      
      // Store selected file name and JD text separately to match previous client.js logic
      sessionStorage.setItem('selectedResumeName', file.name);
      if (jobDescription.trim()) {
        sessionStorage.setItem('jobDescriptionText', jobDescription.trim());
      } else {
        sessionStorage.removeItem('jobDescriptionText');
      }

      router.push('/analysis');
    } catch (error) {
      setStatus(error.message);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <section className="hero hero-home">
        <div className="hero-copy">
          <span className="eyebrow">Resume analysis made simple</span>
          <h1>ATS Analyzer</h1>
          <p>
            Upload your resume and paste a job description to see how well your resume performs against Applicant Tracking Systems.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={() => router.push('/analysis')}>View Demo Analysis</button>
            <button className="btn btn-secondary" type="button" onClick={analyzeResume} disabled={loading}>
              Analyze Uploaded Resume
            </button>
          </div>
          <div className="feature-pills" aria-label="Highlights">
            <span><span className="pill-dot"></span>ATS score in seconds</span>
            <span><span className="pill-dot"></span>Skills and readability breakdown</span>
            <span><span className="pill-dot"></span>Blue, white, purple modern UI</span>
          </div>
        </div>

        <div className="upload-panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Resume Upload</span>
              <h2>Select from your resumes</h2>
            </div>
            <div className="mini-badge">PDF, DOC, DOCX</div>
          </div>

          <label className="dropzone" htmlFor="resume-file">
            <input id="resume-file" type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} />
            <span className="dropzone-icon" aria-hidden="true">⬆</span>
            <strong>Drop your resume here</strong>
            <span>or click to browse files</span>
            <small>Supports PDF, DOC, DOCX (Max 5MB)</small>
          </label>

          <div className="upload-meta">
            <div>
              <span className="meta-label">Selected file</span>
              <strong>{file ? file.name : 'No file selected'}</strong>
            </div>
            <button className="btn btn-primary btn-wide" type="button" onClick={analyzeResume} disabled={loading}>
              {loading ? 'Analyzing...' : 'Analyze Now'}
            </button>
          </div>

          <p className={`upload-status ${isError ? 'is-error' : ''}`} aria-live="polite">{status}</p>

          <div className="job-desc-panel">
            <div className="panel-header compact-header">
              <div>
                <span className="eyebrow">Job Description</span>
                <h2>Paste the role details</h2>
              </div>
            </div>
            <textarea
              id="job-description"
              className="job-desc-field"
              rows="6"
              placeholder="Paste the job description here to improve keyword matching and scoring..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            ></textarea>
          </div>
        </div>
      </section>

      <section className="section-grid">
        <article className="info-card tone-blue">
          <div className="card-icon">⚡</div>
          <h3>Fast ATS Match</h3>
          <p>Quickly compare your resume against a job description and see where your profile is strong or missing signals.</p>
        </article>
        <article className="info-card tone-purple">
          <div className="card-icon">✦</div>
          <h3>Clean Visual Feedback</h3>
          <p>Score rings, radar charts, and section cards make the results easy to scan on desktop and mobile.</p>
        </article>
        <article className="info-card tone-white">
          <div className="card-icon">◎</div>
          <h3>Actionable Guidance</h3>
          <p>Get recommendations for achievements, keywords, readability, formatting, and missing sections.</p>
        </article>
      </section>
    </main>
  );
}
