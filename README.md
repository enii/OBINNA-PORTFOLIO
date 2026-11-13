# Obinna Oti — Portfolio

A product design portfolio set in Tomato Grotesk. It opens on a carousel of projects; choosing one opens that project's flip book.

- **Carousel:** the projects drift slowly across the screen as closed books in an endless loop. Hovering a book pauses it. Visitors can drag, swipe, scroll or use the arrows and ← → keys, and clicking any book opens it.
- **Flip book:** the cover swings open, then readers click a page, drag a corner, swipe, or use ← → keys. **Esc** or **All projects** goes back.
- **Desktop:** each Figma frame is split across a two-page spread (16:9, like the frames).
- **Phone / tablet held upright:** one taller page at a time, with larger type.
- Each project has its own link, such as `/#sting-rays`, `/#vivonne-cabin` or `/#super-slides`.
- There's an optional page-turn sound (made in the browser, no audio files) and full screen.
- **Auto-scroll:** a few seconds after the page opens, it drifts slowly down on its own (20px a second), from the books through the animations to the footer. The first scroll, swipe, key press or click hands control to the visitor for good, so it never fights someone who is reading. Moving the mouse only holds it until the mouse has been still for 8 seconds. It stops at the bottom, and never runs while a book is open or for visitors with reduced motion turned on. The speed and timings are the `DRIFT_…` values in section 12e of `assets/js/main.js`.
- **Dark mode:** the round switch at the right of the top bar flips between light and dark. Dark mode turns the background pitch black. The site opens in dark mode; a visitor who switches to light gets light from then on (their choice is remembered). To open in light again, change `'dark'` in `assets/js/boot.js`. The colours are the `--desk…` values at the top of `assets/css/style.css`.
- The mouse pointer is a drafting cross (CAD-style, with a small square at the centre); over anything clickable the square fills in. Both are inline SVGs in `--cursor` and `--cursor-hot` at the top of `assets/css/style.css`.
- Text on the landing page rises into view as it scrolls in: the intro and caption on arrival, the Motion text and footer as you reach them. To add it to another element, give it the class `reveal`. Visitors with reduced motion turned on see the text straight away.

No build step: it's plain HTML, CSS and JavaScript.

## Run it locally

```bash
npx serve .          # or: python3 -m http.server
```

Then open the printed URL.

## Motion (animations under the carousel)

Scrolling down from the carousel reaches the animations (the top bar has no link to them). Each one plays on a loop as soon as it scrolls into view, without sound, and pauses once it has scrolled off screen. There's no control bar: clicking the video pauses it (a play button appears) and clicking again plays it; once paused, it stays paused. The carousel stops drifting while you're down there. Visitors who have reduced motion turned on in their device settings get the play button instead of autoplay.

There are four animations, in this order: Sting Rays, Super Slides, Architecture and Tangerine. Tangerine is hidden for now: delete `hidden` from its `<article class="motion__item" hidden>` in `index.html` to show it again. To reorder them, move their `<article class="motion__item">` blocks in `index.html` and renumber the "01 —" lines. While they're on screen, the companies banner sticks to the bottom of the window and they scroll behind it. To replace an animation, overwrite its files in `assets/media/`:

```
sting-rays-animation.mp4            the video (H.264 MP4)
sting-rays-animation.webm           the same video as WebM, a fallback for the few browsers without MP4
sting-rays-animation-poster.jpg     the still shown before it plays
super-slides-animation.mp4          (and .webm, -poster.jpg: the same three for Super Slides)
tangerine-animation.mp4             (and .webm, -poster.jpg: the same three for Tangerine)
architecture-animation.mp4          (and .webm, -poster.jpg: the same three for Architecture)
```

The Tangerine video is two renders joined into one loop: the jointed branch stand bending (your 960 × 540 sample, scaled up; a full-size export will be sharper), crossfading into the trio of lights, which crossfades back into the start of the branch so the loop has no jump. Send new versions of either and I'll rejoin them.

The Architecture video is your portfolio flip-book animation on white (Blackwood Cafe, Vivonne Cabin, Smith Residence), shown whole in the strip like Tangerine (`reel--whole`). Its end dissolves back into its start over half a second, so the loop has no jump; the poster is the Smith Residence cover. Its **See the books** button scrolls up to the carousel and brings the first architecture book to the centre, like **Architecture** in the top bar.

The Super Slides video is your 2560 × 1600 render cropped to 16:9 from the top (the empty space under the print bed goes) and scaled to 1920 × 1080. On the page each video shows as a full-width 21:9 strip; `--pos` on a `<video>` moves the crop up or down (Super Slides uses `50% 30%`). Tangerine is a render on white whose opened-up view fills its whole height, so it isn't cropped: `reel--whole` shows it whole in the strip on its own pure white.

To add another animation, copy an `<article class="motion__item">` block in `index.html` and point it at the new files. Tips:

- **Format:** export MP4 (H.264), 1920px wide, without sound, ideally under about 10 MB.
- **Poster:** use a strong frame as the poster image; the last frame often works well.
- **Fallback:** a WebM copy is optional. I can make one for you.

## About me

The **About me** section sits under the company banner, just above the footer, and **About** in the top bar scrolls to it. Your portrait (`assets/images/obinna-oti-portrait.webp`, 1280 × 1600) sits on the left, or above the text on phones; to change it, overwrite that file with another 4:5 photo. Its text comes from the "Who am I?" page of your 2026 portfolio (the first and last paragraphs), in `<section class="about">` in `index.html`: edit the paragraphs there (the first one is set larger, as a lead). When the section scrolls into view, your name and the text type themselves out with a blinking caret while the portrait fades in (`typeAbout` in `assets/js/main.js`, where `pace` sets the speed); visitors with reduced motion turned on see it all at once. The portrait's edges fade into the page with a radial mask (`.about__photo img` in `style.css`). Your phone number is left off the site; the email in the top bar and footer is the way to get in touch.

## Companies (the logo strip above the footer)

The companies you've worked with drift slowly along a banner under the animations, in black (white in dark mode). The banner rises into view as you scroll down from the books, then sticks to the bottom of the window while the animations scroll behind it, and settles above the footer after the last one. The animations and the banner share `<div class="motion-run">` in `index.html`; that wrapper is what limits how long the banner sticks. It pauses while the pointer is over it, and stands still in a centred row for visitors who have reduced motion turned on.

**Clients** in the top bar jumps here. (Next to it, **Products** and **Architecture** return to the books and bring the first book of that kind to the centre, **About** goes to the About me section, and **Feedback** shows as grey text until there's a section with `id="testimonials"` for it to link to; it becomes a link by itself once there is.)

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
3. Open the Studio, paste the token, check the repository, and click **Connect**. Leave the branch empty: the Studio uses the repository's default branch, the one the site is published from. The token stays in the browser tab and is only ever sent to GitHub; it's forgotten when the tab closes. On your own computer, tick **Remember on this device** to skip this step next time.

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
6. **Click Publish.** The Studio resizes and compresses the images, then saves everything to GitHub in one go. The site updates in a minute or two.

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

Sting Rays, Super Slides, Tangerine, Vivonne Cabin and Smith Residence are listed in `projects/books.js`, one entry per book. Every spread inside them is one of your Figma frames (see below). `main.js` builds each book from its entry, the same way it builds the Studio's projects: a cover, one spread per frame, and a back cover.

```js
{
  "slug": "sting-rays",                       // the link: …/#sting-rays
  "title": "Sting Rays",                      // the carousel caption
  "discipline": "Product design · Eyewear",   // the part before · also signs the back cover
  "coverStyle": "dark",                       // dark, light or image
  "cover": "assets/images/sting-rays-render-hero.webp",
  "coverTitle": "Sting\nrays",                // \n starts a new line on the cover
  "frames": [
    { "src": "assets/images/sting-rays-1-moodboard.webp", "alt": "Sting Rays, moodboard: …" },
    …
  ]
}
```

- **Carousel order** follows the order of the entries; the numbers (01, 02…) follow by themselves. The product books come first, then architecture: a book counts as architecture when its `discipline` starts with "Architecture", and that's what the top bar's **Products** and **Architecture** links use to find each group.
- **Covers:** `coverClass` and `pageClass` add the special cover treatments in `style.css` (`cover__img--centred` for Super Slides, `cover__img--photo` and `page--tangerine` for Tangerine).
- **Loading:** only the covers load with the page. A book's spreads load when it's opened.
- **Page turns:** every page peels like paper, covers included. To make the covers swing open rigidly like a hardback board instead, change `data-density="soft"` to `"hard"` in `renderBook` in `assets/js/main.js`.
- **Running heads and page numbers** ("Obinna Oti · 2020—2025") are added automatically. The years are `YEARS` at the top of `assets/js/main.js`; the footer's © year updates by itself.
- **Back cover buttons:** the "Next project" button finds the next book by itself.
- **Sizing:** everything on a page is sized in `cqw` (percent of the page width), so it scales like print. If text would overflow on a small screen, `main.js` shrinks that page's type a little.

Current books:

| Book | Pages |
|---|---|
| 01 Sting Rays | cover · moodboard · concept sketching · CAD · visualisation · visualisation detail · back cover |
| 02 Super Slides | cover · moodboard · concept sketching · CAD · render · colourways · back cover |
| 03 Tangerine | cover · moodboard (Frame 10) · concept sketching (Frame 12) · renders (Frame 48) · back cover |
| 04 Vivonne Cabin | cover · site and proposal · option 01 (gable): 3D view, plans and elevations, section, details, schedules, compliance blow-out · option 02 (split skillion): 3D view, plans and elevations, section · back cover |
| 05 Smith Residence | cover · title page (Frame 52) · floor plan, sheet A01 (Frame 55) · section and detail, sheet A03 (Frame 60) · back cover |

### Spreads made from your Figma frames

Every spread inside the books is one of your Figma frames: the frame (1920 × 1080) is rendered from your PDF at 2×, 3840 × 2160, and split down the middle, so the spread looks exactly like the design, text included. Sting Rays and Super Slides follow your booklets page for page, and Vivonne Cabin follows its pages in your 2026 portfolio PDF (those pages are already 1920 × 1080, so they are rendered at 144 dpi with no crop):

```
sting-rays-1-moodboard.webp        super-slides-1-moodboard.webp
sting-rays-2-sketching.webp        super-slides-2-sketching.webp
sting-rays-3-cad.webp              super-slides-3-cad.webp
sting-rays-4-visualisation.webp    super-slides-4-render.webp
sting-rays-5-detail.webp           super-slides-5-colourways.webp
vivonne-01-site.webp              (2026 portfolio, p. 4)
vivonne-02-option1.webp           (p. 6)
vivonne-03-plans.webp             (p. 7)
vivonne-04-section.webp           (p. 8)
vivonne-05-details.webp           (p. 9)
vivonne-06-schedules.webp         (p. 10)
vivonne-07-compliance.webp        (p. 11)
vivonne-08-option2.webp           (p. 12)
vivonne-09-option2-plans.webp     (p. 13)
vivonne-10-option2-section.webp   (p. 14)
tangerine-1-moodboard.webp   (Frame 10)
tangerine-2-sketching.webp   (Frame 12)
tangerine-3-render.webp      (Frame 48)
smith-residence-1-title.webp        (Frame 52)
smith-residence-2-floor-plan.webp   (Frame 55)
smith-residence-3-section.webp      (Frame 60)
```

To update a spread, send the new PDF (or export the frame from Figma as PNG at 2×), convert it to WebP and overwrite the file. To add one, add a `{ "src": …, "alt": … }` line to the book's `frames` in `projects/books.js`. The words are part of the image, so a description of each frame and its text is written into the image's `alt` text for screen readers. On a phone, where one page shows at a time, that text is small.

### Cover images

The covers use one render or drawing each. The Sting Rays render is still cropped from a screenshot; for the sharpest result, export it from Figma and overwrite it using the same file name:

```
sting-rays-render-hero.webp    (Sting Rays cover)
vivonne-cabin-hero.webp        (Vivonne Cabin cover: the render of the gable cabin at sunset, framed square around the whole cabin, 1226 × 1226; the render was a little too short for a tall cover, so its sky and grass are extended slightly at the top and bottom; full bleed with the title in white: coverStyle "image")
super-slides-hero.webp         (Super Slides cover: the bone slide, 1600 × 2000)
tangerine-hero.webp            (Tangerine cover: your cover frame, the three lights falling diagonally off the edges, 1400 × 1633)
smith-residence-hero.webp      (Smith Residence cover: the render, cropped square around the entry porch, 887 × 887, full bleed with the title in white: coverStyle "image")
```

The Tangerine cover shows your cover frame full bleed, with the title across the foot of the cover. Its backdrop is a soft off-white, #f9f7f7, so the Tangerine covers take on that colour (`page--tangerine` in `style.css`) and the picture has no visible edge; if you replace the render with one on a different background, change that colour to match.

### Text on the covers

The covers show their title and, in the bottom-right corner, **ISSUE 01** in a light weight (the `<p class="cover__issue">` line in `renderBook` in `assets/js/main.js`; change the number there for a new issue). The back covers show only their title and buttons: `book-text-off` on the `<html>` tag at the top of `index.html` hides the small top line and the "01 — Product design…" line. Remove it to bring those back.

### Copy

Body copy is short placeholder text written for each project. The intro line is from your Frame 3. The contact email (top right and in the footer) is otimarvelous@gmail.com. Edit all of these in `index.html`.

## Fonts

All text on the site, including the Studio, is set upright in Tomato Grotesk, from the files in `assets/fonts/`:

- **ExtraBold:** names, titles, labels and buttons (`TomatoGrotesk-ExtraBold.otf`)
- **ExtraLight:** running text, captions and small labels (`TomatoGrotesk-ExtraLightUpright.otf`)
- **SemiBold:** medium emphasis (`TomatoGrotesk-SemiBoldUpright.otf`)
- **Thin:** the large project numbers (`TomatoGrotesk-ThinUpright.otf`)

The site loads the `.woff2` copy of each (about half the size), with the `.otf` as a fallback. After changing an `.otf`, make a new `.woff2` from it, for example with fontTools: `python3 -c "from fontTools.ttLib import TTFont; f = TTFont('X.otf'); f.flavor = 'woff2'; f.save('X.woff2')"` (needs `pip install fonttools brotli`).

Only ExtraBold was supplied upright. The other weights came as Slanted files, so the `*Upright.otf` files were made from them with `tools/unslant.py`. The script straightens the 11.8° slant and was checked against the real upright ExtraBold, which it reproduces almost exactly. The original Slanted files stay in the folder as the source.

**For a true Regular weight,** or official upright files, add them to `assets/fonts/` (for example `TomatoGrotesk-Regular.otf`). Then point the `@font-face` rules at the top of `assets/css/style.css` at them. Nothing else needs to change.

This repository is public, so anyone can download the font files from it. Make sure your Tomato Grotesk licence covers web use, and that it allows modified versions of the font (the upright files). If it doesn't, send the official upright files and I'll swap them in.

## Deploy

### Netlify

The site is live at **https://obinnaoti.com** (its own domain, set up in Netlify under **Domain management**; https://obinnaoti.netlify.app is its original Netlify address). It is plain files, so Netlify serves the repository as it is: no build command, publish directory `.` (both set in `netlify.toml`). Connect the GitHub repository in Netlify and every push, including every Studio publish, redeploys the site in about a minute.

`netlify.toml` also sets the security headers: a Content Security Policy that only runs the site's own scripts, and no caching or framing for the Studio. If you add a script, font or image from another website, add its address to the policy there.

The address is written in three places in `index.html`; if it changes (for example to a custom domain), update all three: `og:url`, the canonical link, and `og:image` (as `https://…/assets/images/og-image.jpg`). LinkedIn and Facebook only show the preview image with a full address.

### GitHub Pages

1. On GitHub, open the repository's **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**, pick the repository's default branch and `/ (root)`, then **Save**.
3. After a minute or two the site is live at `https://enii.github.io/OBINNA-PORTFOLIO/`.

The empty `.nojekyll` file tells GitHub to serve the files exactly as they are. GitHub Pages can't send the security headers in `netlify.toml`, and its `404.html` and `robots.txt` only work at the root of a domain, so Netlify (or a custom domain) is the better home.

## Credits

Page turning uses [StPageFlip](https://github.com/Nodlik/StPageFlip) v2.0.7 (MIT), vendored in `assets/js/vendor/`.
