# Obinna Oti — Portfolio

A product design portfolio presented as an interactive flip book, set in Tomato Grotesk.

- **Desktop:** two-page spreads (16:9, matching the Figma frames). Click a page, drag a corner, or use ← → keys.
- **Phone / tablet portrait:** one page at a time, with taller pages and larger type. Swipe or tap the page edges.
- **Index** menu, clickable contents page, and links to each project (`/#vivonne-cabin`, `/#sting-rays`, …).
- **Scroll view** toggle for anyone who prefers to scroll through every page.
- Optional page-turn sound (made in the browser, no audio files) and full screen.
- Without JavaScript the pages simply stack as a scrolling document.

No build step: it's plain HTML, CSS and JavaScript.

## Run it locally

```bash
npx serve .          # or: python3 -m http.server
```

Then open the printed URL.

## Editing

Everything lives in `index.html`. Each `<div class="page">` is one page; comments mark every spread.

| Pages | Content |
|---|---|
| 0 | Front cover |
| 1–2 | Introduction (Frame 3) |
| 3–4 | Contents (Frame 29) |
| 5–6 | 01 Vivonne Cabin (Frame 26) |
| 7–8 | Roof Detail (Frame 25) |
| 9–10 | 02 Sting Rays: sketches (Frame 14) |
| 11–12 | Sting Rays: hero render (Frame 38) |
| 13–14 | Sting Rays: details (Frame 39) |
| 15–18 | 03 and 04: template spreads to fill in |
| 19–20 | Contact |
| 21 | Back cover |

Rules of thumb:

- With the cover on its own, odd pages sit on the **left** and even pages on the **right**. Keep the total **even**.
- Add `data-section="Name" data-anchor="slug"` to the first page of a chapter to list it in the Index and give it a link.
- Running heads ("Obinna Oti · 2020—2025") and page numbers are added automatically. Change them with the `data-head-left` and `data-head-right` attributes on `#book`.
- Sizes inside pages use `cqw` (percent of the page width), so the layout scales like a printed spread. If text would overflow on a small screen, `main.js` shrinks that page's type a little.

### Images

The images in `assets/images/` were cropped from low-resolution screenshots, so they're **placeholders**. Export full-resolution versions from Figma and overwrite them using the same file names:

```
sting-rays-render-hero.webp      (drawn across both pages of the spread, ~3200px wide)
sting-rays-render-left.webp
sting-rays-render-right.webp
sting-rays-sketch-side.webp
sting-rays-sketch-perspective.webp
sting-rays-sketch-construction.webp
sting-rays-sketch-final.webp
vivonne-axonometric.webp
vivonne-floor-plan.webp
vivonne-roof-section.webp
vivonne-roof-3d.webp
```

Roughly 1600 px on the long edge works for single-page images; WebP or JPG keeps them light.

### Copy

The "Work Done" text comes from your Frame 3. All other body copy is placeholder written to match each project, and the contact links are placeholders too. Edit them in `index.html`.

## Fonts

`assets/fonts/` contains the Tomato Grotesk files supplied:

- ExtraBold: names, titles and labels
- SemiBold Slanted: taglines
- ExtraLight Slanted and Thin Slanted: the large numerals
- ExtraBold Slanted: declared but not used yet

Only one **upright** weight (ExtraBold) was supplied, so body text uses Helvetica Neue / Arial for now. To set body copy in Tomato Grotesk, add an upright Regular or Light file and a matching `@font-face` at the top of `assets/css/style.css`, then point `--font-text` at it.

This repository is public, so anyone can download the font files from it. Make sure your Tomato Grotesk licence covers web use.

## Deploy (GitHub Pages)

1. Merge into `main`.
2. Go to **Settings → Pages**, choose **Deploy from a branch**, then select `main` and `/ (root)`.
3. The site appears at `https://<user>.github.io/OBINNA-PORTFOLIO/`.

It also works as-is on Netlify, Vercel or any static host.

## Credits

Page turning uses [StPageFlip](https://github.com/Nodlik/StPageFlip) v2.0.7 (MIT), vendored in `assets/js/vendor/`.
