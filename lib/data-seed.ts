// lib/data-seed.ts — Mirror of 002_seed_dummy.sql
import { Profile, Category, ListItem, ProjectDetail, ArticleDetail } from './types';

export const SEED_PROFILE: Profile = {
  name: 'Dominion',
  intro_body: `hi there,

**i'm dominion.** i'm a product designer, and i teach product design at [[company:brightpath|Brightpath Academy]]. i design digital products for businesses and build the websites and platforms they run on.

before design, i studied meteorology and climate science. working with data and numbers pulled me towards business intelligence, and i now build systems that help organisations understand their operations: ERP, POS, CRM and LMS platforms, with dashboards and reports on top. i've done this for [[company:northwind|Northwind Logistics]] and [[company:harbor|Harbor & Co.]].

i also work on SEO. a few sites i've worked on, like [[company:stonegate|Stonegate Interiors]], now rank highly for the keywords they care about. and i write: research papers, data write-ups and essays.

[[company:email|email me]] or [[company:linkedin|text me on linkedin]] if you'd like to work together.`,
  sign_off: 'love,\ndominion',
  list_heading: "p.s. things i've made and written…",
  updated_at: '2026-02-28T12:00:00Z',
  companies: [
    {
      id: 1,
      name: 'Brightpath Academy',
      url: 'https://brightpath.example.org',
      token: 'brightpath',
      sort_order: 1
    },
    {
      id: 2,
      name: 'Northwind Logistics',
      url: 'https://northwind.example.com',
      token: 'northwind',
      sort_order: 2
    },
    {
      id: 3,
      name: 'Harbor & Co.',
      url: 'https://harborco.example.com',
      token: 'harbor',
      sort_order: 3
    },
    {
      id: 4,
      name: 'Stonegate Interiors',
      url: 'https://stonegate.example.com',
      token: 'stonegate',
      sort_order: 4
    },
    {
      id: 5,
      name: 'email me',
      url: 'mailto:dominion@example.com',
      token: 'email',
      sort_order: 5
    },
    {
      id: 6,
      name: 'text me on linkedin',
      url: 'https://linkedin.com/in/dominion',
      token: 'linkedin',
      sort_order: 6
    }
  ],
  contact_links: [
    {
      id: 1,
      type: 'email',
      label: 'email me',
      url: 'mailto:dominion@example.com',
      sort_order: 1
    },
    {
      id: 2,
      type: 'linkedin',
      label: 'text me on linkedin',
      url: 'https://linkedin.com/in/dominion',
      sort_order: 2
    },
    {
      id: 3,
      type: 'whatsapp',
      label: 'whatsapp me',
      url: 'https://wa.me/1234567890',
      sort_order: 3
    },
    {
      id: 4,
      type: 'x',
      label: 'find me on x',
      url: 'https://x.com/dominion_design',
      sort_order: 4
    }
  ]
};

export const SEED_CATEGORIES: Category[] = [
  { id: 1, slug: 'web-development', name: 'web development', sort_order: 1 },
  { id: 2, slug: 'product-design', name: 'product design', sort_order: 2 },
  { id: 3, slug: 'papers', name: 'papers', sort_order: 3 },
  { id: 4, slug: 'dashboards', name: 'dashboards', sort_order: 4 }
];

export const SEED_PROJECTS: ProjectDetail[] = [
  {
    id: 1,
    slug: 'northwind-logistics',
    year: 2026,
    title: 'northwind logistics',
    summary: 'high-throughput shipment tracking and inventory telemetry for freight operators across west africa.',
    category: {
      name: 'web development',
      slug: 'web-development'
    },
    live_url: 'https://northwind.example.com',
    live_label: 'view live project',
    primary_media_type: 'video',
    video: {
      path: '/media/sample-video.mp4',
      mime: 'video/mp4',
      poster_path: '/media/posters/northwind-poster.svg',
      poster_alt: 'northwind shipment tracking telemetry portal interface'
    },
    image: null,
    paragraphs: [
      'freight tracking in regional transport networks frequently suffers from sparse connectivity and disparate data formats. freight handlers were previously dependent on manual paper manifests and disjointed messaging threads that obscured critical delays until containers arrived at terminal gates.',
      'i architected a lightweight web application focused on high-speed tabular entry, offline caching via service workers, and automated sync once signal resumes. the data layer compresses status payloads to sub-kilobyte packets, ensuring field drivers on 2g networks transmit timestamped coordinates without friction.',
      'the deployed platform now orchestrates over twelve thousand weekly freight movements. dispatcher reaction time to route anomalies dropped from four hours to under eight minutes, while operational visibility gave cargo owners deterministic arrival estimates.'
    ],
    gallery: [
      {
        id: 1,
        path: '/media/gallery/northwind-screen-1.svg',
        alt: 'shipment manifests and status reconciliation ledger view',
        width: 1400,
        height: 900,
        caption: 'shipment manifests and status reconciliation ledger view'
      },
      {
        id: 2,
        path: '/media/gallery/northwind-screen-2.svg',
        alt: 'automated exception handling and container customs inspection route',
        width: 1400,
        height: 900,
        caption: 'automated exception handling and container customs inspection route'
      }
    ]
  },
  {
    id: 2,
    slug: 'stonegate-interiors',
    year: 2025,
    title: 'stonegate interiors',
    summary: 'editorial e-commerce platform and search architecture tailored for bespoke architectural finishes.',
    category: {
      name: 'web development',
      slug: 'web-development'
    },
    live_url: 'https://stonegate.example.com',
    live_label: 'visit showroom',
    primary_media_type: 'video',
    video: {
      path: '/media/sample-video.mp4',
      mime: 'video/mp4',
      poster_path: '/media/posters/stonegate-poster.svg',
      poster_alt: 'stonegate interior finish catalog interface'
    },
    image: null,
    paragraphs: [
      'stonegate required a digital presence that mirrored the understated tactile elegance of their bespoke joinery and stoneware collections. commercial e-commerce storefronts were cluttered with promotional banners, artificial urgency timers, and sluggish third-party scripts that diluted brand integrity.',
      'we rebuilt their digital presence from first principles using next.js, optimizing semantic dom hierarchies, high-resolution webp asset delivery, and structured json-ld schema for regional interior architecture queries. the layout preserves deliberate whitespace and neutral tonality.',
      'within five months post-launch, stonegate reached top three organic search placements for ten critical commercial keyword clusters. organic trade consultation inquiries rose by eighty-four percent without ad spend.'
    ],
    gallery: []
  },
  {
    id: 3,
    slug: 'brightpath-academy',
    year: 2025,
    title: 'brightpath design system',
    summary: 'pedagogical workspace and interactive curriculum platform built for cohort-based product design fellows.',
    category: {
      name: 'product design',
      slug: 'product-design'
    },
    live_url: 'https://brightpath.example.org',
    live_label: 'explore curriculum',
    primary_media_type: 'video',
    video: {
      path: '/media/sample-video.mp4',
      mime: 'video/mp4',
      poster_path: '/media/posters/brightpath-poster.svg',
      poster_alt: 'brightpath academy design learning workspace'
    },
    image: null,
    paragraphs: [
      'teaching product design requires a fine balance between rigid technical foundational theory and open-ended practical critique. conventional learning management systems fragment student submissions, rubric grading, and peer critique into disconnected threaded forums.',
      'i led the product design of an integrated studio environment that embeds figma frame embeds directly alongside rubric milestones. students annotate fellow cohort projects with precise typographic markers while instructors provide time-stamped video critiques inside the canvas.',
      'the first three cohorts completed coursework with a ninety-two percent capstone completion rate. student feedback highlighted that the unfragmented review loop accelerated portfolio readiness by several weeks.'
    ],
    gallery: []
  },
  {
    id: 4,
    slug: 'meridian-erp',
    year: 2025,
    title: 'meridian operations erp',
    summary: 'centralised material requirements planning, work-in-progress monitoring and inventory accounting dashboard.',
    category: {
      name: 'dashboards',
      slug: 'dashboards'
    },
    live_url: 'https://meridian-demo.example.com',
    live_label: 'launch demo',
    primary_media_type: 'image',
    video: null,
    image: {
      path: '/media/dashboards/meridian-erp-main.svg',
      alt: 'meridian erp production throughput analytics and ledger',
      width: 1920,
      height: 1080
    },
    paragraphs: [
      'manufacturing facilities handling modular hardware components struggle with inventory drift between physical warehouse bins and legacy accounting software. purchasing teams frequently over-ordered raw steel while bottleneck assemblies sat paused.',
      'i designed and implemented an executive operations dashboard synthesizing live plc sensor pulses, bill-of-materials recalculations, and supplier lead-time variance models. visual hierarchy prioritizes immediate action thresholds over passive vanity charts.',
      'facility managers reduced idle machine downtime by twenty-two percent across two quarters. procurement lead cycles were synchronized directly with verified work-in-progress consumption rates.'
    ],
    gallery: [
      {
        id: 3,
        path: '/media/gallery/meridian-detail-1.svg',
        alt: 'sub-assembly component allocation matrix with safety threshold warnings',
        width: 1400,
        height: 880,
        caption: 'sub-assembly component allocation matrix with safety threshold warnings'
      }
    ]
  },
  {
    id: 5,
    slug: 'harbor-pos-telemetry',
    year: 2024,
    title: 'harbor retail pos intelligence',
    summary: 'real-time multi-store till telemetry, basket margin analysis and shift reconciliation suite for retail franchises.',
    category: {
      name: 'dashboards',
      slug: 'dashboards'
    },
    live_url: 'https://harbor-pos.example.com',
    live_label: 'open dashboard',
    primary_media_type: 'image',
    video: null,
    image: {
      path: '/media/dashboards/harbor-pos-main.svg',
      alt: 'harbor retail pos intelligence telemetry suite',
      width: 1920,
      height: 1080
    },
    paragraphs: [
      'regional retail operators running thirty checkout lanes across disparate retail branches experienced delayed visibility into cash drawers, margin leakage, and peak staffing mismatches until nightly bank reconciliations completed.',
      'i built a real-time pos monitoring dashboard streaming websocket event feeds from retail registers. store managers can inspect transaction velocity, markdown anomalies, and void patterns instantaneously on any screen.',
      'branch cash discrepancies fell by sixty-five percent in the initial test market, and store directors restructured afternoon staffing allocations based on empiric checkout basket volume curves.'
    ],
    gallery: []
  }
];

export const SEED_ARTICLES: ArticleDetail[] = [
  {
    id: 1,
    slug: 'meteorological-models-to-business-intelligence',
    year: 2026,
    published_at: 'february 14, 2026',
    title: 'from atmospheric isotherms to enterprise data loops',
    summary: 'reflections on applying thermodynamic fluid dynamics and spatial statistics to operational business pipelines.',
    blocks: [
      {
        id: 1,
        type: 'heading',
        content: { level: 2, text: 'isobars and supply chains' },
        sort_order: 1
      },
      {
        id: 2,
        type: 'paragraph',
        content: {
          text: 'during my years studying meteorology and climate science, the central challenge was never a shortage of data points. every minute, barometric sensors, radiosondes, and geostationary satellites poured terabytes of pressure, temperature, and vorticity fields onto tape drives. the challenge was discerning coherent atmospheric waves through turbulent thermal noise.'
        },
        sort_order: 2
      },
      {
        id: 3,
        type: 'quote',
        content: {
          text: 'chaotic systems do not demand louder indicators; they demand higher resolution filters.',
          attribution: 'notes on numerical weather prediction'
        },
        sort_order: 3
      },
      {
        id: 4,
        type: 'paragraph',
        content: {
          text: 'when i transitioned into software design and business intelligence, i encountered the exact same pathology in enterprise resource planning systems. operations directors sat in front of thirty blinking gauges, pie charts with sixteen slices, and neon status pills—yet they could not discern why warehouse docks were gridlocked.'
        },
        sort_order: 4
      },
      {
        id: 5,
        type: 'heading',
        content: { level: 2, text: 'treating variance as gradient vectors' },
        sort_order: 5
      },
      {
        id: 6,
        type: 'paragraph',
        content: {
          text: 'by modeling supply chain velocity as gradient vectors rather than discrete static balances, stockouts become predictable long before safety stock drops to zero. this single conceptual pivot transformed how we designed telemetry surfaces for logistics operators.'
        },
        sort_order: 6
      },
      {
        id: 7,
        type: 'link',
        content: {
          text: 'download reference mathematical model appendix (pdf)',
          url: 'https://example.com/papers/atmospheric-bi-notes.pdf'
        },
        sort_order: 7
      }
    ]
  },
  {
    id: 2,
    slug: 'typographic-restraint-in-high-density-software',
    year: 2025,
    published_at: 'august 19, 2025',
    title: 'typographic discipline in dense operational software',
    summary: 'why erp and financial systems fail when styled like consumer mobile apps, and how strict typographic scales restore clarity.',
    blocks: [
      {
        id: 8,
        type: 'heading',
        content: { level: 2, text: 'the temptation of decorative chrome' },
        sort_order: 1
      },
      {
        id: 9,
        type: 'paragraph',
        content: {
          text: 'modern web design is awash in rounded pastel pills, glassmorphic card borders, and gratuitous gradient badges. while these treatments may satisfy marketing landing pages, they impose severe cognitive friction when applied to operators managing high-consequence inventory, pos terminals, or freight logistics.'
        },
        sort_order: 2
      },
      {
        id: 10,
        type: 'quote',
        content: {
          text: 'when every metric screams for attention in bold red and green chips, the screen ceases to communicate.',
          attribution: 'field notes in manufacturing plants'
        },
        sort_order: 3
      },
      {
        id: 11,
        type: 'paragraph',
        content: {
          text: 'a disciplined interface establishes clarity through tabular alignment, precise font weights, and controlled tonal contrast. neutral ash grays and understated bone-white headers allow true anomalies to surface organically, without visual fatigue over ten-hour shifts.'
        },
        sort_order: 4
      },
      {
        id: 12,
        type: 'heading',
        content: { level: 2, text: 'tabular rhythm and monospace anchors' },
        sort_order: 5
      },
      {
        id: 13,
        type: 'paragraph',
        content: {
          text: 'anchoring numerical values with tabular figures and consistent measure ensures an operator can scan three hundred ledger rows in seconds without eyes jumping across irregular margins. design in this context is not ornament; it is pure signal clarity.'
        },
        sort_order: 6
      }
    ]
  }
];

export function getMergedListItems(categorySlug?: string): ListItem[] {
  const projectItems: ListItem[] = SEED_PROJECTS.map(p => {
    let previewPath = '/media/previews/northwind-thumb.svg';
    if (p.slug === 'northwind-logistics') previewPath = '/media/previews/northwind-thumb.svg';
    else if (p.slug === 'stonegate-interiors') previewPath = '/media/previews/stonegate-thumb.svg';
    else if (p.slug === 'brightpath-academy') previewPath = '/media/previews/brightpath-thumb.svg';
    else if (p.slug === 'meridian-erp') previewPath = '/media/previews/meridian-thumb.svg';
    else if (p.slug === 'harbor-pos-telemetry') previewPath = '/media/previews/harbor-thumb.svg';

    return {
      id: p.id,
      slug: p.slug,
      year: p.year,
      title: p.title,
      summary: p.summary,
      type: 'project',
      category_slug: p.category.slug,
      href: `/work/${p.slug}`,
      is_external: false,
      live_url: p.live_url,
      preview: {
        path: previewPath,
        alt: p.title,
        width: 240,
        height: 160
      }
    };
  });

  const articleItems: ListItem[] = SEED_ARTICLES.map(a => {
    const previewPath = a.slug === 'meteorological-models-to-business-intelligence'
      ? '/media/previews/paper-climatology-thumb.svg'
      : '/media/previews/paper-design-systems-thumb.svg';

    return {
      id: 100 + a.id,
      slug: a.slug,
      year: a.year,
      title: a.title,
      summary: a.summary,
      type: 'article',
      category_slug: 'papers',
      href: `/papers/${a.slug}`,
      is_external: false,
      live_url: null,
      preview: {
        path: previewPath,
        alt: a.title,
        width: 240,
        height: 160
      }
    };
  });

  let all: ListItem[] = [];
  if (!categorySlug || categorySlug === 'all') {
    all = [...projectItems, ...articleItems];
  } else if (categorySlug === 'papers') {
    all = articleItems;
  } else {
    all = projectItems.filter(p => p.category_slug === categorySlug);
  }

  return all.sort((a, b) => b.year - a.year);
}
