# Obinna Oti — Portfolio

A product design portfolio set in Tomato Grotesk. It opens on a carousel of projects; choosing one opens that project's flip book.

- **Carousel:** the projects drift slowly across the screen as closed books in an endless loop. Hovering a book pauses it. Visitors can drag, swipe, scroll or use the arrows and ← → keys, and clicking any book opens it.
- **Flip book:** the cover swings open, then readers click a page, drag a corner, swipe, or use ← → keys. **Esc** or **All projects** goes back.
- **Desktop:** each Figma frame is split across a two-page spread (16:9, like the frames).
- **Phone / tablet held upright:** one taller page at a time, with larger type.
- Each project has its own link, such as `/#sting-rays` or `/#vivonne-cabin`.
- There's an optional page-turn sound (made in the browser, no audio files) and full screen.

No build step: it's plain HTML, CSS and JavaScript.

## Run it locally

```bash
npx serve .          # or: python3 -m http.server
```

Then open the printed URL.

## Editing

Everything lives in `index.html`. Each project is one `<article class="book-src">` in the library at the bottom of the file:

```html
<article class="book-src" data-slug="sting-rays" data-number="01"
         data-title="Sting Rays" data-meta="Product design · Eyewear">
  <div class="page …">front cover (also the carousel card)</div>
  <div class="page">frame, left half</div>
  <div class="page">frame, right half</div>
  …
  <div class="page …">back cover</div>
</article>
```

- **Carousel order** follows the order of the articles. To change it, move an article and update its `data-number`.
- **Add a project:** copy an article, give it a new `data-slug`, and swap in its pages.
- **Pages:** odd pages sit on the left and even pages on the right. Keep each book's page count **even**.
- **Running heads and page numbers** ("Obinna Oti · 2020—2025") are added automatically.
- **Back cover buttons:** the "Next project" button finds the next book by itself.
- **Sizing:** everything on a page is sized in `cqw` (percent of the page width), so it scales like print. If text would overflow on a small screen, `main.js` shrinks that page's type a little.

Current books:

| Book | Pages |
|---|---|
| 01 Sting Rays | cover · sketches (Frame 14) · hero render (Frame 38) · back cover |
| 02 Vivonne Cabin | cover · cabin (Frame 26) · roof detail (Frame 25) · back cover |

### Images

The images in `assets/images/` are cropped from screenshots of the Figma frames. For the sharpest result, export them from Figma and overwrite them using the same file names:

```
sting-rays-render-hero.webp      (drawn across both pages of the spread, ~2500px wide)
sting-rays-sketch-side.webp
sting-rays-sketch-perspective.webp
sting-rays-sketch-construction.webp
sting-rays-sketch-final.webp
vivonne-axonometric.webp
vivonne-floor-plan.webp
vivonne-roof-section.webp
vivonne-roof-3d.webp
```

### Copy

Body copy is short placeholder text written for each project. The intro line is from your Frame 3. The contact email in the top bar is a placeholder. Edit all of these in `index.html`.

## Fonts

`assets/fonts/` contains the Tomato Grotesk files supplied:

- ExtraBold: names, titles and labels
- Thin Slanted: the large project numbers
- SemiBold Slanted, ExtraLight Slanted and ExtraBold Slanted: declared and ready to use

Only one **upright** weight (ExtraBold) was supplied, so body text uses Helvetica Neue / Arial for now. To set body copy in Tomato Grotesk, add an upright Regular or Light file and a matching `@font-face` at the top of `assets/css/style.css`, then point `--font-text` at it.

This repository is public, so anyone can download the font files from it. Make sure your Tomato Grotesk licence covers web use.

## Deploy (GitHub Pages)

1. Merge into `main`.
2. Go to **Settings → Pages**, choose **Deploy from a branch**, then select `main` and `/ (root)`.
3. The site appears at `https://<user>.github.io/OBINNA-PORTFOLIO/`.

It also works as-is on Netlify, Vercel or any static host.

## Credits

Page turning uses [StPageFlip](https://github.com/Nodlik/StPageFlip) v2.0.7 (MIT), vendored in `assets/js/vendor/`.
