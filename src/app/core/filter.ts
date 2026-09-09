import type { Quake } from './quake.model';

export type Range = readonly [number, number];

/**
 * The single filtering pass of the app. Both the card list and the map layer
 * are rendered from this one result, so they cannot drift apart.
 * Both bounds are inclusive.
 */
export function filterQuakes(quakes: readonly Quake[], mag: Range, date: Range): Quake[] {
  const [minMag, maxMag] = mag;
  const [minTime, maxTime] = date;

  return quakes.filter((quake) => {
    const { mag: m, time } = quake.properties;
    return m >= minMag && m <= maxMag && time >= minTime && time <= maxTime;
  });
}
