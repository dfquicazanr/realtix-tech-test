import type { Feature, FeatureCollection, Point } from 'geojson';

/**
 * Properties we keep from the USGS feed, plus `quakeId`: a stable numeric id
 * assigned once at load time. MapLibre needs a numeric feature id to drive
 * `setFeatureState`, and deriving it from the filtered array would break every
 * time the filters change.
 */
export interface QuakeProperties {
  quakeId: number;
  mag: number;
  place: string;
  time: number;
  updated: number | null;
  url: string | null;
  status: string | null;
  tsunami: number;
  sig: number | null;
  alert: string | null;
  felt: number | null;
  magType: string | null;
  type: string | null;
  title: string;
  depthKm: number | null;
}

export interface Quake extends Feature<Point, QuakeProperties> {
  /** USGS event id, e.g. `us7000tg6g`. The business key used across the app. */
  id: string;
}

export type QuakeCollection = FeatureCollection<Point, QuakeProperties>;

export function toCollection(quakes: readonly Quake[]): QuakeCollection {
  return { type: 'FeatureCollection', features: quakes as Quake[] };
}
