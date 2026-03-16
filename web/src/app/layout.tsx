import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Oakville Schools Directory | Find Schools in Oakville, Ontario',
    template: '%s | Oakville Schools Directory',
  },
  description: 'Search 259+ public, Catholic, private, Montessori schools and daycares in Oakville, Ontario. Compare ratings, reviews, hours & contact info.',
  keywords: 'Oakville schools, schools in Oakville Ontario, Oakville public schools, HDSB schools, HCDSB schools, Oakville private schools, Oakville Montessori, Oakville daycares, best schools Oakville',
  metadataBase: new URL('https://ep-oakvilleschools-dge4fadcdedphcgw.b02.azurefd.net'),
  openGraph: {
    title: 'Oakville Schools Directory — Find the Best School for Your Child',
    description: 'Comprehensive guide to 259+ schools in Oakville, ON. Search, compare ratings & find the right fit.',
    url: 'https://ep-oakvilleschools-dge4fadcdedphcgw.b02.azurefd.net',
    siteName: 'Oakville Schools Directory',
    locale: 'en_CA',
    type: 'website',
  },
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://ep-oakvilleschools-dge4fadcdedphcgw.b02.azurefd.net' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        {/* Skip link for keyboard users — WCAG 2.4.1 */}
        <a href="#main-content" className="skip-link">Skip to main content</a>

        <header className="header" role="banner">
          <nav className="nav" aria-label="Main navigation">
            <a href="/" className="logo" aria-label="Oakville Schools Directory — Home">
              <span className="logo-icon" aria-hidden="true">🏫</span>
              Oakville Schools Directory
            </a>

            {/* Mobile menu toggle */}
            <input type="checkbox" id="nav-toggle" className="nav-toggle-input" aria-hidden="true" />
            <label htmlFor="nav-toggle" className="nav-toggle-label" aria-label="Toggle navigation menu">
              <span className="hamburger" aria-hidden="true"></span>
            </label>

            <div className="nav-links" role="menubar" aria-label="School categories">
              <a href="/oakville-public-schools" role="menuitem">Public</a>
              <a href="/oakville-catholic-schools" role="menuitem">Catholic</a>
              <a href="/oakville-private-schools" role="menuitem">Private</a>
              <a href="/oakville-montessori-schools" role="menuitem">Montessori</a>
              <a href="/oakville-daycares" role="menuitem">Daycares</a>
              <a href="/compare" role="menuitem" className="nav-highlight">Compare</a>
              <a href="/resources" role="menuitem">Resources</a>
              <a href="/oakville-schools" role="menuitem" className="nav-all">All Schools</a>
            </div>
          </nav>
        </header>

        <main id="main-content" className="main" role="main" tabIndex={-1}>
          {children}
        </main>

        <footer className="footer" role="contentinfo">
          <div className="footer-content">
            <div className="footer-section">
              <h2>Oakville Schools Directory</h2>
              <p>Comprehensive directory of schools and childcare in Oakville, Ontario.</p>
            </div>
            <div className="footer-section">
              <h2>Quick Links</h2>
              <ul>
                <li><a href="/oakville-public-schools">Public Schools</a></li>
                <li><a href="/oakville-catholic-schools">Catholic Schools</a></li>
                <li><a href="/oakville-private-schools">Private Schools</a></li>
                <li><a href="/oakville-montessori-schools">Montessori</a></li>
                <li><a href="/oakville-daycares">Daycares</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h2>Accessibility</h2>
              <p>This site is designed to be WCAG 2.1 AA compliant. If you encounter accessibility issues, please contact us.</p>
            </div>
          </div>
          <p className="footer-copy">&copy; {new Date().getFullYear()} Oakville Schools Directory. For informational purposes only.</p>
        </footer>
      </body>
    </html>
  );
}
