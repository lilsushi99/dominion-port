import type { Metadata } from 'next';
import { Inter_Tight } from 'next/font/google';
import { ThemeProvider } from '@/components/ThemeProvider';
import { getSiteSettings } from '@/backend/src/services/cms.service';
import './globals.css';

const interTight = Inter_Tight({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter-tight',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Dominion — Portfolio',
  description: 'Personal editorial portfolio of Dominion: product designer, web developer, data analyst and researcher.',
  openGraph: {
    title: 'Dominion — Portfolio',
    description: 'Personal editorial portfolio of Dominion: product designer, web developer, data analyst and researcher.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dominion — Portfolio',
    description: 'Personal editorial portfolio of Dominion: product designer, web developer, data analyst and researcher.',
  },
};

// Background mode comes from MySQL (Admin → Home CMS → Intro & Hero), never from client state.
export const dynamic = 'force-dynamic';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let backgroundMode: 'black' | 'off_black' = 'off_black';
  try {
    backgroundMode = (await getSiteSettings()).background_mode;
  } catch (err) {
    console.warn('[LAYOUT] Could not read background_mode, using off_black:', err);
  }

  return (
    <html lang="en" className={interTight.variable} data-bg={backgroundMode} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('dominion_theme');
                  var theme = saved;
                  if (!theme) {
                    theme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
                  }
                  document.documentElement.setAttribute('data-theme', theme);
                  if (theme === 'light') {
                    document.documentElement.classList.add('light');
                    document.documentElement.classList.remove('dark');
                  } else {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className="min-h-screen selection:bg-[#555]/30 selection:text-white transition-colors duration-200 relative bg-[var(--bg)] text-[var(--text)]">
        {/* Background Noise Texture (behind all page content) */}
        <div aria-hidden="true" className="noise-layer" />

        {/* Content Layer (strictly sits above background noise) */}
        <div className="content-layer">
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </div>
      </body>
    </html>
  );
}
