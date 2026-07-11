import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' });

export const metadata = {
  title: 'Analyze Your Resume | ATS Analyzer',
  description: 'Upload your resume and paste a job description to see how well your resume performs against Applicant Tracking Systems.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${spaceGrotesk.variable}`}>
        <div className="page-shell">
          <header className="topbar">
            <Link className="brand" href="/" aria-label="Analyze Your Resume home">
              <span className="brand-mark">AR</span>
              <span>
                <strong>Analyze Your Resume</strong>
                <small>ATS Analyzer</small>
              </span>
            </Link>
            <nav className="topnav">
              <Link href="/" className="topnav-link">Home</Link>
              <Link href="/analysis" className="topnav-link">Analysis</Link>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
