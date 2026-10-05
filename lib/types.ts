// lib/types.ts — Shared Types for Dominion's Portfolio

export interface Company {
  id: number;
  name: string;
  url: string;
  token: string;
  sort_order: number;
}

export interface ContactLink {
  id: number;
  label: string;
  url: string;
  sort_order: number;
  type?: string;
  presentation_mode?: 'text' | 'icon';
  platform?: string | null;
  is_active?: boolean;
}

export interface Profile {
  name: string;
  intro_body: string;
  sign_off: string;
  list_heading: string;
  updated_at?: string;
  companies: Company[];
  contact_links: ContactLink[];
}

export interface Category {
  id: number;
  slug: string;
  name: string;
  sort_order: number;
  content_type?: 'project' | 'paper';
  is_active?: boolean;
  item_count?: number;
  cover_path?: string | null;
}

export interface MediaPreview {
  path: string;
  alt: string;
  width?: number | null;
  height?: number | null;
}

export interface ListItem {
  id: number;
  slug: string;
  year: number;
  title: string;
  summary: string;
  type: 'project' | 'article';
  category_slug: string;
  href: string;
  is_external: boolean;
  live_url?: string | null;
  preview?: MediaPreview | null;
}

export interface ProjectDetail {
  id: number;
  slug: string;
  year: number;
  title: string;
  summary: string;
  category: {
    name: string;
    slug: string;
  };
  live_url: string | null;
  live_label: string;
  primary_media_type: 'video' | 'image';
  video: {
    path: string;
    mime: string;
    poster_path?: string | null;
    poster_alt?: string | null;
  } | null;
  image: {
    path: string;
    alt: string;
    width?: number | null;
    height?: number | null;
  } | null;
  paragraphs: [string, string, string]; // Exactly three justified paragraphs
  gallery: Array<{
    id: number;
    path: string;
    alt: string;
    width?: number | null;
    height?: number | null;
    caption?: string | null;
  }>;
}

export type ArticleBlockType = 'heading' | 'paragraph' | 'image' | 'quote' | 'list' | 'link' | 'code';

export interface ArticleBlock {
  id: number;
  type: ArticleBlockType;
  content: {
    text?: string;
    level?: number;
    url?: string;
    items?: string[];
    caption?: string;
    path?: string;
    alt?: string;
    attribution?: string;
    language?: string;
    code?: string;
  };
  sort_order: number;
}

export interface ArticleDetail {
  id: number;
  slug: string;
  year: number;
  published_at: string;
  title: string;
  summary: string;
  blocks: ArticleBlock[];
}

export interface SitemapItem {
  path: string;
  updated_at: string;
}
