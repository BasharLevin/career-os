import type { Metadata } from 'next';
import './styles.css';
import { CareerAssistantProvider } from '../src/assistant/assistant-context';
import { GlobalAssistant } from '../src/assistant/global-assistant';

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
        <CareerAssistantProvider>
          <nav className="product-nav" aria-label="Primary navigation">
            <a href="/discover">Discover</a>
            <a href="/applications">Applications</a>
            <a href="/profile">Profile</a>
            <a href="/assistant">Assistant</a>
          </nav>
          {children}
          <GlobalAssistant />
        </CareerAssistantProvider>
      </body>
    </html>
  );
}
