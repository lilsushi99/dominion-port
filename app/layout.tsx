import type { Metadata } from 'next';
import { Inter_Tight } from 'next/font/google';
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
    <html lang="en" className={interTight.variable}>
      <body suppressHydrationWarning className="bg-[#2a2a2a] text-[#b9b8b2] min-h-screen selection:bg-[#3d3d3d] selection:text-[#d6d5cf]">
        {children}
      </body>
    </html>
  );
}
