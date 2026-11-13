/* The hand-built books: one entry per flip book, in carousel order.
 * Projects added with the Studio (projects/projects.js) follow these.
 *
 *   slug         short name used in the link (…/#sting-rays)
 *   title        shown in the carousel caption
 *   discipline   "Practice · Field"; the part before the · also signs the back cover
 *   coverStyle   "dark" (renders on black), "light" (drawings on white) or "image" (photo fills the cover)
 *   cover        the cover image
 *   coverClass   extra classes for the cover image (cover__img--centred, --photo; see style.css)
 *   pageClass    extra classes for both covers (page--tangerine)
 *   coverTitle   the title as set on the cover; a line break (\n) starts a new line
 *   frames       Figma frames in reading order, each split across a two-page spread.
 *                Leave it empty ([]) and the book opens to one blank spread until its pages are ready.
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
        "alt": "Sting Rays, moodboard: reference images of sculpted sports eyewear and manta rays, with tone swatches in aqua, ivory, blues, coral and green. Inspired by the fluid movement and distinctive anatomy of stingrays, the design explores the intersection of marine biology and futuristic eyewear. The stingray's sweeping wings, streamlined body and elongated tail inform a sculptural silhouette that balances organic movement with aerodynamic precision. Tone: a contrast between aquatic depth and vibrant marine energy; electric blues, iridescent greens and warm metallic golds, balanced by softer ivory and muted olive."
      },
      {
        "src": "assets/images/sting-rays-2-sketching.webp",
        "alt": "Sting Rays, concept sketching: a stingray outline abstracted into construction lines, its wing and tail geometry carried into the frame, front frame variations, temple profiles, side profile development and three-quarter refinement. Process: initial sketches explore the stingray's sweeping wings, tapered tail and fluid body; simplified line studies abstract them into sharp, aerodynamic geometries. The wings inspire the frame's extended contours and the tail the streamlined temples."
      },
      {
        "src": "assets/images/sting-rays-3-cad.webp",
        "alt": "Sting Rays, CAD (Rhino subdivision modelling): wireframe views of the frame and its four parts, the left hand and hinge, the right hand and hinge, the eye frame and bridge, and the detachable lens. Process: the refined sketches were rebuilt in Rhino using SubD, keeping the soft, continuous surfaces while controlling every edge. The temples sweep back like the ray's wings and taper towards the ear like its tail; the hinges sit inside the curve of the frame, and the lens detaches so tints can be swapped."
      },
      {
        "src": "assets/images/sting-rays-4-visualisation.webp",
        "alt": "Sting Rays, visualisation: a close render of the cobalt frame with its amber lining and gold hinge on black, beside the frame in three colourways. Building on the technical sketches, the selected concept is developed into a detailed 3D model, balancing expressive, organic forms with structural precision."
      },
      {
        "src": "assets/images/sting-rays-5-detail.webp",
        "alt": "Sting Rays, visualisation: a close render of the cobalt frame and its gold hinge on black. Through careful surface modelling, the sweeping contours and sculptural transitions are refined into one continuous flow; close-ups focus on the hinge, where the gold accent sits inside the temple."
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
        "alt": "Super Slides, moodboard: reference images of sculpted foam footwear and soft textures, with tone swatches in sage, ivory, powder blue, coral and periwinkle. Exploring the intersection of sculptural form, layered cushioning and contemporary comfort, this moodboard sets the visual and material direction for a soft double-foam slide: organic contours, fluid transitions and exaggerated volumes, with a dual-density foam construction. Tone: muted sage green, warm ivory and powder blue, with vibrant coral, periwinkle and cool lavender."
      },
      {
        "src": "assets/images/super-slides-2-sketching.webp",
        "alt": "Super Slides, concept sketching: standard slide shapes with gripped soles, a thick sole split into two and recombined, and the final double-sole concept. Process: the sketches explore slide shapes, grip patterns and outsole shapes, then split a thick, exaggerated sole into two layers and recombine them. The result is the Super Slide: two layers of cushioning working together, with the layered construction as the defining feature."
      },
      {
        "src": "assets/images/super-slides-3-cad.webp",
        "alt": "Super Slides, CAD: wireframe views of the outsole grip pattern from underneath and above, a side elevation with a foot for scale showing the upper on the double sole, and the lower sole layer separated. Process: the concept was developed in Rhino using SubD, with the upper and the two sole layers modelled as separate components and refined so they come together seamlessly."
      },
      {
        "src": "assets/images/super-slides-4-colourways.webp",
        "alt": "Super Slides, visualisation: the slide in bone, the slide in sage, olive and navy, and a close-up of the rippled sole, on black. Different colourways and soft matte finishes bring out the foam-like material; dark backgrounds and controlled lighting let the form and the double-sole silhouette stand out."
      },
      {
        "src": "assets/images/super-slides-5-render.webp",
        "alt": "Super Slides, visualisation: a close render of the slide in bone on black. The final CAD model was taken into KeyShot; dramatic, high-contrast lighting exaggerates the sculptural curves and the layered sole."
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
        "alt": "Tangerine, moodboard: lamps and lights in wood, glass and coloured metal, from a branching stand and hanging globes to domed lamps and bent tube lights, with tone swatches in olive, sage, tangerine, coral and yellow. Tangerine started with a simple question: what if light could be picked like fruit? The moodboard gathers objects that sit between lamp and sculpture: soft domes, glowing spheres, bent tubes and stands that grow like branches. The direction: a modular, branch-like stand holding small portable light pods that can be lifted off and carried. Range: fruit-shaped torch pods with +/- controls that dock onto the stand and charge by magnetic contact; olive and sage for the stand, tangerine, coral and warm yellow for the pods."
      },
      {
        "src": "assets/images/tangerine-2-sketching.webp",
        "alt": "Tangerine, brief and sketching: hands holding a fruit-shaped torch light, studies of the pod, and branching modular stands it plugs into. Brief: design a lamp that is more than a fixed light; a stand with detachable light pods, each shaped like a small fruit, that work as hand-held torches and return to the stand to charge. The stand should feel organic, not mechanical, like a branch holding fruit, and be modular and easy to assemble."
      },
      {
        "src": "assets/images/tangerine-3-cad.webp",
        "alt": "Tangerine, CAD sketching: line drawings of the pod in front, side and section views, and the stand built from bent tube segments, labelled detachable pod, pod docked on top, tube collar joint, docking pocket, pod in side pocket and stand base. Process: developed in Rhino using SubD; pockets in the lower and top tubes let a pod dock and charge by magnetic contact, and the wide base keeps the stand stable with both pods attached."
      },
      {
        "src": "assets/images/tangerine-4-colourways.webp",
        "alt": "Tangerine, visualisation: the pod in lilac on black, the pods in lilac, tangerine and soft green, and a close-up of the lilac pod's controls and cap. Each pod was tested across a family of colourways; soft matte finishes make them friendly and tactile, and a white diffuser cap stays constant so they read as one product."
      },
      {
        "src": "assets/images/tangerine-5-stand.webp",
        "alt": "Tangerine, visualisation: the stand rendered on its own in lilac and in tangerine against a clean background, its tube segments reading as one continuous branch, with the joints, pockets and base as quiet details."
      }
    ]
  },
  {
    "slug": "vivonne-cabin",
    "title": "Vivonne Cabin",
    "discipline": "Architecture · Residential",
    "coverStyle": "image",
    "cover": "assets/images/vivonne-cabin-hero.webp",
    "coverTitle": "Vivonne\ncabin",
    "frames": [
      {
        "src": "assets/images/vivonne-01-site.webp",
        "alt": "Vivonne Cabin, site and proposal: lot 143 on Crabb Road, 828 m² falling 1.5 m towards the bay, with its bushfire, coastal, flooding and native vegetation overlays, and notes on the two options for the same 10.66 × 6.66 m cabin."
      },
      {
        "src": "assets/images/vivonne-02-option1.webp",
        "alt": "Vivonne Cabin, option 01: a 3D view of the gable-roofed cabin among trees on its steel piers, with its deck, stair and full-height glazing, beside the project details, the context and the list of sheets."
      },
      {
        "src": "assets/images/vivonne-03-plans.webp",
        "alt": "Vivonne Cabin, option 01, floor plan and elevations (sheet A02, 1:50): the floor plan with dimensions and room areas, and the north, south, east and west elevations. Overview: this stage developed the floor plan and elevations, planning internal spaces, positioning doors and windows, establishing dimensions and specifying materials and finishes."
      },
      {
        "src": "assets/images/vivonne-04-section.webp",
        "alt": "Vivonne Cabin, option 01, section and detail (sheet A03): section 01 through the living area and bathroom at 1:25, from the Colorbond roof down to the Uni-Pier footing, with a footing detail at 1:10. Overview: this stage developed detailed building sections and construction details to understand how the structural elements come together."
      },
      {
        "src": "assets/images/vivonne-05-details.webp",
        "alt": "Vivonne Cabin, option 01, details (sheet A04): 3D construction assemblies of the Uni-Pier and Pryda hanger, the external wall system and the internal wall system. Overview: this stage modelled how the building components connect, using manufacturer specifications, to improve the accuracy of the building model and resolve construction details."
      },
      {
        "src": "assets/images/vivonne-06-schedules.webp",
        "alt": "Vivonne Cabin, option 01: the door and window schedules, beside the general, timber and project notes."
      },
      {
        "src": "assets/images/vivonne-07-compliance.webp",
        "alt": "Vivonne Cabin, option 01, compliance blow-out: an exploded view of the roof, wall and floor systems, each annotated with how it meets the NCC 2022 Housing Provisions and AS 3959, from the corrosion-rated Colorbond roof to the BAL-40 rated cladding."
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
    "slug": "smith-residence",
    "title": "Smith Residence",
    "discipline": "Architecture · Residential",
    "coverStyle": "image",
    "cover": "assets/images/smith-residence-hero.webp",
    "coverTitle": "Smith\nresidence",
    "frames": [
      {
        "src": "assets/images/smith-residence-1-title.webp",
        "alt": "Smith Residence: a render of the single-storey brick house at golden hour, with its hipped roof, a gabled carport and a gabled entry porch on white columns, under the title Smith Residence, Building Design & Drafting."
      },
      {
        "src": "assets/images/smith-residence-2-site-plan.webp",
        "alt": "Smith Residence, site plan (sheet A01): the house on its lot with the north point, boundaries and notes, beside the site information and the proposal."
      },
      {
        "src": "assets/images/smith-residence-3-overview.webp",
        "alt": "Smith Residence, project overview: two 3D views of the house, one from the entry porch and one from the carport, beside the project details, the context and the list of sheets."
      },
      {
        "src": "assets/images/smith-residence-4-floor-plan.webp",
        "alt": "Smith Residence, floor plan (sheet A03, 1:50): the dimensioned plan of the family room, kitchen, dining, laundry, bathroom, WC and three bedrooms with the carport and deck, beside a colour-coded plan of the rooms."
      },
      {
        "src": "assets/images/smith-residence-5-kitchen.webp",
        "alt": "Smith Residence, floor plan blow-out (sheet A04): two kitchen layout options drawn at a larger scale, with the general notes for the kitchen."
      },
      {
        "src": "assets/images/smith-residence-6-elevations.webp",
        "alt": "Smith Residence, elevations (sheet A05, 1:50): the north, south, east and west elevations, with the brick veneer, roof pitches, carport and porch gables annotated."
      },
      {
        "src": "assets/images/smith-residence-7-section.webp",
        "alt": "Smith Residence, section and detail (sheet A06): a section through the house showing the roof framing on a raft slab, with a 3D detail and a section of the brick veneer wall meeting the slab and paving."
      }
    ]
  },
  {
    "slug": "blackwood-cafe",
    "title": "Blackwood Cafe",
    "discipline": "Architecture · Hospitality",
    "coverStyle": "image",
    "cover": "assets/images/blackwood-cafe-hero.webp",
    "coverTitle": "Blackwood\ncafe",
    "frames": []
  }
];
