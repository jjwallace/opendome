import { describe, expect, it } from 'vitest';
import { DOMES } from '../src/domes';
import { buildDome } from '../src/geodesic';

const dome = (id: string) => buildDome(DOMES.find((d) => d.id === id)!);
const counts = (id: string) => dome(id).strutTypes.map((t) => t.count);
const factors = (id: string) => dome(id).strutTypes.map((t) => Number(t.chordFactor.toFixed(5)));

// Reference strut tables: Desert Domes / the original OpenDome calculator.
describe('strut tables', () => {
  it('2V 1/2', () => {
    expect(factors('2v-1-2')).toEqual([0.54653, 0.61803]);
    expect(counts('2v-1-2')).toEqual([30, 35]);
  });

  it('3V 5/8 matches the original OpenDome calculator', () => {
    expect(factors('3v-5-8')).toEqual([0.34862, 0.40355, 0.41241]);
    expect(counts('3v-5-8')).toEqual([30, 55, 80]);
    expect(dome('3v-5-8').vertices).toHaveLength(61);
  });

  it('3V 3/8', () => {
    expect(counts('3v-3-8')).toEqual([30, 40, 50]);
  });

  it('4V 1/2', () => {
    expect(factors('4v-1-2')).toEqual([0.25318, 0.29453, 0.29524, 0.29859, 0.31287, 0.32492]);
    expect(counts('4v-1-2')).toEqual([30, 60, 30, 30, 70, 30]);
  });

  it('5V 7/15 and 8/15', () => {
    expect(counts('5v-7-15')).toEqual([30, 60, 30, 30, 50, 10, 60, 50, 30]);
    expect(counts('5v-8-15')).toEqual([30, 60, 30, 30, 80, 20, 70, 70, 35]);
  });
});

describe('every dome', () => {
  for (const spec of DOMES) {
    it(`${spec.name} is a closed, consistent shell`, () => {
      const g = buildDome(spec);
      // Euler characteristic of a disc: V - E + F = 1.
      expect(g.vertices.length - g.edges.length + g.faces.length).toBe(1);
      expect(g.strutTypes.reduce((n, t) => n + t.count, 0)).toBe(g.edges.length);
      expect(g.hubs.reduce((n, h) => n + h.count, 0)).toBe(g.vertices.length);
      // Bounded by a sphere of the same radius.
      expect(g.volumeFactor).toBeGreaterThan(0);
      expect(g.volumeFactor).toBeLessThan((4 / 3) * Math.PI);
      expect(g.surfaceAreaFactor).toBeLessThan(4 * Math.PI);
    });
  }

  it('even-frequency hemispheres have flat bases and half a sphere of volume', () => {
    for (const id of ['2v-1-2', '4v-1-2', '6v-1-2']) {
      const g = dome(id);
      expect(g.flatBase).toBe(true);
      expect(g.heightFactor).toBeCloseTo(1, 6);
      expect(g.volumeFactor).toBeLessThan((2 / 3) * Math.PI);
      expect(g.volumeFactor).toBeGreaterThan(0.8 * (2 / 3) * Math.PI);
    }
  });
});
