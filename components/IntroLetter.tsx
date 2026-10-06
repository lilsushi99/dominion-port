// components/IntroLetter.tsx — Editorial Intro Letter with Profile Avatar and Theme Toggle
import React from 'react';
import { ProfileAvatar } from './ProfileAvatar';
import { ThemeToggle } from './ThemeToggle';

interface ProfileImage {
  id: number;
  url: string;
  alt?: string | null;
  width?: number | null;
  height?: number | null;
}

interface IntroLetterProps {
  introHtml?: string;
  introBody?: string;
  signOff?: string | null;
  profileImages?: ProfileImage[];
}

export function IntroLetter({
  introHtml,
  introBody,
  signOff,
  profileImages = []
}: IntroLetterProps) {
  const trimmedSignOff = (signOff || '').trim();
  const signOffLines = trimmedSignOff ? trimmedSignOff.split('\n') : [];

  return (
    <section className="mb-[3.5em]">
      {/* Profile Avatar Header with Theme Toggle */}
      <div className="flex items-center justify-between mb-2">
        {profileImages && profileImages.length > 0 ? (
          <ProfileAvatar images={profileImages} />
        ) : (
          <div />
        )}
        <ThemeToggle className="mb-6 -mr-1" />
      </div>

      {/* Intro Body Text */}
      {introHtml ? (
        <div
          className="space-y-[1.5em] text-[#000000] dark:text-[#d6d5cf] text-[15px] leading-[1.75] [&_a]:text-[#000000] dark:[&_a]:text-[#eae9e4] [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-[#000000] dark:[&_a:hover]:text-white [&_strong]:text-[#000000] dark:[&_strong]:text-[#ffffff] [&_strong]:font-semibold transition-colors"
          dangerouslySetInnerHTML={{ __html: introHtml }}
        />
      ) : (
        <div className="space-y-[1.5em] text-[#000000] dark:text-[#d6d5cf] text-[15px] leading-[1.75]">
          <p>{introBody}</p>
        </div>
      )}

      {/* Optional sign-off lines */}
      {signOffLines.length > 0 && (
        <div className="mt-[2em] text-[15px] leading-[1.3] text-[#000000] dark:text-[#d6d5cf] transition-colors">
          {signOffLines.map((line, idx) => (
            <div key={`signoff-${idx}`}>{line}</div>
          ))}
        </div>
      )}
    </section>
  );
}
