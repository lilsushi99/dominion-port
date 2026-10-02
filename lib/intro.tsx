// lib/intro.ts — Token and markdown parser for intro letter (no dangerouslySetInnerHTML)
import React, { ReactNode } from 'react';
import { Company } from './types';

/**
 * Parses intro text containing:
 * - Paragraph breaks (\n\n)
 * - Line breaks (\n)
 * - Bold tokens (**text**)
 * - Company tokens ([[company:token|visible text]])
 * Returns safe React nodes without using dangerouslySetInnerHTML.
 */
export function parseIntroText(text: string, companies: Company[]): ReactNode[] {
  const companyMap = new Map<string, Company>();
  for (const c of companies) {
    companyMap.set(c.token, c);
  }

  // Split into paragraphs by double newlines
  const paragraphs = text.split(/\n\s*\n/);

  return paragraphs.map((para, paraIdx) => {
    // Process single newlines inside paragraph
    const lines = para.split('\n');

    const lineNodes: ReactNode[] = [];
    lines.forEach((line, lineIdx) => {
      if (lineIdx > 0) {
        lineNodes.push(<br key={`br-${paraIdx}-${lineIdx}`} />);
      }
      lineNodes.push(...parseInlineTokens(line, companyMap, `p-${paraIdx}-l-${lineIdx}`));
    });

    return (
      <p key={`para-${paraIdx}`} className="leading-[1.75] text-[15px] mb-[1.5em] last:mb-0">
        {lineNodes}
      </p>
    );
  });
}

function parseInlineTokens(
  text: string,
  companyMap: Map<string, Company>,
  keyPrefix: string
): ReactNode[] {
  const nodes: ReactNode[] = [];

  // Match either [[company:token|visible text]] or **bold**
  // Token regex: /\[\[company:([^|]+)\|([^\]]+)\]\]/
  // Bold regex: /\*\*([^*]+)\*\*/
  const tokenRegex = /(\[\[company:[^|]+\|[^\]]+\]\]|\*\*[^*]+\*\*)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let matchIdx = 0;

  while ((match = tokenRegex.exec(text)) !== null) {
    const matchStart = match.index;
    const matchStr = match[0];

    // Push any text preceding the token
    if (matchStart > lastIndex) {
      nodes.push(text.substring(lastIndex, matchStart));
    }

    if (matchStr.startsWith('[[company:')) {
      const parts = matchStr.slice(10, -2).split('|');
      const token = parts[0];
      const visibleText = parts[1] || token;
      const company = companyMap.get(token);
      const url = company?.url || '#';
      const isExternal = url.startsWith('http');

      nodes.push(
        <a
          key={`${keyPrefix}-link-${matchIdx}`}
          href={url}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          className="text-[var(--text-hi)] font-medium underline underline-offset-[3px] hover:text-white transition-colors duration-150 inline cursor-pointer"
        >
          {visibleText}
        </a>
      );
    } else if (matchStr.startsWith('**') && matchStr.endsWith('**')) {
      const boldText = matchStr.slice(2, -2);
      nodes.push(
        <strong key={`${keyPrefix}-bold-${matchIdx}`} className="text-[var(--text-hi)] font-semibold">
          {boldText}
        </strong>
      );
    }

    lastIndex = matchStart + matchStr.length;
    matchIdx++;
  }

  // Push remaining text
  if (lastIndex < text.length) {
    nodes.push(text.substring(lastIndex));
  }

  return nodes;
}
