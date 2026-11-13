# OpenDome Architecture Calculator

**[Open the calculator →](https://jjwallace.github.io/opendome/)**  ·  [Dome Wiki](https://jjwallace.github.io/opendome/#/wiki)  ·  [Source on GitHub](https://github.com/jjwallace/opendome)

A free, open-source geodesic dome calculator with an animated 3D renderer and a built-in wiki.
Pick a dome, type in any one size (diameter, radius, height, a strut length…), and it gives you
every strut length and count, the hub count, floor area, volume and a cut list. All of it is
calculated from the same 3D model you see on screen.

It runs entirely in the browser. You don't need an account, and nothing is uploaded.

## Live site

Hosted on GitHub Pages:

| | |
|---|---|
| Calculator | https://jjwallace.github.io/opendome/ |
| Dome Wiki | https://jjwallace.github.io/opendome/#/wiki |
| Link to a dome | `https://jjwallace.github.io/opendome/#/calc/3v-5-8` (any id from the table below) |

## Features

- **Eight dome types**, from a simple 2V hemisphere to a 6V. The preview boxes are ordered from
  simplest to most complex. Each preview is a live 3D render.
- **Edit any value.** Every pill can be edited: the strut lengths, diameter (D), radius (R),
  floor area (A), circumference (C) and height (H). Change one and the whole dome resizes.
  Switch between feet/inches (to the nearest 1/16") and metric.
- **Animated assembly.** When you switch domes, the old one pulls apart, then the new one's
  struts fly in course by course, in the order you'd actually raise them. The measurements
  then count up in matching colours.
- **Build planning** (under *More info*):
  - cover-panel templates;
  - base shims for uneven-rim domes;
  - assembly courses;
  - crowd capacity;
  - frame weight for common strut materials (EMT, PVC, softwood);
  - stock lengths to buy.
- **Downloads**: a CSV cut list, an OBJ model for CAD or Blender, and an STL shell for 3D
  printing a scale model.
- **Dome Wiki**: illustrated pages on frequency, height, struts, hubs, assembly and building
  methods, plus a long history of Buckminster Fuller. Deeper pages are tucked away under
  *More info*: coverings, foundations, doors, notable domes, a glossary and chord charts.
- Works on phones, prints cleanly, and still shows the calculator when WebGL isn't
  available.

## Domes

| Dome | id | Struts | Lengths | Hubs | Base |
|---|---|---|---|---|---|
| 2V 1/2 | `2v-1-2` | 65 | 2 | 26 | flat |
| 3V 3/8 | `3v-3-8` | 120 | 3 | 46 | uneven |
| 3V 5/8 | `3v-5-8` | 165 | 3 | 61 | uneven |
| 4V 1/2 | `4v-1-2` | 250 | 6 | 91 | flat |
| 5V 7/15 | `5v-7-15` | 350 | 9 | 126 | uneven |
| 5V 8/15 | `5v-8-15` | 425 | 9 | 151 | uneven |
| 6V 1/2 | `6v-1-2` | 555 | 9 | 196 | flat |
| Octa 4V 1/2 | `oct-4v-1-2` | 104 | 6 | 41 | flat |

The strut and hub counts are checked by the tests against published tables. One example is
3V 5/8: 30 A + 55 B + 80 C struts and 61 hubs.

Lengths are chord lengths from hub centre to hub centre. Adjust them for your hub system
before cutting.

## History

This project continues [jjwallace/GeoDomeCalculator](https://github.com/jjwallace/GeoDomeCalculator),
which only handled the 3V 5/8 dome and used hardcoded constants. This version builds every dome
from its geometry. It keeps the original's colours and artwork: struts A/B/C are cyan, pink and
lime; D is purple, R yellow, A black, C grey and H red.

The 2019 OpenDome site that used to live in this repo is still on the
[`master`](https://github.com/jjwallace/opendome/tree/master) branch.

## Development

Built with [Three.js](https://threejs.org), TypeScript and Vite, and uses [Bun](https://bun.sh).

```bash
bun install
bun run dev        # http://localhost:5173
bun run test       # strut tables checked against published values
bun run build      # static site in dist/
```

Every push to `main` runs the tests, builds the site and deploys it to GitHub Pages
(`.github/workflows/pages.yml`).

### How it works

- `src/geodesic.ts` builds the dome:
  - It subdivides each face of the base solid (class I), projects the points to the unit
    sphere, and cuts on the vertex layer closest to the nominal fraction that leaves a clean rim.
  - It groups edges by length into strut types A, B, C… (shortest first).
  - It measures floor area, perimeter, surface area and volume from the same mesh.
- `src/calc.ts` maps every editable value to the radius (`value = factor × r^power`), so
  editing any pill resizes the dome.
- `src/analysis.ts` handles build planning: panels, shims, courses, capacity and weight. It
  also writes the CSV, OBJ and STL exports.
- `src/scene.ts` renders the selected dome and its assembly animation with Three.js. All the
  preview boxes are drawn with one shared offscreen renderer.
- `src/wiki*.ts` holds the Dome Wiki: core pages in `wiki-core.ts`, the *More info* pages in
  `wiki-extra.ts`, and diagrams in `wiki-kit.ts`.

### Adding a dome

Add an entry to `src/domes.ts`: the base polyhedron, frequency and nominal height fraction.
The calculator, previews, wiki tables and exports pick it up automatically.

## Credits

Photographs in the wiki are from Wikimedia Commons. Their authors and licences are listed on the
wiki's [Image credits](https://jjwallace.github.io/opendome/#/wiki/credits) page
(`src/wiki-credits.json`). Diagrams and dome artwork come from the original calculator or are
generated from the dome geometry.

© 2026 OpenDome
