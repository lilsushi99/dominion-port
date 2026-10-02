// components/IntroLetter.tsx — Editorial Intro Letter
import React from 'react';

interface IntroLetterProps {
  introHtml?: string;
  introBody?: string;
  signOff: string;
}

export function IntroLetter({ introHtml, introBody, signOff }: IntroLetterProps) {
  const signOffLines = signOff ? signOff.split('\n') : ['love,', 'dominion'];

  return (
    <section className="mb-[3.5em]">
      {introHtml ? (
        <div
          className="space-y-[1.5em] text-[#b9b8b2] text-[15px] leading-[1.75] [&_a]:text-[#d6d5cf] [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-white [&_strong]:text-[#eae9e4] [&_strong]:font-semibold"
          dangerouslySetInnerHTML={{ __html: introHtml }}
        />
      ) : (
        <div className="space-y-[1.5em] text-[#b9b8b2] text-[15px] leading-[1.75]">
          <p>{introBody}</p>
        </div>
      )}

      {/* Tightly stacked sign-off lines */}
      <div className="mt-[2em] text-[15px] leading-[1.3] text-[#b9b8b2]">
        {signOffLines.map((line, idx) => (
          <div key={`signoff-${idx}`}>{line}</div>
        ))}
      </div>
    </section>
  );
}
