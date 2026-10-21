# Obinna Oti — Portfolio

A product design portfolio set in Tomato Grotesk. It opens on a carousel of projects; choosing one opens that project's flip book.

- **Carousel:** the projects drift slowly across the screen as closed books in an endless loop. Hovering a book pauses it. Visitors can drag, swipe, scroll or use the arrows and ← → keys, and clicking any book opens it.
- **Flip book:** the cover swings open, then readers click a page, drag a corner, swipe, or use ← → keys. **Esc** or **All projects** goes back.
- **Desktop:** each Figma frame is split across a two-page spread (16:9, like the frames).
- **Phone / tablet held upright:** one taller page at a time, with larger type.
- Each project has its own link, such as `/#sting-rays`, `/#vivonne-cabin` or `/#super-slides`.
- There's an optional page-turn sound (made in the browser, no audio files) and full screen.
- **Dark mode:** the round switch at the right of the top bar flips between light and dark. Dark mode turns the background pitch black. Until a visitor chooses, the site follows their device's setting; their choice is remembered. The colours are the `--desk…` values at the top of `assets/css/style.css`.
- The mouse pointer is a drafting cross (CAD-style, with a small square at the centre); over anything clickable the square fills in. Both are inline SVGs in `--cursor` and `--cursor-hot` at the top of `assets/css/style.css`.
- Text on the landing page rises into view as it scrolls in: the intro and caption on arrival, the Motion text and footer as you reach them. To add it to another element, give it the class `reveal`. Visitors with reduced motion turned on see the text straight away.

No build step: it's plain HTML, CSS and JavaScript.

## Run it locally

```bash
npx serve .          # or: python3 -m http.server
```

Then open the printed URL.

## Motion (animations under the carousel)

Scrolling down from the carousel, or clicking **Motion** in the top bar, reaches the animations. Each one plays on a loop as soon as it scrolls into view, without sound, and pauses once it has scrolled off screen. There's no control bar: clicking the video pauses it (a play button appears) and clicking again plays it; once paused, it stays paused. The carousel stops drifting while you're down there. Visitors who have reduced motion turned on in their device settings get the play button instead of autoplay.

There are two animations, Sting Rays and then Super Slides. While they're on screen, the companies banner sticks to the bottom of the window and they scroll behind it. To replace an animation, overwrite its files in `assets/media/`:

```
sting-rays-animation.mp4            the video (H.264 MP4)
sting-rays-animation.webm           the same video as WebM, a fallback for the few browsers without MP4
sting-rays-animation-poster.jpg     the still shown before it plays
super-slides-animation.mp4          (and .webm, -poster.jpg: the same three for Super Slides)
```

The Super Slides video is your 2560 × 1600 render cropped to 16:9 from the top (the empty space under the print bed goes) and scaled to 1920 × 1080. On the page each video shows as a full-width 21:9 strip; `--pos` on a `<video>` moves the crop up or down (Super Slides uses `50% 30%`).

To add another animation, copy an `<article class="motion__item">` block in `index.html` and point it at the new files. Tips:

- **Format:** export MP4 (H.264), 1920px wide, without sound, ideally under about 10 MB.
- **Poster:** use a strong frame as the poster image; the last frame often works well.
- **Fallback:** a WebM copy is optional. I can make one for you.

## Companies (the logo strip above the footer)

The companies you've worked with drift slowly along a banner under the animations, in black (white in dark mode). The banner rises into view as you scroll down from the books, then sticks to the bottom of the window while the animations scroll behind it, and settles above the footer after the last one. The animations and the banner share `<div class="motion-run">` in `index.html`; that wrapper is what limits how long the banner sticks. It pauses while the pointer is over it, and stands still in a centred row for visitors who have reduced motion turned on.

**Clients** in the top bar jumps here. (Next to it, **Products** returns to the books, **Motion** goes to the animations, and **Feedback** shows as grey text until there's a section with `id="testimonials"` for it to link to; it becomes a link by itself once there is.)

The list is in `index.html`, inside `<section class="logos">`: one `<li class="logos__item">` per company. Add, remove or reorder them there; the strip repeats them to fill any screen and loops without a seam.

For now each company is its name set in type. To show the real logo instead:

1. Put the logo file in `assets/logos/`. SVG is best, but PNG works. Any colour is fine: the site turns every logo black (white in dark mode).
2. Replace the name with the image, for example:

```html
<li class="logos__item"><img src="assets/logos/paystack.svg" alt="Paystack"></li>
```

Logos show about 34px tall on desktop; very wide ones are capped at 180px wide.

## Adding new projects (the Studio)

New projects are added in the **Studio**, a private page on the site at `…/studio.html` (it isn't linked anywhere and search engines are told to skip it). No code needed.

### One-time setup

1. Put the site online (see **Deploy** below) so the Studio has an address, for example `https://enii.github.io/OBINNA-PORTFOLIO/studio.html`.
2. Create a GitHub access token for the Studio:
   1. Open [GitHub → New fine-grained token](https://github.com/settings/personal-access-tokens/new).
   2. Name it "Portfolio Studio" and pick an expiry date.
   3. Under **Repository access**, choose **Only select repositories** and pick `OBINNA-PORTFOLIO`.
   4. Under **Permissions → Repository permissions**, set **Contents** to **Read and write**.
   5. Generate the token.
3. Open the Studio, paste the token, check the repository and branch (the branch the site is published from, usually `main`), and click **Connect**. Tick **Remember on this device** to skip this step next time. The token stays in your browser and is only ever sent to GitHub.

### Each new project

1. **Export from Figma.** Design each spread as a 16:9 frame, like the existing ones, and export every frame as PNG or JPG at 2×. Optionally export a cover image too, such as a render or a drawing.
2. **Open the Studio and click New project.** Add a title and a discipline (e.g. `Product design · Footwear`).
3. **Choose a cover style:**
   - **Dark:** for renders on black.
   - **Light:** for drawings on white.
   - **Photo:** the image fills the cover.

   Then drop in the cover image. It's optional; without one, the cover is set in type.
4. **Drop in the frames.** They're ordered by file name (Frame 1, Frame 2…). Drag thumbnails or use the arrows to reorder. Each frame becomes one two-page spread. The dashed line on each thumbnail shows where the page fold falls.
5. **Click Preview book** to see the flip book exactly as it will appear on the site.
6. **Click Publish.** The Studio resizes and compresses the images, then saves everything to GitHub in one go. The site updates in about a minute.

### Managing projects

- **Edit:** change the details, add, remove or reorder frames, swap the cover, then publish again. Images the project no longer uses are removed.
- **Order:** use the ↑ ↓ arrows in the project list, then click **Save**. Studio projects appear after the hand-built books.
- **Drafts:** mark a project **Draft** to hide it from visitors. Drafts are still visible at `…/?drafts`.
- **Delete:** click **Delete project** in the editor, then click again to confirm.

### Behind the scenes

- **Project list:** Studio projects are stored in `projects/projects.js`, a short JSON list you can also edit by hand on GitHub. The file explains each field.
- **Images:** each project's images live in `projects/<project-name>/`.
- **Pages:** the site builds each book automatically: a cover, one spread per frame, and a back cover.

## Editing the hand-built books

Sting Rays, Vivonne Cabin, Super Slides and Tangerine live in `index.html`. Every spread inside them is one of your Figma frames (see below); only the covers and back covers are built in HTML. Each book is one `<article class="book-src">` in the library at the bottom of the file:

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
- **Pages:** odd pages sit on the left and even pages on the right. Keep each book's page count **even**.
- **Page turns:** every page peels like paper, covers included. To make a cover swing open rigidly like a hardback board instead, change `data-density="soft"` to `"hard"` on it in `index.html` (and in `projectBook` in `assets/js/main.js` for Studio projects).
- **Running heads and page numbers** ("Obinna Oti · 2020—2025") are added automatically.
- **Back cover buttons:** the "Next project" button finds the next book by itself.
- **Sizing:** everything on a page is sized in `cqw` (percent of the page width), so it scales like print. If text would overflow on a small screen, `main.js` shrinks that page's type a little.

Current books:

| Book | Pages |
|---|---|
| 01 Sting Rays | cover · moodboard · concept sketching · CAD · visualisation · visualisation detail · back cover |
| 02 Vivonne Cabin | cover · the cabin (Frame 26) · the structure (Frame 30) · roof detail (Frame 25) · back cover |
| 03 Super Slides | cover · moodboard · concept sketching · CAD · render · colourways · back cover |
| 04 Tangerine | cover · moodboard (Frame 10) · concept sketching (Frame 12) · back cover |

### Spreads made from your Figma frames

Every spread inside the books is one of your Figma frames: the frame (1920 × 1080) is rendered from your PDF at 2×, 3840 × 2160, and split down the middle, so the spread looks exactly like the design, text included. Sting Rays and Super Slides follow your booklets page for page:

```
sting-rays-1-moodboard.webp        super-slides-1-moodboard.webp
sting-rays-2-sketching.webp        super-slides-2-sketching.webp
sting-rays-3-cad.webp              super-slides-3-cad.webp
sting-rays-4-visualisation.webp    super-slides-4-render.webp
sting-rays-5-detail.webp           super-slides-5-colourways.webp
vivonne-frame-26.webp   (the cabin)
vivonne-frame-30.webp   (the structure)
vivonne-frame-25.webp   (roof detail)
tangerine-1-moodboard.webp   (Frame 10)
tangerine-2-sketching.webp   (Frame 12)
```

To update a spread, send the new PDF (or export the frame from Figma as PNG at 2×), convert it to WebP and overwrite the file. To add one, copy a `<!-- … -->` pair of frame pages in `index.html` and point both at the new file. The words are part of the image, so a description of each frame and its text is written into the image's `alt` text for screen readers. On a phone, where one page shows at a time, that text is small.

### Cover images

The covers use one render or drawing each. The Sting Rays render and the Vivonne axonometric are still cropped from screenshots; for the sharpest result, export them from Figma and overwrite them using the same file names:

```
sting-rays-render-hero.webp    (Sting Rays cover)
vivonne-axonometric.webp       (Vivonne Cabin cover)
super-slides-hero.webp         (Super Slides cover: the bone slide, 1600 × 2000)
tangerine-hero.webp            (Tangerine cover: two of the lamps, rendered on white, 1312 × 1199)
```

The Tangerine render sits across the top of a white cover, above the title (`cover__img--photo`); its own white backdrop blends into the cover.

### Text on the covers

The covers show only their titles, and the back covers only their title and buttons: `book-text-off` on the `<html>` tag at the top of `index.html` hides the small top line and the "01 — Product design…" line. Remove it to bring those back.

### Copy

Body copy is short placeholder text written for each project. The intro line is from your Frame 3. The contact email (top right and in the footer) is otimarvelous@gmail.com. Edit all of these in `index.html`.

## Fonts

All text on the site, including the Studio, is set upright in Tomato Grotesk, from the files in `assets/fonts/`:

- **ExtraBold:** names, titles, labels and buttons (`TomatoGrotesk-ExtraBold.otf`)
- **ExtraLight:** running text, captions and small labels (`TomatoGrotesk-ExtraLightUpright.otf`)
- **SemiBold:** medium emphasis (`TomatoGrotesk-SemiBoldUpright.otf`)
- **Thin:** the large project numbers (`TomatoGrotesk-ThinUpright.otf`)

Only ExtraBold was supplied upright. The other weights came as Slanted files, so the `*Upright.otf` files were made from them with `tools/unslant.py`. The script straightens the 11.8° slant and was checked against the real upright ExtraBold, which it reproduces almost exactly. The original Slanted files stay in the folder as the source.

**For a true Regular weight,** or official upright files, add them to `assets/fonts/` (for example `TomatoGrotesk-Regular.otf`). Then point the `@font-face` rules at the top of `assets/css/style.css` at them. Nothing else needs to change.

This repository is public, so anyone can download the font files from it. Make sure your Tomato Grotesk licence covers web use, and that it allows modified versions of the font (the upright files). If it doesn't, send the official upright files and I'll swap them in.

## Deploy (GitHub Pages)

1. On GitHub, open the repository's **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**, pick the branch the site lives on (today that's `claude/portfolio-flipbook-design-fz5q29`, the repository's default branch) and `/ (root)`, then **Save**.
3. After a minute or two the site is live at `https://enii.github.io/OBINNA-PORTFOLIO/`. Every push to that branch updates it.

The empty `.nojekyll` file tells GitHub to serve the files exactly as they are. To use your own domain (say obinnaoti.com), enter it under **Custom domain** on the same page and follow GitHub's DNS instructions at your registrar.

It also works as-is on Netlify, Vercel or any static host.

## Credits

Page turning uses [StPageFlip](https://github.com/Nodlik/StPageFlip) v2.0.7 (MIT), vendored in `assets/js/vendor/`.
