import { STRUT_COLORS } from './calc';
import { type WikiPage, accordion, img, triangleSvg } from './wiki-kit';

const icon = (glyph: string, color: string) =>
  `<span class="glyph" style="color:${color};border-color:${color}">${glyph}</span>`;

const GLOSSARY: [string, string][] = [
  ['Apex', 'The top hub of a dome. On an icosahedral dome it is a 5-way hub.'],
  ['Base ring', 'The bottom course of struts and hubs that rests on the foundation.'],
  ['Chord', 'A straight line between two points on a sphere. Every strut is a chord.'],
  ['Chord factor', 'A strut length divided by the sphere radius. Multiply by your radius to get the strut length.'],
  ['Class I / Class II', 'The two common ways of dividing the base triangle: lines parallel to its sides (I) or perpendicular to them (II).'],
  ['Course', 'One horizontal ring of struts at about the same height. Domes are often raised a course at a time.'],
  ['Cover', 'The skin over the frame: fabric, film, panels or shingles.'],
  ['Frequency (V)', 'How many times each edge of the base triangle is divided. 3V means each edge is split into three.'],
  ['Geodesic', 'Following the shortest path across a curved surface. On a sphere, geodesics are great circles.'],
  ['Great circle', 'A circle on a sphere whose centre is the sphere’s centre, such as the equator.'],
  ['Hub', 'The joint where struts meet. Also called a vertex or node.'],
  ['Icosahedron', 'A solid with 20 equilateral triangle faces, 12 vertices and 30 edges: the usual starting shape for a dome.'],
  ['Octahedron', 'A solid with 8 triangle faces. Gives four-fold symmetric domes.'],
  ['Panel', 'A triangle (or group of triangles) of the dome surface, often made as one piece.'],
  ['Pentagon / hexagon', 'The groups of 5 or 6 triangles round a 5-way or 6-way hub.'],
  ['Radome', 'A dome that shelters a radar antenna; many are geodesic.'],
  ['Riser wall', 'A short vertical wall under the base ring, used to level an uneven base or gain headroom.'],
  ['Strut', 'A straight member between two hubs.'],
  ['Synergetics', 'Fuller’s name for his geometry of thinking, and the two books in which he set it out.'],
  ['Tensegrity', 'Tensional integrity: a structure of rods held apart by a continuous web of cables, coined by Fuller.'],
  ['Truncation', 'Where the sphere is cut to form the dome, written as a fraction such as 1/2 or 5/8.'],
  ['Vertex', 'A corner of a polyhedron: on a dome, a hub.'],
];

export const EXTRA_PAGES: WikiPage[] = [
  // ------------------------------------------------------------ Learn
  {
    slug: 'loads',
    title: 'How domes carry loads',
    teaser: 'Why a thin shell of triangles is so strong, and what can still go wrong.',
    group: 'Learn',
    related: ['why', 'anchoring', 'struts'],
    keywords: 'structure snow wind engineering structural analysis',
    art: () => triangleSvg(2, 110),
    body: () => `
      <p>A dome is a <b>shell</b>. Weight on any part of it is passed sideways through the triangles and spread over the
      whole surface, rather than travelling down a few columns. Each strut is mostly pushed or pulled along its length,
      which is the direction in which a strut is strongest.</p>
      ${accordion([
        { title: 'Even loads: the dome at its best', open: true, body: '<p>The dome’s own weight, or snow lying evenly, is spread across every triangle. Here a dome is remarkably efficient for the material it uses.</p>' },
        { title: 'Uneven loads: drifts and point loads', body: '<p>Snow drifting onto one side, a hanging load from one hub, or a heavy panel can bend struts instead of just pushing on them. Hang loads from several hubs, and design for drifts where it snows.</p>' },
        { title: 'Wind: pressure and lift', body: '<p>Wind pushes on the windward side and pulls (lifts) on the top and leeward side. Light domes fail far more often by being lifted or slid than by breaking. Anchor every base hub.</p>' },
        { title: 'Hubs are the weak point', body: '<p>The frame is only as strong as its joints. Flattened tube ends and single bolts can bend or tear under heavy loads. For permanent or covered domes, use proper connectors and sized timber or steel.</p>' },
        { title: 'When to call an engineer', body: '<p>Anything people will live in, anything over a few metres across in snow or high-wind country, and anything that needs a building permit. A structural engineer can check your strut and hub sizes for local loads.</p>' },
      ])}`,
  },
  {
    slug: 'platonic',
    title: 'Platonic solids',
    teaser: 'The five perfect solids, and why the icosahedron wins for domes.',
    group: 'Learn',
    related: ['solids', 'frequency', 'fullerenes'],
    keywords: 'sacred geometry plato kepler tetrahedron cube dodecahedron',
    art: () => icon('20', STRUT_COLORS[2]),
    body: () => `
      <p>There are exactly five solids whose faces are identical regular polygons with the same number meeting at every
      corner. The Greeks knew all of them; Plato wrote about them in the <i>Timaeus</i>, pairing four with the elements of
      fire, earth, air and water, and the fifth with the cosmos.</p>
      <table class="compare">
        <thead><tr><th>Solid</th><th>Faces</th><th>Vertices</th><th>Edges</th><th>Domes?</th></tr></thead>
        <tbody>
          <tr><td>Tetrahedron</td><td>4 triangles</td><td>4</td><td>6</td><td>Too few faces</td></tr>
          <tr><td>Cube</td><td>6 squares</td><td>8</td><td>12</td><td>Squares are not rigid</td></tr>
          <tr><td>Octahedron</td><td>8 triangles</td><td>6</td><td>12</td><td>Yes, four-fold domes</td></tr>
          <tr><td>Dodecahedron</td><td>12 pentagons</td><td>20</td><td>30</td><td>Via its triangulated cousins</td></tr>
          <tr><td>Icosahedron</td><td>20 triangles</td><td>12</td><td>30</td><td><b>The usual choice</b></td></tr>
        </tbody>
      </table>
      <p>The icosahedron has the most faces, and they are triangles, so it is already close to a sphere and already rigid.
      Divide its faces and it gets closer still. Johannes Kepler was so taken with these solids that in 1596 he tried to
      explain the spacing of the planets by nesting them inside one another. He was wrong about the planets and right that
      they were beautiful.</p>`,
  },
  // ------------------------------------------------------------ Build
  {
    slug: 'coverings',
    title: 'Coverings',
    teaser: 'Canvas, film, ETFE, shade cloth, panels and shingles compared.',
    group: 'Build',
    related: ['cover-panels', 'anchoring', 'types'],
    keywords: 'cover tarp canvas etfe poly film shade cloth aluminet shrink wrap tyvek plywood osb shingles polycarbonate parachute',
    art: () => icon('◢', STRUT_COLORS[1]),
    body: () => `
      <p>The cover decides how the dome lives: how long it lasts, how much light it lets in, and whether it keeps the rain
      out. The calculator’s <b>Cover panels</b> card gives the triangle templates and total area for any dome.</p>
      ${accordion([
        { title: 'Canvas and tarps', open: true, body: '<p>Fitted fabric covers are the classic event and camping choice: quick to fit, removable, reasonably weatherproof. Canvas breathes; coated polyester and PVC tarps are lighter and fully waterproof. Pattern them as one fitted cover or a few gores.</p>' },
        { title: 'Woven poly', body: '<p>Woven polyethylene sheet is cheap, light and waterproof. UV-stabilised grades last a few seasons in the sun; cheap ones a few months.</p>' },
        { title: 'Poly film (greenhouse film)', body: '<p>Clear or diffuse polyethylene film is the cheapest greenhouse cover. Double layers with air blown between them insulate much better.</p>' },
        { title: 'ETFE', body: '<p>A tough, very clear fluoropolymer film, used as inflated cushions on landmark domes such as the Eden Project. Long-lived and light, but needs specialist fabrication.</p>' },
        { title: 'Shade cloth and Aluminet', body: '<p>Knitted shade cloth cuts sun without trapping heat; metallised versions such as Aluminet reflect radiant heat too. Ideal for desert event domes.</p>' },
        { title: 'Shrink wrap', body: '<p>Heat-shrink film pulled taut over the frame. Gives a tight, clean skin for a season, then is cut off.</p>' },
        { title: 'Tyvek and house wrap', body: '<p>Breathable, water-resistant sheet, used as a layer under cladding or as a light temporary cover.</p>' },
        { title: 'Plywood and OSB panels', body: '<p>Sheet panels make a solid, insulated building, cut from the cover templates with beveled edges. Need a weatherproof finish on top.</p>' },
        { title: 'Shingles and roofing', body: '<p>Shingles over sheathing make a permanent roof, but every triangle has seams in a new direction. Detail the joints carefully: water finds every one.</p>' },
        { title: 'Polycarbonate panels', body: '<p>Twin-wall polycarbonate is rigid, light, impact resistant and insulating. A favourite for greenhouses; leave room for thermal expansion.</p>' },
        { title: 'Parachutes', body: '<p>A real parachute thrown over a frame makes a light, colourful festival shade. Not waterproof, but very pretty.</p>' },
      ])}`,
  },
  {
    slug: 'cover-panels',
    title: 'Cutting cover panels',
    teaser: 'From the calculator’s panel table to cut fabric or sheet.',
    group: 'Build',
    related: ['coverings', 'struts'],
    keywords: 'templates triangles pattern seam hem',
    art: () => triangleSvg(3, 110),
    body: () => `
      <p>Every dome has only a few distinct triangles. The calculator’s <b>Cover panels</b> card lists them: the strut
      letters on each side (for example <b>BCC</b>), how many you need, the side lengths and the area of each.</p>
      <ol class="steps">
        <li>Draw each triangle full size from its three side lengths: one side on the floor, then swing the other two from its ends with a tape measure.</li>
        <li>Add a hem or overlap all round (for fabric) or subtract the frame thickness (for sheet panels that sit between struts).</li>
        <li>Cut one, test it on the frame, then use it as the template for the rest.</li>
        <li>Mark each panel with its letters so it goes on the matching triangle; the colours match the struts.</li>
      </ol>
      <p class="caption">Sheet panels that meet edge to edge also need a bevel along each side, because neighbouring triangles meet at a slight angle.</p>`,
  },
  {
    slug: 'making-struts',
    title: 'Making struts and colour coding',
    teaser: 'Cut, flatten, drill, bend, label: a production line for struts.',
    group: 'Build',
    related: ['hubs', 'tools', 'assembly'],
    keywords: 'conduit emt flatten drill jig bend colour code tape',
    art: () => `<img src="wiki/pipe.png" alt="" />`,
    body: () => `
      <p>A 3V dome has 165 struts. Building them is a production job, and a little jig-making up front saves hours.</p>
      ${accordion([
        { title: '1. Cut to length', open: true, body: '<p>Make a stop block for each length so every cut is identical. Cut one of each length first and test-fit a triangle.</p>' },
        { title: '2. Flatten the ends (conduit)', body: '<p>Crush each end in a vice or press to the same width. A stop on the press keeps the flat length consistent.</p>' },
        { title: '3. Drill', body: '<p>Drill through the flats at a fixed distance from the end, using a jig. The hole-to-hole distance must equal the strut length from the calculator.</p>' },
        { title: '4. Bend', body: '<p>Bend each flattened end a few degrees so the strut meets the hub at the right angle. A consistent bend makes the hubs sit flat.</p>' },
        { title: '5. Colour code', body: `<p>Mark both ends of every strut with tape or paint in the calculator’s colours:</p>
          <p>${['A', 'B', 'C', 'D', 'E', 'F'].map((l, i) => `<span class="tag" style="background:${STRUT_COLORS[i]}">${l}</span>`).join(' ')}</p>
          <p>The 3D view, the cut list and the panel table then all speak the same language on site.</p>` },
      ])}`,
  },
  {
    slug: 'tools',
    title: 'Tools and equipment',
    teaser: 'What you need, from a weekend kit to a workshop.',
    group: 'Build',
    related: ['making-struts', 'assembly'],
    keywords: 'saw drill press vice ladder scaffold',
    art: () => `<img src="wiki/bolt.png" alt="" />`,
    body: () => accordion([
      { title: 'The basics', open: true, body: '<ul><li>Tape measure and marker</li><li>Pipe cutter or chop saw</li><li>Drill and bits for your bolt size</li><li>Vice or press for flattening ends</li><li>Spanners or a socket set</li><li>Coloured tape</li></ul>' },
      { title: 'Worth having', body: '<ul><li>Drill press for repeatable holes</li><li>Cutting and drilling jigs</li><li>Bench grinder for burrs</li><li>Impact driver</li></ul>' },
      { title: 'On site', body: '<ul><li>Ladders or a small scaffold tower</li><li>Ground anchors and a mallet or driver</li><li>Gloves and eye protection</li><li>A printed cut list and course list from the calculator</li></ul>' },
    ]),
  },
  {
    slug: 'anchoring',
    title: 'Anchoring, foundations and decks',
    teaser: 'Keep the dome on the ground: stakes, footings, platforms and risers.',
    group: 'Build',
    related: ['loads', 'height', 'assembly'],
    keywords: 'anchor stake foundation footing concrete deck platform riser level base',
    art: () => icon('⚓', STRUT_COLORS[0]),
    body: () => `
      <p>Light domes are far more likely to blow away than to fall down. Anchor <b>every</b> base hub, before the cover goes on.</p>
      ${accordion([
        { title: 'Ground stakes and earth anchors', open: true, body: '<p>For temporary domes: long stakes or screw-in earth anchors at each base hub, angled away from the dome. Rebar stakes through the hub bolt work in firm ground; screw anchors hold better in soft soil.</p>' },
        { title: 'Concrete footings and ring foundations', body: '<p>For permanent domes: a poured ring beam or a pier under each base hub, with anchor bolts set in the concrete. Mark hub positions from the floor diameter in the calculator.</p>' },
        { title: 'Timber decks', body: '<p>A raised platform gives a dry, level floor and something solid to bolt the base to. Make it a polygon matching the base ring.</p>' },
        { title: 'Leveling an uneven base', body: '<p>Odd frequencies (3V, 5V) have base hubs at different heights. The calculator’s <b>Base &amp; raising</b> card lists how many hubs need lifting and by how much. Shim them, set them on blocks, or build a riser wall to match.</p>' },
      ])}`,
  },
  {
    slug: 'doors',
    title: 'Making doors',
    teaser: 'The hardest detail on any dome, and three ways to solve it.',
    group: 'Build',
    related: ['assembly', 'coverings'],
    keywords: 'door entrance opening riser',
    art: () => icon('⌂', STRUT_COLORS[2]),
    body: () => accordion([
      { title: 'A flap in the cover', open: true, body: '<p>Simplest: leave one or two triangles open in the frame’s lowest course and fit a zipped or velcro flap in the cover. Fine for event and camping domes.</p>' },
      { title: 'A framed doorway in the riser', body: '<p>Build a short vertical riser wall and put a normal rectangular door in it. Easiest way to fit a standard door to a dome.</p>' },
      { title: 'An entry dormer', body: '<p>Remove one or two struts and frame a small projecting porch that carries a vertical door. Strengthen the hubs around the opening, because you have broken a triangle.</p>' },
    ]),
  },
  {
    slug: 'models',
    title: 'Making geodesic models',
    teaser: 'Build it small first: paper, straws, sticks and 3D prints.',
    group: 'Build',
    related: ['frequency', 'software'],
    keywords: 'model paper straws toothpicks 3d print stl',
    art: () => triangleSvg(2, 100),
    body: () => `
      <p>A model takes an evening and teaches you more about your dome than any drawing. It shows how the courses go
      together, where the pentagons fall, and how big the door can be.</p>
      ${accordion([
        { title: 'Straws and pipe cleaners', open: true, body: '<p>Cut drinking straws to scaled strut lengths (radius × chord factor at your model radius), colour them with markers, and join them with pipe cleaners threaded through.</p>' },
        { title: 'Sticks and glue', body: '<p>Bamboo skewers or wooden dowels with hot glue or small connectors make a sturdy desk model.</p>' },
        { title: 'Paper panels', body: '<p>Draw the cover templates at small scale, add tabs, and fold them into a paper dome.</p>' },
        { title: '3D printing', body: '<p>Download the dome as STL from the calculator’s cut list card and print it.</p>' },
      ])}`,
  },
  {
    slug: 'mistakes',
    title: 'Common mistakes',
    teaser: 'Dome builder’s blues, and how to avoid them.',
    group: 'Build',
    related: ['making-struts', 'assembly', 'anchoring'],
    keywords: 'problems errors fix leaks wrong strut',
    art: () => icon('!', STRUT_COLORS[3]),
    body: () => accordion([
      { title: 'A strut in the wrong place', open: true, body: '<p>Lengths can differ by millimetres, so a B in a C’s place will not jump out at you until the dome won’t close. Colour code both ends and follow the course list.</p>' },
      { title: 'Cutting everything before testing', body: '<p>Cut one of each length and assemble a test triangle first. A wrong hole offset multiplied by 165 struts is a long afternoon.</p>' },
      { title: 'A base that is not round or level', body: '<p>Measure the base ring’s diagonals before building up. An out-of-round base twists every course above it.</p>' },
      { title: 'Tightening too early', body: '<p>Keep bolts loose until a ring is complete, then tighten. Tight bolts fight you as the geometry settles.</p>' },
      { title: 'Leaks', body: '<p>Every triangle edge is a seam. Overlap covers downhill, seal seams on panel domes, and keep penetrations to a minimum.</p>' },
      { title: 'Not anchoring', body: '<p>Domes are light and catch the wind. Anchor before you cover, not after.</p>' },
    ]),
  },
  // ------------------------------------------------------------ Dome types
  {
    slug: 'types',
    title: 'Dome types',
    teaser: 'Greenhouses, pool domes, glamping, radomes, hexayurts and more.',
    group: 'Dome types',
    related: ['coverings', 'largest', 'eden'],
    keywords: 'greenhouse pool glamping hotel glass earth straw bale bamboo hexayurt yurt pillow radome event festival',
    art: () => `<img src="wiki/dome.png" alt="" />`,
    body: () => accordion([
      { title: 'Greenhouses', open: true, body: '<p>The most popular backyard dome. The shape catches low winter sun, sheds wind and snow, and circulates air evenly. Clear film or polycarbonate covers; a vent at the top.</p>' },
      { title: 'Pool domes', body: '<p>A clear dome over a pool extends the swimming season and keeps debris out. Size it from the pool’s diagonal plus walking room.</p>' },
      { title: 'Glamping and dome hotels', body: '<p>Insulated fabric domes on timber decks, with a big clear window panel, are a staple of glamping sites.</p>' },
      { title: 'Glass domes', body: '<p>Glazed triangular panels in a steel frame: beautiful and expensive, with careful sealing at every joint.</p>' },
      { title: 'Earth and straw-bale domes', body: '<p>A geodesic frame can carry earth-bag, cob or straw-bale walls, combining the frame’s strength with thermal mass or insulation.</p>' },
      { title: 'Bamboo domes', body: '<p>Bamboo is light, strong and renewable. Joints need care: lashing, bolts with plugged ends, or purpose-made connectors.</p>' },
      { title: 'Hexayurts', body: '<p>Not geodesic, but a close cousin: an open-source shelter designed by Vinay Gupta that is cut from standard 4×8 ft sheets with almost no waste.</p>' },
      { title: 'Yurts', body: '<p>The traditional round tent of Central Asia: a lattice wall and radial roof poles under felt or canvas. Easier to furnish than a dome, less strong in snow.</p>' },
      { title: 'Pillow domes', body: '<p>Inflated cushions of film held in a frame. Light, insulating and translucent; the Eden Project’s biomes use ETFE pillows.</p>' },
      { title: 'Radomes', body: '<p>Domes that protect radar and satellite antennas from weather while letting radio waves through. Many are geodesic, a use that started with Fuller’s Arctic domes.</p>' },
      { title: 'Event and festival domes', body: '<p>Light conduit frames with fabric or shade-cloth covers: quick to raise, quick to strike, and a fixture of festivals such as Burning Man.</p>' },
    ]),
  },
  // ------------------------------------------------------------ History
  {
    slug: 'largest',
    title: 'Notable large domes',
    teaser: 'Some of the biggest geodesic domes ever built.',
    group: 'History',
    related: ['history', 'eden', 'fuller'],
    keywords: 'biggest largest world record nagoya tacoma climatron biosphere epcot',
    art: () => `<img src="wiki/spaceship-earth.jpg" alt="" />`,
    body: () => `
      <table class="compare">
        <thead><tr><th>Dome</th><th>Place</th><th>Opened</th><th>Diameter</th></tr></thead>
        <tbody>
          <tr><td>Nagoya Dome</td><td>Nagoya, Japan</td><td>1997</td><td>about 187 m</td></tr>
          <tr><td>Tacoma Dome (timber)</td><td>Tacoma, USA</td><td>1983</td><td>about 160 m</td></tr>
          <tr><td>Union Tank Car Dome (demolished 2007)</td><td>Baton Rouge, USA</td><td>1958</td><td>about 117 m</td></tr>
          <tr><td>Biosphère, Expo 67</td><td>Montreal, Canada</td><td>1967</td><td>76 m</td></tr>
          <tr><td>Climatron</td><td>St. Louis, USA</td><td>1960</td><td>about 53 m</td></tr>
          <tr><td>Spaceship Earth, Epcot (full sphere)</td><td>Florida, USA</td><td>1982</td><td>about 50 m</td></tr>
          <tr><td>South Pole Station dome (removed)</td><td>Antarctica</td><td>1975</td><td>about 50 m</td></tr>
        </tbody>
      </table>
      <p class="caption">Figures are rounded; sources differ on exact dimensions and on what counts as geodesic.</p>
      <div class="photo-pair">
        ${img('biosphere-montreal.jpg', 'Biosphère, Montreal', 'Biosphère, Montreal')}
        ${img('spaceship-earth.jpg', 'Spaceship Earth', 'Spaceship Earth, Epcot')}
      </div>`,
  },
  {
    slug: 'eden',
    title: 'The Eden Project',
    teaser: 'A rainforest under bubbles in a Cornish clay pit.',
    group: 'History',
    related: ['largest', 'coverings', 'types'],
    keywords: 'cornwall biome etfe grimshaw rainforest',
    art: () => icon('◌', STRUT_COLORS[5]),
    body: () => `
      <p>In a worn-out clay pit in Cornwall, England, the Eden Project opened in 2001: a cluster of giant geodesic
      <b>biomes</b> designed by Nicholas Grimshaw’s practice. The larger biome holds a rainforest, the smaller a
      Mediterranean landscape.</p>
      <p>Their frames are steel hexagons and pentagons, and instead of glass each opening is an inflated cushion of
      <b>ETFE</b> film: light enough that the frames could be slender, clear enough to grow a jungle. It is the pillow dome
      taken to its limit.</p>`,
  },
  {
    slug: 'counterculture',
    title: 'Drop City and Domebook',
    teaser: 'How the 1960s turned domes into do-it-yourself homes.',
    group: 'History',
    related: ['history', 'fuller', 'festivals'],
    keywords: 'drop city domebook lloyd kahn hippie commune 1960s 1970s refried domes',
    art: () => icon('✺', STRUT_COLORS[7]),
    body: () => `
      <p>In 1965 a group of art students founded <b>Drop City</b> in southern Colorado and started building domes out of
      whatever they could find, famously including panels cut from the roofs of scrapped cars. Fuller gave the community
      one of his Dymaxion Awards. It was a kind of art project, a kind of home, and briefly a kind of legend.</p>
      <p>Lloyd Kahn and friends then published <b>Domebook One</b> and <b>Domebook 2</b> in the early 1970s: hand-made
      how-to books full of drawings, chord tables and hard-won advice, which carried dome building to thousands of
      backyard builders.</p>
      <p>Kahn later became one of the domes’ most honest critics. Leaks, awkward interiors and hard-to-fit windows sent him
      back to more conventional building, and he wrote about why. It is worth reading both sides before building a home
      that is a dome.</p>`,
  },
  {
    slug: 'festivals',
    title: 'Festivals and the Tactile Dome',
    teaser: 'Burning Man camps, Thunderdome, and a dome you explore in the dark.',
    group: 'History',
    related: ['types', 'counterculture'],
    keywords: 'burning man thunderdome exploratorium tactile dome coppola',
    art: () => icon('✦', STRUT_COLORS[4]),
    body: () => `
      <p>Light, quick to raise and shaded, conduit domes became a fixture of desert festivals, above all
      <b>Burning Man</b>, where shade domes cover camps and the famous <b>Thunderdome</b> stages bouts fought with foam
      weapons on harnesses inside a dome frame.</p>
      <p>In San Francisco, the Exploratorium’s <b>Tactile Dome</b>, created by August Coppola and opened in 1971, takes the
      opposite approach: a geodesic dome with no light at all, which visitors crawl, climb and slide through by touch alone.</p>`,
  },
  {
    slug: 'fuller-ideas',
    title: 'Fuller’s big ideas',
    teaser: 'Tensegrity, Synergetics and the Dymaxion map.',
    group: 'History',
    related: ['fuller', 'platonic'],
    keywords: 'tensegrity snelson synergetics dymaxion map ephemeralization',
    art: () => `<img src="wiki/fuller-teaching-1953.jpg" alt="" />`,
    body: () => accordion([
      { title: 'Tensegrity', open: true, body: '<p>Fuller coined the word from <i>tensional integrity</i>: rods that never touch one another, held in place by a continuous net of cables. His student Kenneth Snelson made the first famous tensegrity sculptures, starting in the late 1940s. The idea now turns up in engineering, robotics and models of living cells.</p>' },
      { title: 'Synergetics', body: '<p>Fuller’s two-volume attempt to rebuild geometry around the tetrahedron and around how nature actually builds, rather than around cubes and right angles. Dense, strange and full of ideas.</p>' },
      { title: 'The Dymaxion map', body: '<p>Project the globe onto an icosahedron, unfold it flat, and the continents appear as one island in one ocean, with far less distortion of size than familiar maps. Fuller first published it in 1943.</p>' },
      { title: 'Ephemeralization', body: '<p>Doing ever more with ever less material, energy and time, until in principle you can do almost everything with almost nothing. The geodesic dome was his favourite proof.</p>' },
    ]),
  },
  // ------------------------------------------------------------ Reference
  {
    slug: 'glossary',
    title: 'Glossary',
    teaser: 'Chord factor, course, frequency, hub, truncation and friends.',
    group: 'Reference',
    related: ['frequency', 'struts', 'solids'],
    keywords: 'terms definitions words',
    art: () => icon('A–Z', STRUT_COLORS[0]),
    body: () => `
      <input class="glossary-filter" type="search" placeholder="Filter terms…" aria-label="Filter glossary" />
      <dl class="glossary">${GLOSSARY.map(([t, d]) => `<div class="term" data-term="${t.toLowerCase()} ${d.toLowerCase()}"><dt>${t}</dt><dd>${d}</dd></div>`).join('')}</dl>`,
  },
  {
    slug: 'chord-charts',
    title: 'Chord factor charts',
    teaser: 'Every strut factor for every dome, ready to print.',
    group: 'Reference',
    related: ['struts', 'compare'],
    keywords: 'table chart print factors',
    art: () => `<span class="swatch-art">${STRUT_COLORS.slice(0, 6).map((c) => `<i style="background:${c}"></i>`).join('')}</span>`,
    body: ({ geometries }) => `
      <p>Multiply a chord factor by your sphere radius for the strut length, hub centre to hub centre.
      <button type="button" class="print-btn" onclick="window.print()">Print</button></p>
      ${geometries
        .map(
          (g) => `<h3>${g.spec.name}</h3>
          <table class="compare chord-table">
            <thead><tr><th>Strut</th><th>Chord factor</th><th>Quantity</th></tr></thead>
            <tbody>${g.strutTypes
              .map((t, i) => `<tr><td><span class="tag" style="background:${STRUT_COLORS[i]}">${t.label}</span></td><td>${t.chordFactor.toFixed(5)}</td><td>${t.count}</td></tr>`)
              .join('')}</tbody>
          </table>`,
        )
        .join('')}`,
  },
  {
    slug: 'software',
    title: 'Software and exports',
    teaser: 'Take your dome into Blender, SketchUp, CAD or a 3D printer.',
    group: 'Reference',
    related: ['models', 'chord-charts'],
    keywords: 'export obj stl csv blender sketchup freecad cad print spreadsheet',
    art: () => icon('⇩', STRUT_COLORS[2]),
    body: () => `
      <p>The calculator’s cut list card has three download buttons, all at the size you’ve entered:</p>
      ${accordion([
        { title: 'CSV cut list', open: true, body: '<p>Strut types, quantities, chord factors and lengths. Opens in any spreadsheet, for ordering stock and planning cuts.</p>' },
        { title: 'OBJ model', body: '<p>Hubs as vertices, panels as faces, and struts as lines grouped by type (strut_A, strut_B…). Imports into Blender, SketchUp (with an OBJ importer), FreeCAD and most 3D tools.</p>' },
        { title: 'STL shell', body: '<p>The panel surface as triangles, for slicers and 3D printers. Scale it down to print a desk model.</p>' },
      ])}`,
  },
];
