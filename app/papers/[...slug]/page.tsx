// app/papers/[...slug]/page.tsx — Paper / Article Editorial Page
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import { getArticleBySlug, getProfile } from '@/lib/api';
import { BackLink } from '@/components/BackLink';
import { ArticleBody } from '@/components/ArticleBody';
import { Footer } from '@/components/Footer';

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug: segments } = await params;
  if (!segments || segments.length === 0) {
    return { title: 'Dominion — Research & Papers' };
  }

  // The paper slug is the last segment in the URL
  const paperSlug = segments[segments.length - 1];
  const article = await getArticleBySlug(paperSlug);

  if (!article || article.redirect) {
    return {
      title: 'Dominion — Research & Papers',
    };
  }

  return {
    title: `${article.title} — Dominion`,
    description: article.summary,
    openGraph: {
      title: `${article.title} — Dominion`,
      description: article.summary,
    },
  };
}

export default async function PaperPage({ params }: PageProps) {
  const { slug: segments } = await params;
  if (!segments || segments.length === 0) {
    notFound();
  }

  // The paper slug is the last segment (e.g. /papers/tech-papers/my-paper => 'my-paper')
  const paperSlug = segments[segments.length - 1];
  const article = await getArticleBySlug(paperSlug);

  if (!article) {
    notFound();
  }

  if (article.redirect && article.redirectSlug) {
    redirect(`/papers/${article.redirectSlug}`);
  }

  const profile = await getProfile();

  return (
    <article className="min-h-screen flex flex-col">
      <div className="w-full max-w-[655px] mx-auto px-6 sm:px-0 pt-[72px] sm:pt-[120px] pb-[80px] flex-1 flex flex-col justify-between">
        <div>
          {/* Back navigation to /papers */}
          <BackLink categorySlug="papers" />

          {/* Paper Header */}
          <header className="mb-6">
            <h1 className="text-[21px] sm:text-[23px] font-semibold text-[#000000] dark:text-[#eae9e4] tracking-[-0.01em] leading-snug transition-colors">
              {article.title}
            </h1>
            <time className="block text-[13px] text-[#000000] dark:text-[#8f8e89] mt-2 transition-colors font-mono">
              {article.published_at}
            </time>
          </header>

          {/* Optional Paper Cover Media */}
          {article.cover_media && (
            <div className="w-full rounded-[4px] overflow-hidden bg-[#202020] border border-[#333333]/30 my-8">
              {article.cover_media.kind === 'video' ? (
                <video
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full h-auto rounded-[4px] block"
                  src={article.cover_media.public_url || `/media/${article.cover_media.relative_path}`}
                />
              ) : (
                <Image
                  src={article.cover_media.public_url || `/media/${article.cover_media.relative_path}`}
                  alt={article.cover_media.alt || article.title}
                  width={article.cover_media.width || 1200}
                  height={article.cover_media.height || 750}
                  className="w-full h-auto rounded-[4px] block object-cover"
                  sizes="(max-width: 768px) 100vw, 655px"
                  priority
                  referrerPolicy="no-referrer"
                />
              )}
            </div>
          )}

          {/* Paper Content: Render HTML or Structured Blocks */}
          {article.content_html ? (
            <div
              className="editorial-article-content space-y-[1.5em] text-[15px] leading-[1.75] text-[#000000] dark:text-[#b9b8b2] [&_h2]:text-[18px] [&_h2]:font-semibold [&_h2]:text-[#000000] dark:[&_h2]:text-[#eae9e4] [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:text-[16px] [&_h3]:font-semibold [&_h3]:text-[#000000] dark:[&_h3]:text-[#eae9e4] [&_h3]:mt-6 [&_a]:text-[#000000] dark:[&_a]:text-[#eae9e4] [&_a]:underline [&_a]:underline-offset-2 [&_strong]:text-[#000000] dark:[&_strong]:text-[#eae9e4] [&_img]:rounded-lg [&_img]:border [&_img]:border-[#444]/20 dark:[&_img]:border-[#222] [&_figcaption]:text-[13px] [&_figcaption]:text-[#000000] dark:[&_figcaption]:text-[#8f8e89] [&_figcaption]:mt-2 [&_figcaption]:italic [&_figure]:my-8 [&_blockquote]:border-l-2 [&_blockquote]:border-[#444]/40 dark:[&_blockquote]:border-[#444] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-[#000000] dark:[&_blockquote]:text-[#eae9e4] transition-colors"
              dangerouslySetInnerHTML={{ __html: article.content_html }}
            />
          ) : (
            <ArticleBody blocks={article.blocks} />
          )}
        </div>

        {/* Dynamic Footer */}
        <Footer
          year={profile.footer.year}
          copyrightText={profile.footer.copyright_text}
          designedByText={profile.footer.designed_by_text}
          designerName={profile.footer.designer_name}
          designerUrl={profile.footer.designer_url}
        />
      </div>
    </article>
  );
}
