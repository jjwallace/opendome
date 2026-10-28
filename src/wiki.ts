import { DIM_COLORS, STRUT_COLORS } from './calc';
import { type DomeGeometry, type Polyhedron, frequencyTriangle } from './geodesic';
import credits from './wiki-credits.json';

// ---------------------------------------------------------------- diagrams

/** Subdivided base triangle, edges in the calculator's strut colours. */
function triangleSvg(freq: number, width: number, kind: Polyhedron = 'icosahedron') {
  const t = frequencyTriangle(kind, freq);
  const pad = 0.06;
  const h = (Math.sqrt(3) / 2) * t.size;
  const sx = (x: number) => (((x + t.size / 2) / t.size) * (1 - 2 * pad) + pad) * 100;
  const sy = (v: number) => ((v / h) * (Math.sqrt(3) / 2) * (1 - 2 * pad) + pad) * 100;
  const stroke = Math.max(1.2, 3.2 - freq * 0.3);
  const lines = t.edges
    .map(
      (e) =>
        `<line x1="${sx(e.a[0])}" y1="${sy(e.a[1])}" x2="${sx(e.b[0])}" y2="${sy(e.b[1])}" stroke="${STRUT_COLORS[e.type]}" stroke-width="${stroke}" stroke-linecap="round" />`,
    )
    .join('');
  return `<svg viewBox="0 0 100 ${(Math.sqrt(3) / 2) * 100 + 4}" width="${width}" role="img" aria-label="Frequency ${freq} triangle">${lines}</svg>`;
}

/** Side view of a sphere cut at 3/8, 1/2 and 5/8 of its diameter. */
function truncationSvg(width = 280) {
  const r = 80;
  const cuts = [
    { f: '3/8', frac: 3 / 8, color: STRUT_COLORS[0] },
    { f: '1/2', frac: 1 / 2, color: STRUT_COLORS[2] },
    { f: '5/8', frac: 5 / 8, color: STRUT_COLORS[1] },
  ];
  const lines = cuts
    .map((c) => {
      const y = 20 + c.frac * 2 * r;
      const half = Math.sqrt(Math.max(0, r * r - (y - 100) ** 2));
      return `<line x1="${120 - half - 14}" y1="${y}" x2="${120 + half + 14}" y2="${y}" stroke="${c.color}" stroke-width="2.5" stroke-dasharray="7 5" />
        <text x="${120 + half + 22}" y="${y + 5}" fill="${c.color}" font-size="15" font-weight="700">${c.f}</text>`;
    })
    .join('');
  return `<svg viewBox="0 0 280 200" width="${width}" role="img" aria-label="Dome heights 3/8, 1/2 and 5/8">
    <circle cx="120" cy="100" r="${r}" fill="none" stroke="#777" stroke-width="2" />
    <line x1="120" y1="20" x2="120" y2="180" stroke="${DIM_COLORS.H}" stroke-width="2" stroke-dasharray="4 4" />
    ${lines}
  </svg>`;
}

/** A chord across a circle. */
function chordSvg(width = 200) {
  const r = 80;
  const a = (-125 * Math.PI) / 180;
  const b = (-55 * Math.PI) / 180;
  const p = [100 + r * Math.cos(a), 110 + r * Math.sin(a)];
  const q = [100 + r * Math.cos(b), 110 + r * Math.sin(b)];
  return `<svg viewBox="0 0 200 200" width="${width}" role="img" aria-label="Chord factor diagram">
    <circle cx="100" cy="110" r="${r}" fill="none" stroke="#777" stroke-width="2" />
    <line x1="100" y1="110" x2="${p[0]}" y2="${p[1]}" stroke="${DIM_COLORS.R}" stroke-width="2" />
    <line x1="100" y1="110" x2="${q[0]}" y2="${q[1]}" stroke="${DIM_COLORS.R}" stroke-width="2" />
    <line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}" stroke="${STRUT_COLORS[1]}" stroke-width="4" stroke-linecap="round" />
    <circle cx="${p[0]}" cy="${p[1]}" r="5" fill="#ddd" /><circle cx="${q[0]}" cy="${q[1]}" r="5" fill="#ddd" />
    <text x="100" y="${p[1] - 10}" fill="${STRUT_COLORS[1]}" font-size="14" font-weight="700" text-anchor="middle">strut</text>
    <text x="74" y="104" fill="${DIM_COLORS.R}" font-size="14" font-weight="700">r</text>
  </svg>`;
}

/** Truncated icosahedron outline (the C60 cage), as a flat ring of hexagons round a pentagon. */
function buckyballSvg(width = 160) {
  const pent = (cx: number, cy: number, r: number, rot: number) =>
    Array.from({ length: 5 }, (_, i) => {
      const t = rot + (i * 2 * Math.PI) / 5;
      return `${cx + r * Math.cos(t)},${cy + r * Math.sin(t)}`;
    }).join(' ');
  const hex = (cx: number, cy: number, r: number, rot: number) =>
    Array.from({ length: 6 }, (_, i) => {
      const t = rot + (i * Math.PI) / 3;
      return `${cx + r * Math.cos(t)},${cy + r * Math.sin(t)}`;
    }).join(' ');
  // Equal edges: each hexagon shares one side with the pentagon.
  const side = 20;
  const apothemP = side / (2 * Math.tan(Math.PI / 5));
  const apothemH = (side * Math.sqrt(3)) / 2;
  const ring = Array.from({ length: 5 }, (_, i) => {
    const t = (-54 * Math.PI) / 180 + (i * 2 * Math.PI) / 5;
    const d = apothemP + apothemH;
    return `<polygon points="${hex(80 + d * Math.cos(t), 80 + d * Math.sin(t), side, t - Math.PI / 6)}" fill="none" stroke="${STRUT_COLORS[[0, 2, 0, 2, 3][i]]}" stroke-width="2.5" stroke-linejoin="round" />`;
  }).join('');
  return `<svg viewBox="0 0 160 160" width="${width}" role="img" aria-label="Buckyball pattern">
    <circle cx="80" cy="80" r="72" fill="none" stroke="#555" stroke-width="2" />
    ${ring}
    <polygon points="${pent(80, 80, side / (2 * Math.sin(Math.PI / 5)), -Math.PI / 2)}" fill="${STRUT_COLORS[1]}" fill-opacity=".25" stroke="${STRUT_COLORS[1]}" stroke-width="2.5" />
  </svg>`;
}

const img = (file: string, alt: string, caption?: string, cls = '') =>
  `<figure class="photo ${cls}"><img src="/wiki/${file}" alt="${alt}" loading="lazy" />${caption ? `<figcaption>${caption}</figcaption>` : ''}</figure>`;

// ---------------------------------------------------------------- pages

interface WikiPage {
  slug: string;
  title: string;
  /** One line for the index card. */
  teaser: string;
  group: 'Learn' | 'Build' | 'History';
  art: () => string;
  body: (ctx: { geometries: DomeGeometry[] }) => string;
}

const PAGES: WikiPage[] = [
  {
    slug: 'frequency',
    title: 'Understanding dome frequency',
    teaser: 'What 2V, 3V and 6V mean, and why higher frequencies are rounder.',
    group: 'Learn',
    art: () => `<img src="/wiki/geodome-frequency2.png" alt="" />`,
    body: () => `
      <p>Every dome in the calculator starts as a simple solid, usually an <b>icosahedron</b>: twenty equal triangles, the
      shape of a twenty-sided die. That's far too lumpy to live in, so each of its triangles is divided into smaller ones and
      the new points are pushed outward until they touch a sphere.</p>
      <p>The <b>frequency</b>, written 2V, 3V, 4V and so on, is how many pieces each edge of the original triangle is divided
      into. At frequency 3 each side is split in three, and the base triangle becomes nine.</p>
      ${img('geodome-frequency2.png', 'The base triangle highlighted on a 2V and a 3V dome', 'The "base" triangle, shaded blue, on a 2V and a 3V dome. On the 3V each side is split three times.', 'art')}
      <h3>Frequency 1 to 6</h3>
      <div class="freq-grid">${[1, 2, 3, 4, 5, 6].map((f) => `<figure>${triangleSvg(f, 150)}<figcaption>Frequency ${f}</figcaption></figure>`).join('')}</div>
      <p class="caption">One face of the icosahedron at each frequency, coloured by strut type exactly as in the calculator.
      Edges that were equal on the flat triangle come out slightly different lengths once the points sit on the sphere,
      and that's where the different strut lengths come from.</p>
      ${img('geodome-frequency.png', 'Frequency 1 to 6 triangles from the original OpenDome calculator', 'The same idea in the original OpenDome artwork.', 'art small')}
      <h3>Choosing a frequency</h3>
      <ul>
        <li><b>2V:</b> two strut lengths, quick to build, a bit faceted. Good for small greenhouses and play domes.</li>
        <li><b>3V:</b> three lengths, noticeably rounder. The classic backyard and festival dome.</li>
        <li><b>4V and up:</b> shorter struts and a smoother skin, which suits big diameters, but more parts and more
        lengths to keep track of. A 6V hemisphere has 555 struts in 9 lengths.</li>
      </ul>
      <p>Strut length grows with diameter, so a large dome at low frequency means long, heavy struts. Raising the
      frequency keeps each piece short enough to carry and cut.</p>`,
  },
  {
    slug: 'height',
    title: 'Dome height and truncation',
    teaser: '3/8, 1/2, 5/8: where the sphere is cut, and why some bases are not flat.',
    group: 'Learn',
    art: () => truncationSvg(200),
    body: () => `
      <div class="split">
        <div>
          <p>A dome is a geodesic sphere sliced by a horizontal plane. The fraction says roughly how much of the
          sphere's height is kept.</p>
          <ul>
            <li><b>1/2</b> is a hemisphere: the most common shape.</li>
            <li><b>5/8</b> is taller, and its walls curve back in near the floor. More headroom at the edges.</li>
            <li><b>3/8</b> is low and wide: more stable in wind, less usable height.</li>
          </ul>
        </div>
        <figure>${truncationSvg()}</figure>
      </div>
      <h3>Flat and uneven bases</h3>
      <p>The cut has to follow a row of hubs, because the dome's edge is made of struts. On even frequencies (2V, 4V, 6V) a
      row of hubs sits exactly on the equator, so the hemisphere has a flat base. On odd frequencies (3V, 5V) no row is
      perfectly level, so the base hubs sit at slightly different heights.</p>
      <p>The calculator shows by how much. Shim the low hubs, build a short riser wall to the same profile, or pick an even
      frequency if a flat ring matters to you.</p>
      ${img('both.png', 'Plan and side diagrams', 'Plan and side views from the original calculator: diameter in purple, radius in yellow, height in red.', 'art small')}`,
  },
  {
    slug: 'struts',
    title: 'Struts and chord factors',
    teaser: 'One multiplication turns a radius into a cut list.',
    group: 'Learn',
    art: () => chordSvg(150),
    body: () => `
      <div class="split">
        <div>
          <p>Every strut is a <b>chord</b>: a straight line between two hubs on the sphere. Divide its length by the
          sphere's radius and you get its <b>chord factor</b>. That number depends only on the dome type, never on its size.</p>
          <p class="formula">strut length = radius × chord factor</p>
          <p>A 24 ft 3V dome has a 12 ft radius, so its longest strut is 12 × 0.41241 = 4.95 ft. Typing any value into the
          calculator (a strut, the height, the floor area) runs this relationship backwards to find the radius.</p>
        </div>
        <figure>${chordSvg()}</figure>
      </div>
      <h3>Hub centre to hub centre</h3>
      <p>Chord lengths run between the centres of the hubs. Your real cut length depends on the connector: subtract the
      part of the hub each strut end sits inside, or add the overlap for flattened, bolted ends. Cut one strut of each length,
      test-fit a triangle, and only then cut the rest.</p>`,
  },
  {
    slug: 'why',
    title: 'Why domes work',
    teaser: 'Strength, wind, light and air: what a sphere does for you.',
    group: 'Learn',
    art: () => `<img src="/wiki/diagram-advantages.jpg" alt="" />`,
    body: () => `
      <p>A triangle cannot change shape without one of its sides changing length, so a frame made only of triangles is
      rigid. In a geodesic dome every load is shared across the whole shell rather than piled onto a few beams, which is why
      a dome can be so light for its size.</p>
      ${img('diagram-advantages.jpg', 'Dome advantages: wind, temperature, air flow, light', 'From the original OpenDome info page.', 'art')}
      <ul>
        <li><b>Wind:</b> air flows around the curved surface instead of slamming into a flat wall.</li>
        <li><b>Temperature:</b> less surface for the volume enclosed, so less heat lost or gained, and air circulates evenly.</li>
        <li><b>Ventilation:</b> warm air rises to the top, where a vent lets it out and draws fresh air in at the base.</li>
        <li><b>Light:</b> the surface faces the sun from every angle through the day.</li>
        <li><b>Clear span:</b> no interior columns, however big the dome.</li>
      </ul>`,
  },
  {
    slug: 'solids',
    title: 'Base solids and classes',
    teaser: 'Icosahedron or octahedron, Class I or Class II.',
    group: 'Learn',
    art: () => triangleSvg(3, 120, 'octahedron'),
    body: () => `
      <div class="split">
        <div>
          <p>The <b>icosahedron</b> (20 triangles) gives the most even triangles and is the usual starting point. The
          <b>octahedron</b> (8 triangles) produces domes with four-fold symmetry and a flat base at any even frequency, but
          its triangles vary more in shape and its struts more in length.</p>
        </div>
        <figure>${triangleSvg(4, 160, 'octahedron')}<figcaption>Octahedron face, 4V</figcaption></figure>
      </div>
      <p>All the domes here are <b>Class I</b>: the base triangle is divided with lines parallel to its sides. <b>Class
      II</b> divides it along lines perpendicular to the sides. That gives a different pattern of diamonds and different strut
      lengths, often used for very large domes.</p>`,
  },
  {
    slug: 'assembly',
    title: 'How to put a dome together',
    teaser: 'From a pile of colour-coded struts to a standing dome.',
    group: 'Build',
    art: () => `<img src="/wiki/dome.png" alt="" />`,
    body: () => `
      <ol class="steps">
        <li><b>Plan it.</b> Choose a dome and size in the calculator. Note the cut list, the number of hubs of each kind, and
        how uneven the base will be.</li>
        <li><b>Prepare the site.</b> Level a circle a little larger than the floor diameter. Mark the centre and the base
        ring, and set anchors at each base hub.</li>
        <li><b>Cut and mark.</b> Cut one strut of each length and test-fit a triangle. Then cut the rest and mark every strut
        with coloured tape that matches the calculator's colours (A cyan, B pink, C lime…), so the 3D view becomes your map.</li>
        <li><b>Drill or fit the ends.</b> For conduit, flatten the ends, bend them slightly to the hub angle and drill. For
        connector hubs, fit the end caps.</li>
        <li><b>Lay the base ring.</b> Bolt the bottom ring together on the ground and anchor it.</li>
        <li><b>Build up course by course.</b> Add the triangles of the next row, closing each one as you go. Keep bolts
        finger-tight until a full ring is complete, then tighten.</li>
        <li><b>Close the top.</b> The last pentagon sits at the very top; a ladder or scaffold inside the dome helps.</li>
        <li><b>Cover and anchor.</b> Fit the cover or panels, add the door, and anchor the base properly. A light dome
        catches the wind like a sail.</li>
      </ol>
      ${img('double-dome.png', 'Dome in elevation and plan', 'Elevation and plan of a 3V dome from the original OpenDome artwork.', 'art small')}`,
  },
  {
    slug: 'methods',
    title: 'Assembly methods',
    teaser: 'Bottom-up, top-down, subassemblies and panels.',
    group: 'Build',
    art: () => `<img src="/wiki/double-dome.png" alt="" />`,
    body: () => `
      <h3>Bottom-up, ring by ring</h3>
      <p>The simplest method, and the one the calculator's animation shows: anchor the base ring and add one course of
      triangles at a time. Works well up to a size where you can still reach the top from a ladder.</p>
      <h3>Top-down, lifting as you go</h3>
      <p>Build the top cap on the ground, raise it on a central mast or jacks, and add the next ring underneath. Repeat until
      the base reaches the ground. Nobody works at height, which is why large domes are often raised this way.</p>
      <h3>Subassemblies</h3>
      <p>Assemble the pentagon and hexagon "flowers" on the ground, each a hub with its ring of struts, then lift them into place
      and join them. Fewer loose parts in the air, but each piece is heavier.</p>
      <h3>Panelised</h3>
      <p>Build complete triangular or diamond panels (frame plus skin) in a workshop and bolt them together on site. Common
      for permanent, insulated domes; the panels need precise bevel angles where they meet.</p>
      <h3>Hub and strut versus panel</h3>
      <p>Hub-and-strut frames are cheap, light and quick to put up and take down, which suits festival and temporary domes.
      Panel domes take longer to make but give a finished, weatherproof building.</p>`,
  },
  {
    slug: 'hubs',
    title: 'Hubs, connectors and materials',
    teaser: 'Flattened conduit, connector hubs, timber, and what each costs you.',
    group: 'Build',
    art: () => `<img src="/wiki/bolt.png" alt="" />`,
    body: () => `
      <p>A hub is where struts meet. Most hubs on an icosahedral dome are <b>6-way</b>. Exactly twelve points on the full sphere,
      the corners of the original icosahedron, are <b>5-way</b>, which is why a hemisphere shows six of them. Hubs on the base
      ring have fewer struts, usually four.</p>
      <div class="materials-row">
        ${img('pipe.png', 'Conduit', 'Conduit (EMT)')}
        ${img('wood.png', 'Timber', 'Timber')}
        ${img('bolt.png', 'Bolt and washers', 'Bolt + washers')}
      </div>
      <ul>
        <li><b>Flattened conduit:</b> flatten and drill the ends of steel EMT tube, then stack them on one bolt per hub with a
        washer either side. Cheap and quick, and what the original OpenDome kit used. The calculator's hardware count assumes
        this: one bolt and two washers per hub.</li>
        <li><b>Connector hubs:</b> ready-made steel or plastic sockets for timber or tube. Neat, and they set the angles for you.</li>
        <li><b>Timber hubs:</b> plywood or steel plates screwed to 2×2 or 2×4 struts. Good for clad, permanent domes.</li>
      </ul>`,
  },
  {
    slug: 'compare',
    title: 'Compare domes',
    teaser: 'Every dome in the calculator, side by side.',
    group: 'Build',
    art: () => `<span class="swatch-art">${STRUT_COLORS.slice(0, 9).map((c) => `<i style="background:${c}"></i>`).join('')}</span>`,
    body: ({ geometries }) => `
      <table class="compare">
        <thead><tr><th>Dome</th><th>Struts</th><th>Lengths</th><th>Hubs</th><th>Base</th><th>Height / D</th></tr></thead>
        <tbody>${geometries
          .map(
            (g) => `<tr>
              <td><a href="#/calc/${g.spec.id}">${g.spec.name}</a></td>
              <td>${g.edges.length}</td>
              <td><span class="swatch-row">${g.strutTypes.map((_, i) => `<i style="background:${STRUT_COLORS[i]}"></i>`).join('')}</span></td>
              <td>${g.vertices.length}</td>
              <td>${g.flatBase ? 'flat' : 'uneven'}</td>
              <td>${(g.heightFactor / 2).toFixed(3)}</td>
            </tr>`,
          )
          .join('')}</tbody>
      </table>
      <p class="caption">Select a dome to open it in the calculator.</p>`,
  },
  {
    slug: 'fuller',
    title: 'Buckminster Fuller',
    teaser: 'The man who called himself Guinea Pig B and tried to redesign the planet.',
    group: 'History',
    art: () => `<img src="/wiki/fuller-1972.jpg" alt="" style="object-position: 75% 15%" />`,
    body: () => `
      ${img('fuller-1972.jpg', 'R. Buckminster Fuller in 1972, holding a tensegrity model', 'Fuller in 1972, holding a tensegrity model and looking, as usual, like he had just worked something out.', 'float')}
      <p class="lede">Every so often the universe produces a person who looks at the whole arrangement (planets, houses, cars,
      maps, sleep) and quietly concludes that it has all been put together the wrong way round. Most such people are ignored.
      Richard Buckminster Fuller (12 July 1895 – 1 July 1983) was ignored for a while, then given 47 honorary degrees, which
      is the universe's way of apologising.</p>

      <h3>A difficult start</h3>
      <p>Fuller was born in Milton, Massachusetts, into a family of New England nonconformists. He went to Harvard and was
      expelled. He went back and was expelled again, which takes a certain dedication. He served in the US Navy in the First
      World War, worked in meat-packing, and went into business with his father-in-law making building blocks from compressed
      wood shavings. The business failed.</p>
      <p>Worse, his young daughter Alexandra had died in 1922, not long before her fourth birthday. By 1927 Fuller was
      broke, drinking, and standing on the shore of Lake Michigan, wondering whether to walk into it.</p>

      <h3>Guinea Pig B</h3>
      <p>He didn't. Instead he decided, as he later told it, that he had no right to end a life that didn't belong only to him,
      and that he would spend the rest of it as an experiment: to find out what one penniless, unknown person could do for
      all of humanity. He named the test subject <b>Guinea Pig B</b>. The B was for Bucky.</p>
      <p>The experiment was meticulously documented. Fuller kept the <b>Dymaxion Chronofile</b>, a scrapbook of his entire life,
      letters, sketches, receipts and newspaper clippings, kept from 1917 until his death. It made his one of the most
      thoroughly documented lives of the twentieth century. He may be the only person in history to have filed himself.</p>

      <h3>The Dymaxion years</h3>
      <p>"Dymaxion" was coined for him by a department store in 1929, out of <i>dynamic</i>, <i>maximum</i> and
      <i>tension</i>. Fuller liked it so much he put it on everything:</p>
      <ul>
        <li><b>The Dymaxion House</b>: a factory-made, round, aluminium house hung from a central mast, designed to be
        delivered like a car. A prototype from the 1940s, the Wichita House, survives at the Henry Ford Museum.</li>
        <li><b>The Dymaxion Car</b> (1933): three wheels, steered from the back, room for eleven passengers, shaped like a
        raindrop. It turned on the spot and was spectacularly unlike anything else on the road.</li>
        <li><b>The Dymaxion Map</b> (1943): the globe unfolded onto an icosahedron so that the continents appear as one
        island in one ocean, without the bloated Greenland of ordinary maps.</li>
        <li><b>Dymaxion sleep</b>: thirty-minute naps every six hours, two hours a day in total. He reportedly kept it up for
        two years and gave it up only because the rest of the world insisted on sleeping at night.</li>
      </ul>
      ${img('dymaxion-car.jpg', 'Side views of the 1933 Dymaxion car', 'The Dymaxion car, 1933. Note the single rear wheel, which did the steering.', 'wide')}
      <p>He travelled so constantly that he is said to have worn three watches: one for where he was, one for where he had
      just been, and one for where he was going next.</p>

      <h3>Doing more with less</h3>
      <p>Underneath the gadgets was one stubborn idea, which Fuller called <b>ephemeralization</b>: technology lets us do more
      and more with less and less, until eventually we can do everything with nothing. A building, he thought, should be
      judged by what it weighs. He liked to ask architects exactly that question, and enjoyed their faces.</p>
      ${img('fuller-teaching-1953.jpg', 'Fuller teaching students around a table of models, 1953', 'Fuller teaching at the College of Design, NC State, in 1953, surrounded by models and students in roughly equal numbers.', 'wide')}

      <h3>The dome</h3>
      <p>At Black Mountain College in the summer of 1948, Fuller and his students tried to raise a big dome of thin metal
      strips. It sagged gently onto the lawn and lay there. The students called it the "Supine Dome". Fuller called it a
      successful experiment, and the next year they built one that stood.</p>
      <p>The patent for the geodesic dome followed in 1954. Within a few years domes were everywhere: a gleaming one over the
      Ford Rotunda in Dearborn, light domes airlifted whole by US Marine Corps helicopters, and radar domes along the Arctic
      Distant Early Warning line, where nothing else would stand up to the wind.</p>
      <p>His masterpiece was the US pavilion at Expo 67 in Montreal, a three-quarter sphere 76 metres across. Its acrylic skin
      burned off in 1976; the steel lattice survived, as lattices tend to, and is now the Biosphère museum.</p>
      ${img('biosphere-montreal.jpg', 'The Biosphère in Montreal', 'The Biosphère, Montreal: Fuller’s Expo 67 pavilion.', 'wide')}
      <p>He was not modest about scale. With Shoji Sadao he proposed a dome two miles across over Midtown Manhattan, which
      would have kept the weather off and, he calculated, paid for itself in the money saved on clearing snow. He also sketched <b>Cloud Nine</b>: tensegrity spheres
      half a mile wide, so light that sun-warmed air inside would let them float, with whole communities living aboard.
      Nobody has built one yet. Nobody has proved you can't.</p>

      <h3>To the bottom of the world</h3>
      <p>His geometry went where people had no business living. In 1975 a geodesic dome 50 metres across was raised at the
      Amundsen–Scott South Pole Station, sheltering the buildings of the station from the coldest, windiest weather on the planet.
      For nearly thirty years the people who wintered at the Pole lived under it, until it was retired in 2003 and taken
      apart a few years later.</p>
      <div class="photo-pair">
        ${img('south-pole-station.jpg', 'Entrance to the South Pole dome', 'The entrance to the South Pole dome.')}
        ${img('south-pole-dome.jpg', 'The South Pole dome seen from the new station', 'The old dome seen from its replacement.')}
      </div>

      <h3>Spaceship Earth</h3>
      <p>Fuller's favourite way of describing the planet was as a spaceship: a small vehicle with a finite supply of
      everything, travelling through space at great speed, and supplied with no instruction book. So in 1969 he wrote one,
      <b>Operating Manual for Spaceship Earth</b>. Its argument fits on a postcard: there is enough for everyone if we design
      things well, and "we are all astronauts".</p>
      <p>He developed the <b>World Game</b> to play out exactly that: how to make the world work for 100% of humanity in the
      shortest possible time, without anyone losing. And when Epcot opened in 1982, its great silver geodesic sphere was named
      Spaceship Earth after his phrase.</p>
      ${img('spaceship-earth.jpg', 'Spaceship Earth at Epcot', 'Spaceship Earth, Epcot: a geodesic sphere named after Fuller’s idea.', 'wide')}

      <h3>A verb, and a trim tab</h3>
      <p>He coined <b>tensegrity</b> (tensional integrity), wrote a two-volume geometry of his own called
      <b>Synergetics</b>, held 28 US patents, and once titled a book <i>I Seem to Be a Verb</i>, which is the best
      description of him anyone has managed.</p>
      <p>He compared himself to a <b>trim tab</b>: the tiny flap on the edge of a ship's rudder that moves the rudder that turns
      the whole ship. One small person, pushing in the right place, can steer something enormous. He received the
      Presidential Medal of Freedom in 1983 and died that July. His wife Anne died a day and a half later. His headstone
      reads, simply, <b>CALL ME TRIMTAB</b>.</p>
      <p class="outro">Every dome built with this calculator is, in a small way, part of the experiment. Guinea Pig B would
      want to know how it went.</p>
      <p class="caption">More at the <a href="https://www.bfi.org/about-fuller" target="_blank" rel="noopener">Buckminster Fuller
      Institute</a>.</p>`,
  },
  {
    slug: 'history',
    title: 'A short history of domes',
    teaser: 'From a 1920s planetarium to the South Pole and Epcot.',
    group: 'History',
    art: () => `<img src="/wiki/biosphere-montreal.jpg" alt="" />`,
    body: () => `
      <ol class="timeline">
        <li><b>1920s</b> Walther Bauersfeld designs a geodesic-patterned dome for the Zeiss planetarium in Jena, Germany,
        decades before the name existed.</li>
        <li><b>1948–49</b> Buckminster Fuller's first large dome at Black Mountain College sags to the ground; the next year's
        stands. <a href="#/wiki/fuller">More on Fuller</a></li>
        <li><b>1953</b> A geodesic dome roofs the courtyard of the Ford Rotunda in Dearborn, Michigan.</li>
        <li><b>1954</b> Fuller is granted the US patent for the geodesic dome. Helicopters airlift domes for the US Marine
        Corps.</li>
        <li><b>1950s</b> Radomes protect the radar of the Arctic Distant Early Warning line.</li>
        <li><b>1967</b> The US pavilion at Expo 67, Montreal, 76 m across, now the Biosphère.</li>
        <li><b>1960s–70s</b> Counterculture builders adopt domes as cheap, do-it-yourself homes; how-to books spread the
        techniques worldwide.</li>
        <li><b>1975</b> A 50 m dome shelters the Amundsen–Scott South Pole Station until 2003.</li>
        <li><b>1982</b> Spaceship Earth, the geodesic sphere at Epcot, opens, named after Fuller's phrase.</li>
        <li><b>1985</b> Chemists find carbon molecules shaped like geodesic spheres and name them after Fuller.
        <a href="#/wiki/fullerenes">Fullerenes</a></li>
      </ol>
      <div class="photo-pair">
        ${img('biosphere-montreal.jpg', 'Biosphère, Montreal', 'Montreal, 1967')}
        ${img('south-pole-station.jpg', 'South Pole dome', 'South Pole, 1975')}
      </div>`,
  },
  {
    slug: 'fullerenes',
    title: 'Fullerenes',
    teaser: 'Molecules shaped like domes, named after the man who built them.',
    group: 'History',
    art: () => buckyballSvg(120),
    body: () => `
      <div class="split">
        <div>
          <p>In 1985 Harold Kroto, Robert Curl and Richard Smalley discovered a molecule of sixty carbon atoms arranged like a
          geodesic sphere: 12 pentagons and 20 hexagons, the pattern of a football. They named it
          <b>buckminsterfullerene</b> after Fuller, and the family of molecules became
          <a href="https://en.wikipedia.org/wiki/Fullerene" target="_blank" rel="noopener">fullerenes</a>, or
          "buckyballs". The discovery won the 1996 Nobel Prize in Chemistry.</p>
          <p>The twelve pentagons aren't a coincidence. Any closed shell made of hexagons needs exactly twelve pentagons to
          close, the same twelve points that are 5-way hubs on every icosahedral dome.</p>
        </div>
        <figure>${buckyballSvg()}</figure>
      </div>`,
  },
];

// ---------------------------------------------------------------- render

const pageBySlug = (slug?: string) => PAGES.find((p) => p.slug === slug);

export class Wiki {
  private article!: HTMLElement;
  private slug?: string;
  private navGen = 0;

  constructor(private host: HTMLElement, private geometries: DomeGeometry[]) {
    host.innerHTML = `
      <main class="wiki-layout">
        <aside class="wiki-nav">
          <a class="wiki-home" href="#/wiki">Dome Wiki</a>
          ${(['Learn', 'Build', 'History'] as const)
            .map(
              (g) => `<h4>${g}</h4>${PAGES.filter((p) => p.group === g)
                .map((p) => `<a href="#/wiki/${p.slug}" data-slug="${p.slug}">${p.title}</a>`)
                .join('')}`,
            )
            .join('')}
          <h4>About</h4><a href="#/wiki/credits" data-slug="credits">Image credits</a>
        </aside>
        <article class="wiki-article"></article>
      </main>`;
    this.article = host.querySelector('.wiki-article')!;
  }

  private html(slug?: string) {
    if (slug === 'credits') {
      return `<header class="wiki-head"><p class="crumbs"><a href="#/wiki">Dome Wiki</a></p><h1>Image credits</h1></header>
        <div class="wiki-text"><p>Diagrams and dome artwork are from the original OpenDome calculator or generated from the dome
        geometry. Photographs are from Wikimedia Commons:</p>
        <ul class="credits">${(credits as { file: string; title: string; page: string; license: string; author: string }[])
          .map((c) => `<li><a href="${c.page}" target="_blank" rel="noopener">${c.title}</a>, ${c.author}. ${c.license}.</li>`)
          .join('')}</ul></div>`;
    }
    const page = pageBySlug(slug);
    if (!page) {
      return `<header class="wiki-head"><h1>Dome Wiki</h1><p class="sub">Everything about geodesic domes: how they work, how to
        build one, and the people who dreamed them up.</p></header>
        ${(['Learn', 'Build', 'History'] as const)
          .map(
            (g) => `<h2 class="group">${g}</h2><div class="wiki-cards">${PAGES.filter((p) => p.group === g)
              .map(
                (p) => `<a class="wiki-card" href="#/wiki/${p.slug}">
                  <span class="wiki-card-art">${p.art()}</span>
                  <span class="wiki-card-title">${p.title}</span>
                  <span class="wiki-card-teaser">${p.teaser}</span>
                </a>`,
              )
              .join('')}</div>`,
          )
          .join('')}`;
    }
    const i = PAGES.indexOf(page);
    const prev = PAGES[i - 1];
    const next = PAGES[i + 1];
    return `<header class="wiki-head"><p class="crumbs"><a href="#/wiki">Dome Wiki</a> / ${page.group}</p><h1>${page.title}</h1></header>
      <div class="wiki-text">${page.body({ geometries: this.geometries })}</div>
      <nav class="pager">
        ${prev ? `<a href="#/wiki/${prev.slug}" class="prev"><small>Previous</small>${prev.title}</a>` : '<span></span>'}
        ${next ? `<a href="#/wiki/${next.slug}" class="next"><small>Next</small>${next.title}</a>` : '<span></span>'}
      </nav>`;
  }

  private markNav(slug?: string) {
    for (const a of this.host.querySelectorAll<HTMLElement>('.wiki-nav a[data-slug]')) a.classList.toggle('on', a.dataset.slug === slug);
    this.host.querySelector('.wiki-home')?.classList.toggle('on', !slug);
  }

  /** Show a page. With `animate`, the old article slides out and the new one in. */
  async show(slug: string | undefined, animate: boolean) {
    const gen = ++this.navGen;
    const from = this.slug;
    this.slug = slug;
    this.markNav(slug);
    if (animate && from !== slug) {
      const order = (s?: string) => (s ? PAGES.findIndex((p) => p.slug === s) : -1);
      const dir = order(slug) >= order(from) ? 1 : -1;
      await this.article
        .animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateY(${-14 * dir}px)` }], {
          duration: 160,
          easing: 'ease-in',
          fill: 'forwards',
        })
        .finished.catch(() => undefined);
      if (gen !== this.navGen) return;
      this.render(slug);
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      this.article.getAnimations().forEach((a) => a.cancel());
      this.article.animate([{ opacity: 0, transform: `translateY(${24 * dir}px)` }, { opacity: 1, transform: 'none' }], {
        duration: 380,
        easing: 'cubic-bezier(.2,.9,.3,1)',
      });
    } else {
      this.render(slug);
    }
  }

  private render(slug?: string) {
    this.article.innerHTML = this.html(slug);
    // Index cards and page figures arrive in a quick cascade.
    this.article.querySelectorAll<HTMLElement>('.wiki-card, .wiki-text > *').forEach((el, k) => {
      if (k > 14) return;
      el.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], {
        duration: 420,
        delay: 60 + k * 45,
        easing: 'cubic-bezier(.2,.9,.3,1)',
        fill: 'backwards',
      });
    });
  }
}
