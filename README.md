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

## Motion (animations under the carousel)

Scrolling down from the carousel, or clicking **Motion** in the top bar, reaches the animations. Each one has a play button, a scrubber, loop and full screen. Animations pause when scrolled off screen, and the carousel stops drifting while you're down there.

To replace the Sting Rays animation, overwrite the files in `assets/media/`:

```
sting-rays-animation.mp4          the video (H.264 MP4)
sting-rays-animation.webm         the same video as WebM, a fallback for the few browsers without MP4
sting-rays-animation-poster.jpg   the still shown before it plays
```

To add another animation, copy the `<article class="motion__item">` block in `index.html` and point it at the new files. Tips:

- **Format:** export MP4 (H.264), 1920px wide, without sound, ideally under about 10 MB.
- **Poster:** use a strong frame as the poster image; the last frame often works well.
- **Fallback:** a WebM copy is optional. I can make one for you.

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
- **Order:** use the ↑ ↓ arrows in the project list, then click **Save**. Studio projects appear after the two hand-built books.
- **Drafts:** mark a project **Draft** to hide it from visitors. Drafts are still visible at `…/?drafts`.
- **Delete:** click **Delete project** in the editor, then click again to confirm.

### Behind the scenes

- **Project list:** Studio projects are stored in `projects/projects.js`, a short JSON list you can also edit by hand on GitHub. The file explains each field.
- **Images:** each project's images live in `projects/<project-name>/`.
- **Pages:** the site builds each book automatically: a cover, one spread per frame, and a back cover.

## Editing the hand-built books

Sting Rays and Vivonne Cabin are built by hand with live text, and live in `index.html`. Each is one `<article class="book-src">` in the library at the bottom of the file:

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

All text on the site, including the Studio, is set in Tomato Grotesk, from the files in `assets/fonts/`:

- **ExtraBold:** names, titles, labels and buttons
- **ExtraLight Slanted:** running text, captions and small labels
- **Thin Slanted:** the large project numbers
- **SemiBold Slanted:** medium emphasis

Only one upright weight (ExtraBold) was supplied, so running text is slanted for now. To set it upright, add `TomatoGrotesk-Light.otf` or `-Regular.otf` to `assets/fonts/`. Then change the first `"Tomato Grotesk Text"` `@font-face` at the top of `assets/css/style.css` to use it. Nothing else needs to change.

This repository is public, so anyone can download the font files from it. Make sure your Tomato Grotesk licence covers web use.

## Deploy (GitHub Pages)

1. Merge into `main`.
2. Go to **Settings → Pages**, choose **Deploy from a branch**, then select `main` and `/ (root)`.
3. The site appears at `https://<user>.github.io/OBINNA-PORTFOLIO/`.

It also works as-is on Netlify, Vercel or any static host.

## Credits

Page turning uses [StPageFlip](https://github.com/Nodlik/StPageFlip) v2.0.7 (MIT), vendored in `assets/js/vendor/`.
