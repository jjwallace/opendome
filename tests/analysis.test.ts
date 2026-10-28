import { describe, expect, it } from 'vitest';
import { baseShims, courses, domeObj, domeStl, panelTypes } from '../src/analysis';
import { DOMES } from '../src/domes';
import { buildDome } from '../src/geodesic';

const dome = (id: string) => buildDome(DOMES.find((d) => d.id === id)!);

describe('analysis', () => {
  it('panel templates cover every face; 2V and 3V match published tables', () => {
    for (const spec of DOMES) {
      const g = buildDome(spec);
      expect(panelTypes(g).reduce((n, p) => n + p.count, 0)).toBe(g.faces.length);
      const area = panelTypes(g).reduce((n, p) => n + p.count * p.areaFactor, 0);
      expect(area).toBeCloseTo(g.surfaceAreaFactor, 9);
    }
    const table = (id: string) => panelTypes(dome(id)).map((p) => `${p.count}${p.key}`);
    expect(table('2v-1-2')).toEqual(['30AAB', '10BBB']);
    expect(table('3v-5-8')).toEqual(['75BCC', '30AAB']);
  });

  it('flat bases need no shims; odd frequencies do', () => {
    expect(baseShims(dome('4v-1-2'))).toEqual([{ lift: 0, hubs: 20 }]);
    const shims = baseShims(dome('3v-5-8'));
    expect(shims.length).toBeGreaterThan(1);
    expect(shims.reduce((n, s) => n + s.hubs, 0)).toBe(15);
    expect(shims[shims.length - 1].lift).toBeCloseTo(dome('3v-5-8').baseVariationFactor, 4);
  });

  it('courses cover every strut once', () => {
    for (const spec of DOMES) {
      const g = buildDome(spec);
      const total = courses(g).flat().reduce((n, c) => n + c, 0);
      expect(total).toBe(g.edges.length);
    }
  });

  it('exports reference every vertex and face', () => {
    const g = dome('3v-5-8');
    const obj = domeObj(g, 12, 'ft');
    expect(obj.match(/^v /gm)).toHaveLength(61);
    expect(obj.match(/^f /gm)).toHaveLength(105);
    expect(obj.match(/^l /gm)).toHaveLength(165);
    expect(domeStl(g, 12).match(/facet normal/g)).toHaveLength(105);
  });
});
