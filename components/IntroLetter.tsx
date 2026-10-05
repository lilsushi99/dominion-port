// components/IntroLetter.tsx — Editorial Intro Letter with Optional Sign-Off
import React from 'react';

interface IntroLetterProps {
  introHtml?: string;
  introBody?: string;
  signOff?: string | null;
}

export function IntroLetter({ introHtml, introBody, signOff }: IntroLetterProps) {
  const trimmedSignOff = (signOff || '').trim();
  const signOffLines = trimmedSignOff ? trimmedSignOff.split('\n') : [];

  return (
    <section className="mb-[3.5em]">
      {introHtml ? (
        <div
          className="space-y-[1.5em] text-[#333333] dark:text-[#b9b8b2] text-[15px] leading-[1.75] [&_a]:text-[#171717] dark:[&_a]:text-[#d6d5cf] [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-[#5b4be0] dark:[&_a:hover]:text-white [&_strong]:text-[#171717] dark:[&_strong]:text-[#eae9e4] [&_strong]:font-semibold transition-colors"
          dangerouslySetInnerHTML={{ __html: introHtml }}
        />
      ) : (
        <div className="space-y-[1.5em] text-[#333333] dark:text-[#b9b8b2] text-[15px] leading-[1.75]">
          <p>{introBody}</p>
        </div>
      )}

      {/* Optional sign-off lines (only rendered when sign-off text is explicitly provided) */}
      {signOffLines.length > 0 && (
        <div className="mt-[2em] text-[15px] leading-[1.3] text-[#333333] dark:text-[#b9b8b2] transition-colors">
          {signOffLines.map((line, idx) => (
            <div key={`signoff-${idx}`}>{line}</div>
          ))}
        </div>
      )}
    </section>
  );
}
