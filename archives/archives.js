/* Archives: the files on the Archives page (archives.html), newest first. Visitors can download each one,
 * and turn the ones with a 3D model around in 3D, drawn as a hidden-line drawing.
 *
 * The Studio (studio.html) writes this file when you upload or remove a file there. To edit it by
 * hand, keep the first and last lines as they are; everything between the brackets is plain JSON.
 * The files themselves live in archives/files/, their 3D models in archives/models/.
 *
 *   title   the name shown on the site
 *   file    the file to download, e.g. "archives/files/elizabeth-st-drawing-set.pdf"
 *   size    its size in bytes (shown as KB or MB)
 *   type    the file type shown on the site (PDF, ZIP, DWG…)
 *   added   the date it was added, as YYYY-MM-DD
 *   note    optional: one line about it
 *   model   optional: a 3D model of it to turn around on the page, as a .glb file (glTF binary, which
 *           Rhino exports: File > Export Selected > glTF Binary, without Draco compression)
 *   alt     optional: what the model looks like, in a sentence, for screen readers
 */
window.ARCHIVES = [
  {
    "title": "Tangerine",
    "file": "archives/files/tangerine-2.3dm",
    "size": 11061815,
    "type": "3DM",
    "added": "2026-11-25",
    "note": "Rhino 8 3D model (.3dm)",
    "model": "archives/models/tangerine-2.glb",
    "alt": "The Tangerine lights: soft, rounded pods standing side by side, one opened to show its parts, with a large egg-shaped form beside them."
  },
  {
    "title": "Snap Pods",
    "file": "archives/files/snap-pods.3dm",
    "size": 10308695,
    "type": "3DM",
    "added": "2026-11-25",
    "note": "Rhino 8 3D model (.3dm)",
    "model": "archives/models/snap-pods.glb",
    "alt": "An earbud standing upright: a rounded head with a soft ear tip on one side, flowing down into a long curved stem with plus and minus buttons."
  },
  {
    "title": "Stool 4",
    "file": "archives/files/stool-4.3dm",
    "size": 10130579,
    "type": "3DM",
    "added": "2026-11-22",
    "note": "Rhino 8 3D model (.3dm)",
    "model": "archives/models/stool-4.glb",
    "alt": "A bar stool with a dished saddle seat, four splayed legs turned with rings near their feet, and a square stretcher joining them under the seat."
  }
];
