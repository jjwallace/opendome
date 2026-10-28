# OpenDome Architecture Calculator

Geodesic dome calculator with 3D previews. It continues
[jjwallace/GeoDomeCalculator](https://github.com/jjwallace/GeoDomeCalculator), which only handled
the 3V 5/8 dome with hardcoded constants. This version builds every dome type from geometry,
so its strut lengths, counts, hubs and dimensions come from the model that is drawn.

```bash
bun install
bun run dev        # http://localhost:5173
bun run test       # strut tables checked against published values
bun run build      # static site in dist/
```

## Domes

| Dome | Struts | Lengths | Hubs | Base |
|---|---|---|---|---|
| 2V 1/2 | 65 | 2 | 26 | flat |
| 3V 3/8 | 120 | 3 | 46 | uneven |
| 3V 5/8 | 165 | 3 | 61 | uneven |
| 4V 1/2 | 250 | 6 | 91 | flat |
| 5V 7/15 | 350 | 9 | 126 | uneven |
| 5V 8/15 | 425 | 9 | 151 | uneven |
| 6V 1/2 | 555 | 9 | 196 | flat |
| Octa 4V 1/2 | 104 | 6 | 41 | flat |

To add a dome, add an entry to `src/domes.ts`: base polyhedron, frequency and nominal
height fraction.

## How it works

- `src/geodesic.ts` subdivides each face of the base solid (class I), projects the points to
  the unit sphere, and cuts on the vertex layer closest to the nominal fraction that leaves
  a clean rim. Edges are grouped by length into strut types A, B, C… (shortest first). Floor
  area, perimeter, surface area and volume are measured from the same mesh.
- `src/calc.ts` maps every editable value to the radius (`value = factor × r^power`), so
  editing any pill (a strut, D, R, A, C or H) resizes the dome.
- `src/scene.ts` renders the selected dome with Three.js, and draws all the preview boxes
  with one shared offscreen renderer.

Colors follow the original calculator: struts A/B/C are cyan, pink and lime; D purple,
R yellow, A black, C grey, H red.

Lengths are chord lengths from hub centre to hub centre. Adjust them for your hub system
before cutting.
