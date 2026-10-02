# PRD — Dominion's Portfolio

## 1. Purpose
A personal portfolio for Dominion: product designer, web developer, data analyst, researcher and builder. It exists to answer one question quickly: *who is this person, what have they made, and how do I reach them?*

It is a personal, text-led, editorial site, not a SaaS landing page.

## 2. Audience
- Potential clients and employers (businesses needing products, systems, dashboards, SEO).
- Students and peers (Dominion teaches product design).
- Readers of research and written work.

## 3. Core journey
Land → read the introduction → contact or scroll → browse work by category → open a project → visit it live → contact.

No header, no navbar, no hamburger, no floating UI. The page itself is the navigation.

## 4. Pages
| Route | Purpose |
|---|---|
| `/` | Introduction letter, sign-off, contact links, category switcher + project list |
| `/work/[slug]` | Project detail (web, product design, dashboards) |
| `/papers/[slug]` | Article-style reading page |

A category can be preselected via `/?c=papers` (so Back returns to the same category).

## 5. Home page content
1. **Introduction letter** (conversational, first person, not a CV). Covers: name; product designer who teaches product design; designs digital products for businesses; builds websites and platforms; data background; studied Meteorology and Climate Science; numbers led into business intelligence; ERP, POS, CRM, LMS systems; SEO work with sites ranking for specific keywords; writes and publishes research and other work.
2. **Inline links**: every company, client or platform is an underlined link inside the sentence. Companies come from the database and are placed in the text via tokens (see PROJECT.md).
3. **Sign-off**: `love,` / `dominion`.
4. **Contact**: four plain text links: email me, text me on LinkedIn, whatsapp me, find me on X. URLs editable in admin.
5. **Work list** with a category switcher: Web Development, Product Design, Papers, Dashboards. Heading wording is original (e.g. "p.s. things i've made and written…"), editable.

### Draft intro copy (dummy companies; replaceable)
> hi there,
>
> **i'm dominion.** i'm a product designer, and i teach product design at [Brightpath Academy]. i design digital products for businesses and build the websites and platforms they run on.
>
> before design, i studied meteorology and climate science. working with data and numbers pulled me towards business intelligence, and i now build systems that help organisations understand their operations: ERP, POS, CRM and LMS platforms, with dashboards and reports on top. i've done this for [Northwind Logistics] and [Harbor & Co.].
>
> i also work on SEO. a few sites i've worked on, like [Stonegate Interiors], now rank highly for the keywords they care about. and i write: research papers, data write-ups and essays.
>
> [email me] or [text me on linkedin] if you'd like to work together.

## 6. Project list row
`Year` → `Title ↗/→` → description → large preview → whole row clickable. Internal links use `→`, external use `↗`.

## 7. Project detail (Web, Product Design, Dashboards)
`back` → title → year → **primary media** (video by default; image for Dashboards where chosen) → "view live project →" button → **exactly three paragraphs** (justified) → optional gallery.

### Gallery
Optional (0, 1 or many images). Large, full-bleed where appropriate, natural aspect ratios, never cropped or stretched, no cards, no masonry, no heavy rounding.

## 8. Papers
Reads like a good editorial article: title, date, body with paragraphs, headings, inline figures, charts, analysis screenshots, captions, optional pull quotes and links. Clean, typography-led, comfortable measure.

## 9. Dashboards
Primary media is selectable per project: **video** or **image**. Covers Power BI, Tableau, Excel, Python, Laravel systems, ERP, POS, CRM, LMS.

## 10. Future admin panel (not built yet, but the data model supports it)
Manage: profile and intro text, companies and URLs, contact links, projects (all fields incl. video/image uploads, 3 paragraphs, gallery ordering), papers (rich content blocks and images), categories, publish/draft state.

## 11. Non-goals
Blog comments, search, auth for visitors, newsletter, analytics dashboards, animations beyond subtle fades, any decorative UI.

## 12. Success criteria
- A visitor understands who Dominion is within 10 seconds.
- Every piece of content comes from the API, none hardcoded in components.
- Looks and feels like the references, and not like a template.
