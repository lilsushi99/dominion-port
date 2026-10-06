// app/work/[slug]/page.tsx — Project Detail Page
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getProjectBySlug, getProfile } from '@/lib/api';
import { getSafeMediaUrl } from '@/lib/media-url';
import { BackLink } from '@/components/BackLink';
import { ProjectMedia } from '@/components/ProjectMedia';
import { Gallery } from '@/components/Gallery';
import { Footer } from '@/components/Footer';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const res = await getProjectBySlug(slug);

  if (!res || res.redirect) {
    return {
      title: 'Project — Dominion',
    };
  }

  return {
    title: `${res.title} — Dominion`,
    description: res.summary,
    openGraph: {
      title: `${res.title} — Dominion`,
      description: res.summary,
    },
  };
}

export default async function ProjectPage({ params }: PageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  // Handle 301 Redirect for old slugs stored in slug_history
  if (project.redirect && project.redirectSlug) {
    redirect(`/work/${project.redirectSlug}`);
  }

  const profile = await getProfile();

  // Format primary media for ProjectMedia component
  const isVideo = project.primary_media?.kind === 'video';
  const rawVideoPath = project.primary_media ? (project.primary_media.public_url || project.primary_media.relative_path) : null;
  const rawPosterPath = project.poster_media ? (project.poster_media.public_url || project.poster_media.relative_path) : null;
  const rawImagePath = !isVideo && project.primary_media ? (project.primary_media.public_url || project.primary_media.relative_path) : null;

  const videoData = isVideo && rawVideoPath
    ? {
        path: getSafeMediaUrl(rawVideoPath)!,
        mime: project.primary_media.mime,
        poster_path: getSafeMediaUrl(rawPosterPath),
        poster_alt: project.poster_media?.alt || project.title
      }
    : null;

  const imageData = !isVideo && rawImagePath
    ? {
        path: getSafeMediaUrl(rawImagePath)!,
        alt: project.primary_media.alt || project.title,
        width: project.primary_media.width,
        height: project.primary_media.height
      }
    : null;

  const galleryItems = (project.gallery || []).map((g: any) => {
    const rawGPath = g.media?.public_url || g.media?.relative_path;
    return {
      id: g.id || g.media_id,
      path: getSafeMediaUrl(rawGPath) || '',
      alt: g.media?.alt || g.caption || project.title,
      width: g.media?.width,
      height: g.media?.height,
      caption: g.caption
    };
  }).filter((g: any) => Boolean(g.path));

  const paragraphs = [
    project.paragraph_1 || '',
    project.paragraph_2 || '',
    project.paragraph_3 || ''
  ].filter(Boolean);

  return (
    <article className="min-h-screen flex flex-col">
      <div className="w-full max-w-[655px] mx-auto px-6 sm:px-0 pt-[72px] sm:pt-[120px] pb-[80px] flex-1 flex flex-col justify-between">
        <div>
          {/* Back navigation */}
          <BackLink categorySlug={project.category_slug || 'web-development'} />

          {/* Header: Title & Date */}
          <header className="mb-6">
            <h1 className="text-[21px] sm:text-[22px] font-semibold text-[#000000] dark:text-[#eae9e4] tracking-[-0.01em] leading-snug transition-colors">
              {project.title}
            </h1>
            <time className="block text-[13px] text-[#000000] dark:text-[#8f8e89] mt-1.5 transition-colors font-mono">
              {project.pub_year}
            </time>
          </header>

          {/* Primary Media (Self-hosted video or image) */}
          {(videoData || imageData) && (
            <ProjectMedia
              primaryType={isVideo ? 'video' : 'image'}
              video={videoData}
              image={imageData}
            />
          )}

          {/* Live project button / link */}
          {project.project_url && (
            <div className="my-6">
              <a
                href={project.project_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[14px] text-[#000000] dark:text-[#eae9e4] font-medium underline underline-offset-[3px] hover:text-[#000000] dark:hover:text-white transition-colors duration-150 inline-flex items-center gap-1.5 focus:outline-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#000000] dark:focus-visible:outline-[#8f8e89]"
              >
                <span>{project.link_label || 'view live project'}</span>
                <span className="text-[13px] text-[#000000] dark:text-[#8f8e89]">→</span>
              </a>
            </div>
          )}

          {/* Exactly Three Justified Paragraphs */}
          <div className="space-y-[1.5em] text-[15px] leading-[1.75] text-[#000000] dark:text-[#b9b8b2] editorial-paragraphs mt-6 transition-colors">
            {paragraphs.map((p, idx) => (
              <p key={`p-${idx}`}>{p}</p>
            ))}
          </div>

          {/* Optional Gallery */}
          {galleryItems.length > 0 && (
            <Gallery items={galleryItems} />
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
