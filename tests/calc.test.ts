import { describe, expect, it } from 'vitest';
import { feetInches, fields, radiusFrom, stockNeeded, valueOf } from '../src/calc';
import { DOMES } from '../src/domes';
import { buildDome } from '../src/geodesic';

describe('calculator fields', () => {
  const g = buildDome(DOMES.find((d) => d.id === '3v-5-8')!);

  it('every field round-trips through the radius', () => {
    for (const f of fields(g)) {
      expect(radiusFrom(f, valueOf(f, 12))).toBeCloseTo(12, 9);
    }
  });

  it('a 24 ft 3V 5/8 dome gives the original calculator strut lengths', () => {
    const struts = fields(g).filter((f) => f.key.startsWith('strut')).map((f) => valueOf(f, 12).toFixed(2));
    expect(struts).toEqual(['4.18', '4.84', '4.95']);
  });
});

describe('formatting and stock', () => {
  it('formats feet and inches to the nearest 1/16"', () => {
    expect(feetInches(4.94892)).toBe(`4' 11 3/8"`);
    expect(feetInches(0.19271)).toBe(`2 5/16"`);
    expect(feetInches(3)).toBe(`3' 0"`);
  });

  it('packs struts into stock lengths', () => {
    expect(stockNeeded([4, 4, 4, 2, 2], 10, 0).sticks).toBe(2);
    expect(stockNeeded([6, 6, 6], 10, 0).sticks).toBe(3);
    expect(stockNeeded([5, 5], 10, 0.1).sticks).toBe(2);
    expect(stockNeeded([11], 10, 0).sticks).toBe(Number.POSITIVE_INFINITY);
  });
});
