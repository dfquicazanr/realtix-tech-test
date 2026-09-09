import { parseQuakes } from './usgs.service';

function feed(features: unknown[]): unknown {
  return { type: 'FeatureCollection', features };
}

const valid = {
  type: 'Feature',
  id: 'us1000',
  properties: { mag: 5.1, place: 'Mid-Indian Ridge', time: 1_700_000_000_000, updated: null },
  geometry: { type: 'Point', coordinates: [74.3, -28.6, 10] },
};

describe('parseQuakes', () => {
  it('maps a well formed feature', () => {
    const [quake] = parseQuakes(feed([valid]));
    expect(quake.id).toBe('us1000');
    expect(quake.properties.mag).toBe(5.1);
    expect(quake.properties.place).toBe('Mid-Indian Ridge');
    expect(quake.properties.depthKm).toBe(10);
    expect(quake.geometry.coordinates).toEqual([74.3, -28.6]);
  });

  it('assigns sequential numeric ids for MapLibre feature state', () => {
    const parsed = parseQuakes(feed([valid, { ...valid, id: 'us1001' }]));
    expect(parsed.map((q) => q.properties.quakeId)).toEqual([0, 1]);
    expect(parsed.map((q) => q.properties.eventId)).toEqual(['us1000', 'us1001']);
  });

  it('drops features without a magnitude instead of crashing', () => {
    const parsed = parseQuakes(
      feed([{ ...valid, id: 'no-mag', properties: { ...valid.properties, mag: null } }, valid]),
    );
    expect(parsed.map((q) => q.id)).toEqual(['us1000']);
  });

  it('drops features without geometry instead of crashing', () => {
    const parsed = parseQuakes(feed([{ ...valid, id: 'no-geom', geometry: null }, valid]));
    expect(parsed.map((q) => q.id)).toEqual(['us1000']);
  });

  it('drops features whose geometry is not a point', () => {
    const geometry = { type: 'LineString', coordinates: [[0, 0]] };
    const parsed = parseQuakes(feed([{ ...valid, id: 'line', geometry }, valid]));
    expect(parsed.map((q) => q.id)).toEqual(['us1000']);
  });

  it('drops features without a timestamp or without an id', () => {
    const noTime = { ...valid, id: 'no-time', properties: { ...valid.properties, time: null } };
    const noId = { ...valid, id: undefined };
    expect(parseQuakes(feed([noTime, noId]))).toEqual([]);
  });

  it('falls back to a readable place when the feed omits it', () => {
    const [quake] = parseQuakes(
      feed([{ ...valid, properties: { ...valid.properties, place: null } }]),
    );
    expect(quake.properties.place).toBe('Unknown location');
  });

  it('survives a payload that is not a feature collection', () => {
    expect(parseQuakes(null)).toEqual([]);
    expect(parseQuakes({})).toEqual([]);
    expect(parseQuakes({ features: 'nope' })).toEqual([]);
    expect(parseQuakes(feed([null, 42, 'x']))).toEqual([]);
  });
});
