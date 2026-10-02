'use client';

// components/ProjectMedia.tsx
import React, { useEffect, useRef } from 'react';
import Image from 'next/image';

interface ProjectMediaProps {
  primaryType: 'video' | 'image';
  video?: {
    path: string;
    mime: string;
    poster_path?: string | null;
    poster_alt?: string | null;
  } | null;
  image?: {
    path: string;
    alt: string;
    width?: number | null;
    height?: number | null;
  } | null;
}

export function ProjectMedia({ primaryType, video, image }: ProjectMediaProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (primaryType !== 'video' || !videoRef.current) return;

    // Check prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) return;

    const el = videoRef.current;

    // Autoplay when in view using IntersectionObserver
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.play().catch(() => {
              // Autoplay policy prevented playback
            });
          } else {
            el.pause();
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [primaryType]);

  if (primaryType === 'video' && video) {
    return (
      <div className="w-full rounded-[4px] overflow-hidden bg-[#202020] border border-[#333333]/30 my-8">
        <video
          ref={videoRef}
          controls
          playsInline
          muted
          loop
          preload="metadata"
          poster={video.poster_path || undefined}
          className="w-full h-auto rounded-[4px] block"
        >
          <source src={video.path} type={video.mime || 'video/mp4'} />
          Your browser does not support HTML5 video.
        </video>
      </div>
    );
  }

  if (image) {
    return (
      <div className="w-full rounded-[4px] overflow-hidden bg-[#202020] border border-[#333333]/30 my-8">
        <Image
          src={image.path}
          alt={image.alt}
          width={image.width || 1200}
          height={image.height || 750}
          className="w-full h-auto rounded-[4px] block object-cover"
          sizes="(max-width: 768px) 100vw, 655px"
          priority
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  return null;
}
