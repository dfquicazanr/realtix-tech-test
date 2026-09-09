import { filterQuakes } from './filter';
import type { Quake } from './quake.model';

function quake(id: string, mag: number, time: number): Quake {
  return {
    type: 'Feature',
    id,
    geometry: { type: 'Point', coordinates: [0, 0] },
    properties: {
      quakeId: Number(id),
      eventId: id,
      mag,
      place: `place ${id}`,
      time,
      updated: null,
      url: null,
      status: null,
      tsunami: 0,
      sig: null,
      alert: null,
      felt: null,
      magType: null,
      type: 'earthquake',
      title: `M ${mag}`,
      depthKm: null,
    },
  };
}

const DAY = 24 * 60 * 60 * 1000;
const T0 = 1_700_000_000_000;

const quakes: Quake[] = [
  quake('0', 4.5, T0),
  quake('1', 5.5, T0 + DAY),
  quake('2', 6.5, T0 + 2 * DAY),
  quake('3', 7.5, T0 + 3 * DAY),
];

const ALL_MAG: [number, number] = [4.5, 10];
const ALL_TIME: [number, number] = [T0, T0 + 3 * DAY];

describe('filterQuakes', () => {
  it('keeps everything when both ranges cover the data', () => {
    expect(filterQuakes(quakes, ALL_MAG, ALL_TIME).length).toBe(4);
  });

  it('includes the magnitudes sitting exactly on the bounds', () => {
    const result = filterQuakes(quakes, [5.5, 6.5], ALL_TIME);
    expect(result.map((q) => q.id)).toEqual(['1', '2']);
  });

  it('includes the dates sitting exactly on the bounds', () => {
    const result = filterQuakes(quakes, ALL_MAG, [T0 + DAY, T0 + 2 * DAY]);
    expect(result.map((q) => q.id)).toEqual(['1', '2']);
  });

  it('applies both ranges at once', () => {
    const result = filterQuakes(quakes, [6, 10], [T0, T0 + 2 * DAY]);
    expect(result.map((q) => q.id)).toEqual(['2']);
  });

  it('returns an empty list when the magnitude range excludes everything', () => {
    expect(filterQuakes(quakes, [9, 10], ALL_TIME)).toEqual([]);
  });

  it('returns an empty list when the date range excludes everything', () => {
    expect(filterQuakes(quakes, ALL_MAG, [T0 - 10 * DAY, T0 - DAY])).toEqual([]);
  });

  it('returns an empty list when the range is inverted', () => {
    expect(filterQuakes(quakes, [7, 5], ALL_TIME)).toEqual([]);
  });

  it('does not mutate the input array', () => {
    const input = [...quakes];
    filterQuakes(input, [6, 10], ALL_TIME);
    expect(input.length).toBe(4);
  });
});
