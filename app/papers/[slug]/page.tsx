// app/papers/[slug]/page.tsx — Paper / Article Editorial Page
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getArticleBySlug, getProfile } from '@/lib/api';
import { BackLink } from '@/components/BackLink';
import { ArticleBody } from '@/components/ArticleBody';
import { Footer } from '@/components/Footer';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

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
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

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
          {/* Back navigation with category 'papers' preserved */}
          <BackLink categorySlug="papers" />

          {/* Paper Header */}
          <header className="mb-10">
            <h1 className="text-[21px] sm:text-[23px] font-semibold text-[#16151c] dark:text-[#eae9e4] tracking-[-0.01em] leading-snug transition-colors">
              {article.title}
            </h1>
            <time className="block text-[13px] text-[#6f6e69] dark:text-[#8f8e89] mt-2 transition-colors font-mono">
              {article.published_at}
            </time>
          </header>

          {/* Paper Content: Render HTML or Structured Blocks */}
          {article.content_html ? (
            <div
              className="editorial-article-content space-y-[1.5em] text-[15px] leading-[1.75] text-[#4a4944] dark:text-[#b9b8b2] [&_h2]:text-[18px] [&_h2]:font-semibold [&_h2]:text-[#16151c] dark:[&_h2]:text-[#eae9e4] [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:text-[16px] [&_h3]:font-semibold [&_h3]:text-[#16151c] dark:[&_h3]:text-[#eae9e4] [&_h3]:mt-6 [&_a]:text-[#16151c] dark:[&_a]:text-[#eae9e4] [&_a]:underline [&_a]:underline-offset-2 [&_strong]:text-[#16151c] dark:[&_strong]:text-[#eae9e4] [&_img]:rounded-lg [&_img]:border [&_img]:border-[#444]/20 dark:[&_img]:border-[#222] [&_figcaption]:text-[13px] [&_figcaption]:text-[#6f6e69] dark:[&_figcaption]:text-[#8f8e89] [&_figcaption]:mt-2 [&_figcaption]:italic [&_figure]:my-8 [&_blockquote]:border-l-2 [&_blockquote]:border-[#444]/40 dark:[&_blockquote]:border-[#444] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-[#16151c] dark:[&_blockquote]:text-[#eae9e4] transition-colors"
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
