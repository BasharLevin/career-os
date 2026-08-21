import type { Metadata } from 'next';
import './styles.css';

export const metadata: Metadata = {
  title: 'CareerOS',
  description: 'AI-assisted job discovery and application tracking',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <nav className="product-nav" aria-label="Primary navigation">
          <a href="/discover">Discover</a>
          <a href="/applications">Applications</a>
          <a href="/profile">Profile</a>
          <a href="/assistant">Assistant</a>
        </nav>
        {children}
      </body>
    </html>
  );
}
