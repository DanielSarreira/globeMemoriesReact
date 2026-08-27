# 🎨 Globe Memories — Design System v2

> **Status:** v2 — brand-new visual language. Complete reset from v1.
> **Owner:** Lead Product Designer (Mavis) · **Last update:** 2026-07-17
> **Approved brand:** Primary `#007BFF` · Accent `#FF9900`
> **Scope:** Defines the visual language for the **entire** frontend. Every
> page, every component, every feature must follow this document without
> exception. Visual inspiration: Instagram, Polarsteps, Airbnb, Apple,
> Google Photos, Pinterest — used only for **quality calibration**, never
> to copy. The product should feel like a **completely new 2026 product**,
> not a refresh.

---

## 0. North Star

> Globe Memories is a **photo-first travel journal**. Every screen is a frame
> around a memory. Whitespace is generous. Typography is calm. Motion is
> expressive but never noisy. The interface should disappear the moment the
> user opens a photo.

The brand has to feel **premium, modern, mobile-native**. People upload
**vertical smartphone photos** — the product is designed around 9:16
portrait imagery. Anything we put on screen should look like an editorial
travel magazine, not a social feed.

If the user opened the old app and the new app side by side, they should
think they are **two different products**.

---

## 1. Brand Foundations

### 1.1 Personality

- **Editorial.** Each trip is a story. The interface is the layout.
- **Modern.** Native-app feel, glass surfaces, magnetic buttons, soft motion.
- **Confident.** Restrained palette, bold typography, no decorative noise.
- **Warm-but-precise.** Travel has warmth. Product has precision.

### 1.2 Logo & wordmark

- Existing mark kept: `images/logo_white.png` on dark surfaces, `Globe-Memories.png` on light.
- Wordmark uses Inter SemiBold (already loaded).
- No drop shadows. No 3D. No glow. The mark is the mark.

---

## 2. Color Tokens

> **Rule:** no hex hardcoded in component CSS. Only `var(--gm-*)` tokens.
> The existing `--brand-blue` / `--brand-orange` will be **retired**. The
> v2 palette below is the source of truth.

### 2.1 Brand

| Token              | Value     | Usage                                        |
|--------------------|-----------|----------------------------------------------|
| `--gm-brand`       | `#007BFF` | Primary actions, links, focus, active states |
| `--gm-brand-hover` | `#0066E0` | Hover state                                  |
| `--gm-brand-press` | `#0052B8` | Active/pressed state                         |
| `--gm-brand-soft`  | `#E5F1FF` | Selected chips, focused input bg, soft fills  |
| `--gm-brand-tint`  | `#F4F8FF` | Page-level tint, side panels                 |
| `--gm-accent`      | `#FF9900` | Highlights, badges, premium markers          |
| `--gm-accent-hover`| `#E68A00` | Hover state                                  |
| `--gm-accent-soft` | `#FFF1DC` | Accent surfaces                              |

### 2.2 Neutrals

| Token              | Value     | Usage                       |
|--------------------|-----------|-----------------------------|
| `--gm-ink`         | `#0B1020` | Headings (deepest readable) |
| `--gm-text-1`      | `#0B1020` | Body emphasis               |
| `--gm-text-2`      | `#4B5263` | Body                        |
| `--gm-text-3`      | `#7A8194` | Captions, meta              |
| `--gm-text-4`      | `#A8AEC0` | Disabled, placeholder       |
| `--gm-text-on-photo` | `rgba(255,255,255,0.98)` | On photo overlays |
| `--gm-text-on-photo-soft` | `rgba(255,255,255,0.78)` | On photo overlays, secondary |
| `--gm-divider`     | `#ECEEF4` | Hairline dividers           |
| `--gm-border`      | `#E1E5EE` | Input / card borders        |

### 2.3 Surfaces

| Token                  | Value                       | Usage                              |
|------------------------|-----------------------------|------------------------------------|
| `--gm-bg-page`         | `#FAFAFB`                   | App background                     |
| `--gm-bg-card`         | `#FFFFFF`                   | Cards, sheets, modals              |
| `--gm-bg-elevated`     | `#FFFFFF`                   | Floating elements                  |
| `--gm-bg-sunken`       | `#F4F5F8`                   | Inputs, chips, secondary surfaces  |
| `--gm-bg-photo`        | `#0B1020`                   | Fallback behind photo placeholders |
| `--gm-bg-glass`        | `rgba(255,255,255,0.72)`    | Glass over photo                   |
| `--gm-bg-glass-strong` | `rgba(255,255,255,0.92)`    | Strong glass, sheets               |
| `--gm-bg-glass-dark`   | `rgba(11,16,32,0.55)`       | Dark glass over photo              |
| `--gm-bg-overlay`      | `rgba(11,16,32,0.62)`       | Modal backdrop                     |

### 2.4 Photo overlays

| Token                | Value                                                                              | Usage                  |
|----------------------|------------------------------------------------------------------------------------|------------------------|
| `--gm-photo-top`     | `linear-gradient(180deg, rgba(0,0,0,0.50) 0%, rgba(0,0,0,0) 38%)`                 | Top hero photo         |
| `--gm-photo-bottom`  | `linear-gradient(0deg,   rgba(0,0,0,0.72) 0%, rgba(0,0,0,0) 55%)`                 | Bottom info area       |
| `--gm-photo-soft`    | `linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.40) 100%)`              | Soft bottom gradient   |

### 2.5 Semantic

| Token           | Value     | Usage                  |
|-----------------|-----------|------------------------|
| `--gm-success`  | `#10A36B` | Success toasts         |
| `--gm-warning`  | `#D89000` | Warnings               |
| `--gm-danger`   | `#E0384F` | Errors, destructive    |
| `--gm-info`     | `#007BFF` | Info (uses brand)      |

### 2.6 Gradient accents (premium surfaces)

| Token                    | Value                                                                 | Usage                          |
|--------------------------|-----------------------------------------------------------------------|--------------------------------|
| `--gm-grad-blue-aurora`  | `linear-gradient(135deg, #007BFF 0%, #5BA8FF 60%, #9CC7FF 100%)`     | Hero, premium cards            |
| `--gm-grad-sunset`       | `linear-gradient(135deg, #FF9900 0%, #FFB94D 100%)`                   | Accent CTAs                    |
| `--gm-grad-midnight`     | `linear-gradient(160deg, #0B1020 0%, #1A2240 100%)`                   | Photo fallback                 |
| `--gm-grad-aurora`       | `linear-gradient(135deg, #007BFF 0%, #B04BFF 50%, #FF7A8A 100%)`      | Optional marketing surfaces    |

---

## 3. Typography

### 3.1 Families

- **Display & UI:** `Inter` (existing), weights 400 / 500 / 600 / 700 / 800.
- No second display face. (Avoids extra `<link rel="preload">` cost.)

### 3.2 Type scale (clamped, fluid)

| Token              | Value                                       | Used for                |
|--------------------|---------------------------------------------|-------------------------|
| `--gm-text-2xs`    | `clamp(0.6875rem, 0.66rem + 0.1vw, 0.75rem)`| Eyebrow, badges         |
| `--gm-text-xs`     | `clamp(0.8125rem, 0.78rem + 0.15vw, 0.875rem)`| Meta, captions       |
| `--gm-text-sm`     | `clamp(0.875rem, 0.85rem + 0.15vw, 0.9375rem)`| Helper, body small   |
| `--gm-text-base`   | `clamp(0.95rem, 0.92rem + 0.18vw, 1.00rem)` | Body                    |
| `--gm-text-md`     | `clamp(1.05rem, 1.00rem + 0.3vw, 1.125rem)` | Card body emphasis      |
| `--gm-text-lg`     | `clamp(1.20rem, 1.10rem + 0.4vw, 1.30rem)`  | Card titles             |
| `--gm-text-xl`     | `clamp(1.45rem, 1.25rem + 0.7vw, 1.65rem)`  | Section titles          |
| `--gm-text-2xl`    | `clamp(1.75rem, 1.45rem + 1vw, 2.05rem)`    | Page titles             |
| `--gm-text-3xl`    | `clamp(2.10rem, 1.65rem + 1.4vw, 2.55rem)`  | Hero titles             |
| `--gm-text-4xl`    | `clamp(2.55rem, 1.85rem + 2vw, 3.10rem)`    | Marketing hero          |
| `--gm-text-display`| `clamp(3rem, 2.1rem + 3vw, 4.5rem)`         | Editor display          |

### 3.3 Line height & tracking

- Display headings: `1.05`–`1.15`, tracking `-0.025em`.
- Body: `1.5`, tracking `0`.
- Eyebrow / labels: `1.3`, tracking `0.04em` uppercase, `0.75rem` `font-weight: 600`.

### 3.4 Rules

- Numerics use `font-variant-numeric: tabular-nums` everywhere a number is
  displayed (counters, like counts, prices, dates).
- Truncate at 2 lines on cards with `-webkit-line-clamp: 2`.
- **No italic for emphasis.** Use weight + color.
- Display headlines use weight 700–800. Body never above 600.

---

## 4. Spacing (4-px grid)

| Token            | Value  | Notes                        |
|------------------|--------|------------------------------|
| `--gm-space-0`   | `0`    |                              |
| `--gm-space-1`   | `4px`  |                              |
| `--gm-space-2`   | `8px`  |                              |
| `--gm-space-3`   | `12px` |                              |
| `--gm-space-4`   | `16px` | Default card padding (mobile)|
| `--gm-space-5`   | `20px` | Default card padding (desktop)|
| `--gm-space-6`   | `24px` | Section gap                  |
| `--gm-space-8`   | `32px` |                              |
| `--gm-space-10`  | `40px` |                              |
| `--gm-space-12`  | `48px` | Section padding (mobile)     |
| `--gm-space-16`  | `64px` | Section padding (desktop)    |
| `--gm-space-20`  | `80px` | Editorial section padding    |
| `--gm-space-24`  | `96px` | Marketing hero padding       |
| `--gm-space-32`  | `128px`|                              |

---

## 5. Radius

| Token              | Value      | Usage                                  |
|--------------------|------------|----------------------------------------|
| `--gm-radius-xs`   | `8px`      | Tiny chips, tags                       |
| `--gm-radius-sm`   | `12px`     | Inputs                                 |
| `--gm-radius-md`   | `16px`     | Buttons, small cards                   |
| `--gm-radius-lg`   | `22px`     | Cards                                  |
| `--gm-radius-xl`   | `28px`     | Large cards, sheets                    |
| `--gm-radius-2xl`  | `36px`     | Hero elements, FAB                     |
| `--gm-radius-pill` | `9999px`   | Pills, avatars, fully-rounded controls |

---

## 6. Elevation / Shadows

| Token                | Value                                                                              | Usage                |
|----------------------|------------------------------------------------------------------------------------|----------------------|
| `--gm-shadow-xs`     | `0 1px 2px rgba(11,16,32,0.04)`                                                    |                      |
| `--gm-shadow-sm`     | `0 2px 8px rgba(11,16,32,0.06)`                                                    | Cards at rest        |
| `--gm-shadow-md`     | `0 8px 24px rgba(11,16,32,0.08)`                                                   | Cards on hover       |
| `--gm-shadow-lg`     | `0 18px 48px rgba(11,16,32,0.10)`                                                  | Floating, sheets     |
| `--gm-shadow-xl`     | `0 32px 80px rgba(11,16,32,0.16)`                                                  | Modals               |
| `--gm-shadow-photo`  | `0 22px 60px rgba(11,16,32,0.22)`                                                  | Hero photo cards     |
| `--gm-shadow-focus`  | `0 0 0 4px rgba(0,123,255,0.18)`                                                   | Focus ring           |
| `--gm-shadow-glow`   | `0 12px 40px rgba(0,123,255,0.30)`                                                 | Primary CTA glow     |
| `--gm-shadow-accent` | `0 12px 32px rgba(255,153,0,0.28)`                                                 | Accent CTA glow      |

---

## 7. Motion

### 7.1 Easing

- `--gm-ease-out`     : `cubic-bezier(0.22, 1, 0.36, 1)` (expo-out)
- `--gm-ease-in`      : `cubic-bezier(0.55, 0, 1, 0.45)`
- `--gm-ease-spring`  : `cubic-bezier(0.34, 1.56, 0.64, 1)` (gentle spring)
- `--gm-ease-emphasis`: `cubic-bezier(0.16, 1, 0.30, 1)` (snappy hero in)

### 7.2 Duration

| Token            | Value     | Usage                          |
|------------------|-----------|--------------------------------|
| `--gm-dur-fast`  | `120ms`   | Press, micro                   |
| `--gm-dur-base`  | `220ms`   | Default                        |
| `--gm-dur-slow`  | `360ms`   | Page transitions, sheet open   |
| `--gm-dur-hero`  | `600ms`   | Hero entrance, photo reveal    |
| `--gm-dur-marquee` | `32000ms`| Marquee (looped)               |

### 7.3 Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  :root {
    --gm-dur-fast: 0ms;
    --gm-dur-base: 0ms;
    --gm-dur-slow: 0ms;
    --gm-dur-hero: 0ms;
    --gm-dur-marquee: 0ms;
  }
}
```

> Mandatory on every motion-using component.

---

## 8. Layout

### 8.1 Breakpoints (mobile-first)

| Name      | min-width | Notes                                       |
|-----------|-----------|---------------------------------------------|
| `mobile`  | `0`       | Design for this first                       |
| `phablet` | `480px`   | 2-column hero CTAs                          |
| `tablet`  | `768px`   | 3-column feeds                              |
| `desktop` | `1024px`  | Sidebar appears, top bar disappears         |
| `wide`    | `1280px`  | Max content width, larger editorial spacing |
| `ultra`   | `1536px`  | Centered max content, magazine gutters      |

### 8.2 App shell

- **Mobile:** Hero header (full-bleed, photo) → search bar (floating, glass)
  → content → bottom nav (64px glass). FAB 56px above the nav.
- **Desktop:** Persistent left sidebar 240px + top bar 64px (logo + search +
  profile) + content. FAB bottom-right.

### 8.3 Page widths

- Max content width: `720px` mobile, `1080px` tablet, `1200px` desktop,
  `1320px` wide. Editorial layouts can go to `1440px`.

### 8.4 Photo-first aspect ratios

| Surface                | Aspect ratio                                  |
|------------------------|-----------------------------------------------|
| Feed card (default)    | `3 / 4` (portrait, mobile-first)              |
| Feed card (alt)        | `2 / 3` (taller, magazine feel)               |
| Hero card              | `9 / 16` (true portrait, big reveal)          |
| Travel detail hero     | `9 / 16` (or 4:5 for landscape fallback)      |
| Avatar                 | `1 / 1`                                        |
| Search result          | `3 / 4`                                        |

> Rule: if a user uploads a landscape photo, we letterbox it inside a
> portrait frame with a gentle blurred backdrop. **Never crop a memory.**

---

## 9. Iconography

- **Library:** `lucide-react` (tree-shakable, 1.5 KB per icon, 24-px grid).
  Stroke 1.75 px, rounded caps.
- **Size tokens:** `--gm-icon-sm: 16px`, `--gm-icon-md: 20px`,
  `--gm-icon-lg: 24px`, `--gm-icon-xl: 32px`.
- Color: `currentColor`. Inherits from text.

---

## 10. Components — Primitives

> Every primitive lives in `src/components/primitives/`, exports a default
> React component and a CSS file. Tokens only. No hex literals.

### 10.1 Button

- Variants: `primary` (filled brand) | `secondary` (white, border) |
  `ghost` (transparent) | `danger` | `accent` (filled accent) |
  `glass` (over photos).
- Sizes: `sm` 36px, `md` 44px, `lg` 52px, `xl` 56px.
- Icon-only variant: square, round.
- Loading state: spinner replacing label, keeps width.
- States: default / hover / press / focus / disabled / loading.
- Primary has `--gm-shadow-glow` on hover, `--gm-shadow-md` on press.
- Accent has `--gm-shadow-accent`.

### 10.2 IconButton

- Variants: `ghost` (default) | `filled` | `glass`.
- Sizes: `sm` 32, `md` 40, `lg` 48.
- Round, 24-px icon.

### 10.3 Input

- 48px height (md) / 56px (lg). 16-px text-base.
- Border `--gm-border`. Focus: `--gm-brand` border + `--gm-shadow-focus`.
- Floating label or static label.
- Error state: `--gm-danger` border + helper text.
- Optional leading/trailing icon (16/20 px).
- Counter on the right when `maxLength` is provided.

### 10.4 Textarea

- Auto-grow up to `maxRows`.
- Same border / focus rules as Input.

### 10.5 Card

- Radius `--gm-radius-lg` (mobile) / `--gm-radius-xl` (desktop).
- Background `--gm-bg-card`. Border 1px `--gm-border` (subtle on photo cards).
- Shadow `--gm-shadow-sm` at rest, `--gm-shadow-md` on hover.
- Optional padding `none` (photo-only) / `sm` / `md` / `lg`.

### 10.6 TravelCard (new — the heart of v2)

- Default 3:4 portrait, photo on top, soft bottom gradient.
- Top: author chip (avatar 32 + name), floating glass.
- Bottom: title (1 line clamp, `--gm-text-md` 600), location row
  (icon + city, country), category chips (max 2, accent on first).
- Right rail: 2 glass icon buttons (heart + bookmark) — count on heart.
- On photo tap → opens full-screen lightbox.
- Hover (desktop only): 4-px lift + `--gm-shadow-photo` + `scale(1.01)`.

### 10.7 Avatar

- 8 hand-picked gradients (curated) on fallback. Initials in white, weight
  700. Border 1px `--gm-divider` on light surfaces.
- Sizes: 24 / 32 / 40 / 56 / 80 / 120.
- Premium variant: 2-px ring in `--gm-accent`.

### 10.8 Chip

- Variants: `default` (sunken) | `brand` (brand-soft + brand) |
  `accent` (accent-soft + accent) | `glass` (over photo) | `outline`.
- 28px tall, pill. Leading icon optional.

### 10.9 Badge

- Pill, 18px tall. Variants: `brand`, `accent`, `success`, `warning`,
  `danger`, `glass`. Used for premium / verified markers, notifications.

### 10.10 Sheet (bottom sheet mobile / modal desktop)

- Mobile: slides from bottom, drag handle, max 90dvh, focus trap, Esc closes.
- Desktop: centered modal, radius `--gm-radius-xl`, max 560-px wide.

### 10.11 Toast

- Stacks bottom-center (mobile) / bottom-right (desktop).
- Variants: `success` | `info` | `danger` | `brand`.
- Auto-dismiss 4–6 s with linear progress bar at the bottom.
- Optional action button.

### 10.12 Skeleton (shimmer)

- Variants: `text`, `avatar`, `card-portrait`, `card-hero`, `list-item`.
- Shimmer via gradient sweep, respects `prefers-reduced-motion`.

### 10.13 EmptyState

- Illustration (curated SVG) + title + helper + optional CTA.

### 10.14 Divider

- 1-px hairline `--gm-divider`. Optional label.

### 10.15 SearchBar (composite of Input)

- Glass background, 48-px height, leading search icon, trailing clear.

### 10.16 TopBar (mobile + desktop)

- 64-px tall (mobile) / 72-px (desktop), sticky, glass.
- Slots: leading (back / menu), title, trailing (2 icon buttons + avatar).

### 10.17 BottomNav (mobile)

- 64-px tall + safe area. Glass, blur 24-px.
- 5 destinations max. Active item: brand color, label visible.

### 10.18 Sidebar (desktop)

- 240-px collapsible to 72-px. Logo + nav + user card.

### 10.19 HeroCard (the new hero on Home)

- Full-bleed 9:16 photo with text overlay at the bottom.
- Title, subtitle, CTA pair, glass chips for category.
- Auto-rotates on a slow Ken-Burns-style CSS animation.

### 10.20 MagazineCard (editorial tile)

- Large 2/3 or 3/4 portrait. Title overlay, eyebrow tag, author byline.
- Used in editorial sections ("Em destaque esta semana").

### 10.21 CategoryRail (horizontal scroll-snap)

- 5–8 category chips, scroll-snap-x mandatory. Selected = filled brand.

### 10.22 Marquee (optional promotional strip)

- Slow horizontal scrolling text (32s loop). Disabled on reduced-motion.

### 10.23 Lightbox (full-screen photo viewer)

- Tap-swipeable between photos, ESC closes, photos load in 9:16 letterbox.

### 10.24 LightboxTrigger (the photo)

- `<Photo src aspect priority />` with onClick → opens Lightbox.

---

## 11. Photo & Media Guidelines

- Always serve with `srcset` for retina when possible.
- `loading="lazy"` for non-hero photos, `eager` for first 2 feed items.
- `decoding="async"` on every `<img>`.
- For `<video>` in feed: `playsInline muted loop autoplay`, with a poster
  image fallback.
- All user content (descriptions, comments) passes through `utils/sanitize.js`.

---

## 12. Accessibility baseline

- All interactive elements have an accessible name.
- Visible focus ring (`--gm-shadow-focus`).
- `prefers-reduced-motion` disables all durations.
- Color contrast: text on backgrounds ≥ 4.5:1 (AA), large text ≥ 3:1.
- `aria-live="polite"` on toasts.
- Modals & sheets: focus trap, Esc closes, restore focus.
- Tap targets ≥ 44×44 px on touch.

---

## 13. Iconography mapping (lucide-react)

| Where we used                | Replace with                |
|------------------------------|-----------------------------|
| `FaHome`                     | `Home`                      |
| `FaPlane`                    | `Plane`                     |
| `FaHeart`                    | `Heart`                     |
| `FaComment`                  | `MessageCircle`             |
| `FaShareAlt`                 | `Share2`                    |
| `FaEllipsisV`                | `MoreHorizontal`            |
| `FaSearch`                   | `Search`                    |
| `FaBell`                     | `Bell`                      |
| `FaUser` / `FaUserCircle`    | `User` / `UserCircle`       |
| `FaCog`                      | `Settings`                  |
| `FaTimes`                    | `X`                         |
| `FaCamera`                   | `Camera`                    |
| `FaFlag`                     | `Flag`                      |
| `FaPaperPlane`               | `Send`                      |
| `FaPlus`                     | `Plus`                      |
| `FaCheck`                    | `Check`                     |
| `FaSync`                     | `RefreshCw`                 |
| `FaSun`                      | `Sun`                       |
| `FaStar`                     | `Star`                      |
| `FaBookmark`                 | `Bookmark`                  |
| `FaCompass`                  | `Compass`                   |
| `FaMapPin`                   | `MapPin`                    |
| `FaGlobe`                    | `Globe`                     |
| `FaUsers`                    | `Users`                     |
| `FaRoute`                    | `Route`                     |
| `FaChevronRight`             | `ChevronRight`              |
| `FaArrowRight`               | `ArrowRight`                |
| `FaArrowLeft`                | `ArrowLeft`                 |
| `FaChevronDown`              | `ChevronDown`               |

---

## 14. Do / Don't

✅ **Do**
- Lead with the photo. Whitespace, generous padding, soft bottom gradient.
- Use Inter for everything — display and body.
- Animate only meaningful transitions (200–400 ms; hero 600 ms).
- Test every screen at 390×844 (iPhone 14) first.
- Use 3:4 portrait for cards by default. Never 16:9.
- Letterbox landscape photos into a portrait frame. Never crop.

❌ **Don't**
- Drop shadows under photos — they look cheap.
- Hardcoded hex anywhere outside `tokens.css`.
- Multi-line paragraphs on cards.
- Numbers in headlines.
- 16:9 default on cards (that's the old product).
- Anything above `--gm-text-display`. Let the photo be the largest visual.

---

## 15. Home page — behaviours to preserve (no exceptions)

The Home redesign must continue to work **identically** for the following,
even if the UI is rebuilt from scratch:

### 15.1 Data & network
- Endpoint: `GET /trips/following-feed?page=&size=&sort=&text=`.
- 20 items per page, paginated, "Carregar mais" button.
- Refresh control (button on desktop, pull-to-refresh on mobile).
- Search box: searches name, country, city. Resets to page 0.
- Sort: `date` (default) / `likes`.
- Fallback to `data/travelsData.js` on network error.

### 15.2 Feed interactions
- Each travel card opens `/travel/:id` on single tap.
- Like / unlike via heart button → `POST/DELETE /trips/:id/like` (optimistic).
- Comment count opens inline (desktop) or bottom-sheet (mobile).
- Share → copy URL to clipboard, toast.
- Report → modal with 6 reasons + "Outro", `showToast` on submit.
- Swipe gestures (mobile): horizontal swipe between images; edge-swipes
  for create-trip / profile.
- Auto-slideshow on visible cards every 8 s (IntersectionObserver 0.5).

### 15.3 Comments
- Load on first open: `GET /trips/:id/comments?page=0&size=20`.
- Reply tree. Like / unlike comment.
- Add comment: `POST /trips/:id/comments` with `{ content, parentCommentId? }`.
- Sanitize via `utils/sanitize.js` + `config/commentConfig.js` validation.
- 500-char limit counter.

### 15.4 Other
- Welcome modal via `utils/welcomeModalUtils.shouldShow()`.
- Browser notification prompt.
- Header refresh event: `window.addEventListener('refreshHomeTravels', ...)`.
- Loading / empty / error states.

---

*End of v2. Implementation order:* (1) update tokens · (2) update primitives ·
(3) trash current Home · (4) build new Home from scratch · (5) ship · (6) wait
for approval.
