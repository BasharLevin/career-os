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
      <body>{children}</body>
    </html>
  );
}
