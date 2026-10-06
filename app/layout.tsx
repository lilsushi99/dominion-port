import type { Metadata } from 'next';
import { Inter_Tight } from 'next/font/google';
import { ThemeProvider } from '@/components/ThemeProvider';
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={interTight.variable} suppressHydrationWarning>
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
      <body suppressHydrationWarning className="min-h-screen selection:bg-[#555]/30 selection:text-white transition-colors duration-200">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
