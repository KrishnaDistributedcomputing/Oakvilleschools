import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Oakville Schools Directory',
  description: 'Find public, Catholic, private, Montessori schools and daycares in Oakville, Ontario.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="header">
          <nav className="nav">
            <a href="/oakville-schools" className="logo">Oakville Schools Directory</a>
            <div className="nav-links">
              <a href="/oakville-public-schools">Public</a>
              <a href="/oakville-catholic-schools">Catholic</a>
              <a href="/oakville-private-schools">Private</a>
              <a href="/oakville-montessori-schools">Montessori</a>
              <a href="/oakville-daycares">Daycares</a>
            </div>
          </nav>
        </header>
        <main className="main">{children}</main>
        <footer className="footer">
          <p>&copy; {new Date().getFullYear()} Oakville Schools Directory. For informational purposes only.</p>
        </footer>
      </body>
    </html>
  );
}
