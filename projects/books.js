/* The hand-built books: one entry per flip book, in carousel order.
 * Projects added with the Studio (projects/projects.js) follow these.
 *
 *   slug         short name used in the link (…/#sting-rays)
 *   title        shown in the carousel caption
 *   discipline   "Practice · Field"; the part before the · also signs the back cover
 *   coverStyle   "dark" (renders on black), "light" (drawings on white) or "image" (photo fills the cover)
 *   cover        the cover image
 *   coverClass   extra classes for the cover image (cover__img--fill, --centred, --photo; see style.css)
 *   pageClass    extra classes for both covers (page--tangerine)
 *   coverTitle   the title as set on the cover; a line break (\n) starts a new line
 *   frames       Figma frames in reading order, each split across a two-page spread.
 *                Each one's alt text describes the frame and the words in it, for screen readers.
 */
window.BOOKS = 
[
  {
    "slug": "sting-rays",
    "title": "Sting Rays",
    "discipline": "Product design · Eyewear",
    "coverStyle": "dark",
    "cover": "assets/images/sting-rays-render-hero.webp",
    "coverTitle": "Sting\nrays",
    "frames": [
      {
        "src": "assets/images/sting-rays-1-moodboard.webp",
        "alt": "Sting Rays, moodboard: reference images of sculpted sports eyewear and manta rays, with a tone palette of olive, coral, orange and blues. Moodboard: inspired by the fluid movement and distinctive anatomy of stingrays, the design explores the intersection of marine biology and futuristic eyewear."
      },
      {
        "src": "assets/images/sting-rays-2-sketching.webp",
        "alt": "Sting Rays, concept sketching: line studies of a stingray beside a red geometric construction of its form, front-view lens studies, temple sketches, and side and perspective sketches of the frame. Concept Sketching: initial sketches explore the distinctive silhouette of stingrays, focusing on their sweeping wings, tapered tails and fluid body contours. Process: the design process begins by studying the stingray's anatomy and translating its defining features into functional eyewear elements."
      },
      {
        "src": "assets/images/sting-rays-3-cad.webp",
        "alt": "Sting Rays, CAD (Rhino subdivision modelling): wireframe views of the frame and its parts: the left hand and hinge, the right hand and hinge, the eye frame and bridge, and the detachable lens."
      },
      {
        "src": "assets/images/sting-rays-4-visualisation.webp",
        "alt": "Sting Rays, visualisation: a close render of the cobalt frame with its amber lining and gold hinge, beside the frame in three colourways. Visualisation: building on the technical sketches, the selected concept is developed into a detailed 3D model, transforming the initial two-dimensional explorations into a fully realised product. This stage focuses on translating the stingray's distinctive anatomy into a cohesive eyewear design, balancing expressive, organic forms with structural precision and functional considerations."
      },
      {
        "src": "assets/images/sting-rays-5-detail.webp",
        "alt": "Sting Rays, visualisation: two close renders of the cobalt frame, one showing the metal hinge and one the gold hinge inside the amber lining. Visualisation: through careful surface modelling, the sweeping contours, tapered extensions and sculptural transitions are refined to create a continuous visual flow across the frame."
      }
    ]
  },
  {
    "slug": "vivonne-cabin",
    "title": "Vivonne Cabin",
    "discipline": "Architecture · Residential",
    "coverStyle": "light",
    "cover": "assets/images/vivonne-axonometric.webp",
    "coverClass": "cover__img--fill",
    "coverTitle": "Vivonne\ncabin",
    "frames": [
      {
        "src": "assets/images/vivonne-01-site.webp",
        "alt": "Vivonne Cabin, site and proposal: lot 143 on Crabb Road, 828 m² falling 1.5 m towards the bay, with its bushfire, coastal, flooding and native vegetation overlays, and notes on the two options for the same 10.66 × 6.66 m cabin."
      },
      {
        "src": "assets/images/vivonne-02-option1.webp",
        "alt": "Vivonne Cabin, option 01: a 3D view of the gable-roofed cabin among trees on its steel piers, with its deck, stair and full-height glazing, beside the project details and context notes."
      },
      {
        "src": "assets/images/vivonne-03-plans.webp",
        "alt": "Vivonne Cabin, option 01: floor plan with dimensions and room areas, and the north, south, east and west elevations at 1:50."
      },
      {
        "src": "assets/images/vivonne-04-section.webp",
        "alt": "Vivonne Cabin, option 01: section 01 through the living area and bathroom at 1:25, from the Colorbond roof down to the Uni-Pier footing, with a footing detail at 1:10."
      },
      {
        "src": "assets/images/vivonne-05-details.webp",
        "alt": "Vivonne Cabin, option 01: construction details of the Uni-Pier and Prydar hanger, the external wall system and the internal wall system."
      },
      {
        "src": "assets/images/vivonne-06-schedules.webp",
        "alt": "Vivonne Cabin, option 01: the door and window schedules, beside the general, timber and project notes."
      },
      {
        "src": "assets/images/vivonne-07-compliance.webp",
        "alt": "Vivonne Cabin, option 01: an exploded view of the roof, wall and floor systems, each annotated with how it meets the NCC 2022 Housing Provisions and AS 3959."
      },
      {
        "src": "assets/images/vivonne-08-option2.webp",
        "alt": "Vivonne Cabin, option 02: a 3D view of the split-skillion cabin, two offset roofs over the same plan on steel piers, beside the project details and context notes."
      },
      {
        "src": "assets/images/vivonne-09-option2-plans.webp",
        "alt": "Vivonne Cabin, option 02: floor plan with dimensions and room areas, and the four elevations at 1:50."
      },
      {
        "src": "assets/images/vivonne-10-option2-section.webp",
        "alt": "Vivonne Cabin, option 02: section 01 through the living area and bathroom at 1:25, showing the Colorbond roof, Stria-clad timber walls and Structaflor floor on galvanised Uni-Piers, with a detail at 1:10."
      }
    ]
  },
  {
    "slug": "super-slides",
    "title": "Super Slides",
    "discipline": "Product design · Footwear",
    "coverStyle": "dark",
    "cover": "assets/images/super-slides-hero.webp",
    "coverClass": "cover__img--centred",
    "coverTitle": "Super\nslides.",
    "frames": [
      {
        "src": "assets/images/super-slides-1-moodboard.webp",
        "alt": "Super Slides, moodboard: reference images of sculpted foam footwear and soft textures, with a tone palette of sage, cream, coral, blue and lavender. Moodboard: exploring the intersection of sculptural form, layered cushioning and contemporary comfort, this moodboard establishes the visual and material direction for a soft double-foam slide concept."
      },
      {
        "src": "assets/images/super-slides-2-sketching.webp",
        "alt": "Super Slides, concept sketching: side-view sketches of slide shapes and soles, a thick sole split into two and recombined, and the final double-sole concept. Process: the design process focused on refining the slide's overall shape while developing the idea of a double-sole construction. Starting with a thick, exaggerated sole, I explored splitting it into two individual layers, then superimposing and recombining them to create a more interesting silhouette. The result is the concept of a Super Slide: two layers of cushioning working together to create extra comfort, with the layered construction becoming the defining feature of the design."
      },
      {
        "src": "assets/images/super-slides-3-cad.webp",
        "alt": "Super Slides, CAD: wireframe views of the slide and its two sole layers, modelled in Rhino with SubD."
      },
      {
        "src": "assets/images/super-slides-4-render.webp",
        "alt": "Super Slides: a close render of the slide in bone. Process: the final CAD model was brought into KeyShot to explore materials, colours and lighting, bringing the Super Slides concept to life through realistic 3D visualisation. I experimented with dramatic, high-contrast lighting to exaggerate the sculptural curves, flowing surfaces and layered sole construction."
      },
      {
        "src": "assets/images/super-slides-5-colourways.webp",
        "alt": "Super Slides: the slide in bone, the slide in sage, olive and lavender, and a close-up of the rippled sole. Process: different colourways and soft matte finishes were explored to highlight the foam-like material qualities, while close-up renders focus on the outsole detailing and subtle surface textures."
      }
    ]
  },
  {
    "slug": "tangerine",
    "title": "Tangerine",
    "discipline": "Product design · Lighting",
    "coverStyle": "light",
    "cover": "assets/images/tangerine-hero.webp",
    "coverClass": "cover__img--photo",
    "pageClass": "page--tangerine",
    "coverTitle": "Tangerine",
    "frames": [
      {
        "src": "assets/images/tangerine-1-moodboard.webp",
        "alt": "Tangerine, moodboard: lamps and lights in wood, glass and coloured metal, from a branching wooden stand and hanging globe lights to a mushroom lamp and a yellow tube light, beside the tone swatches."
      },
      {
        "src": "assets/images/tangerine-2-sketching.webp",
        "alt": "Tangerine, concept sketching: hands holding a fruit-shaped torch light, studies of the light in section, and branching modular stands it plugs into."
      },
      {
        "src": "assets/images/tangerine-3-render.webp",
        "alt": "Tangerine, renders: the light in purple and white on black, beside the three colourways, purple, orange and green, and close-ups of their two-button tops."
      }
    ]
  }
];
