import { Injectable } from '@angular/core';
import type { Quake } from './quake.model';

export const USGS_FEED_URL =
  'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_month.geojson';

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

/**
 * Turns the raw feed into the shape the app works with. The feed is public and
 * occasionally carries incomplete records, so anything without an id, a point
 * geometry, a magnitude or a timestamp is dropped instead of crashing the app.
 */
export function parseQuakes(raw: unknown): Quake[] {
  const features = (raw as { features?: unknown })?.features;
  if (!Array.isArray(features)) return [];

  const quakes: Quake[] = [];
  for (const feature of features) {
    if (!feature || typeof feature !== 'object') continue;

    const f = feature as Record<string, unknown>;
    const id = str(f['id']);
    const props = (f['properties'] ?? {}) as Record<string, unknown>;
    const geometry = f['geometry'] as { type?: unknown; coordinates?: unknown } | null | undefined;

    if (!id || !geometry || geometry.type !== 'Point') continue;

    const coordinates = geometry.coordinates;
    if (!Array.isArray(coordinates)) continue;

    const lon = num(coordinates[0]);
    const lat = num(coordinates[1]);
    const mag = num(props['mag']);
    const time = num(props['time']);
    if (lon === null || lat === null || mag === null || time === null) continue;

    quakes.push({
      type: 'Feature',
      id,
      geometry: { type: 'Point', coordinates: [lon, lat] },
      properties: {
        quakeId: quakes.length,
        mag,
        place: str(props['place']) ?? 'Unknown location',
        time,
        updated: num(props['updated']),
        url: str(props['url']),
        status: str(props['status']),
        tsunami: num(props['tsunami']) ?? 0,
        sig: num(props['sig']),
        alert: str(props['alert']),
        felt: num(props['felt']),
        magType: str(props['magType']),
        type: str(props['type']),
        title: str(props['title']) ?? `M ${mag}`,
        depthKm: num(coordinates[2]),
      },
    });
  }
  return quakes;
}

@Injectable({ providedIn: 'root' })
export class UsgsService {
  async loadQuakes(): Promise<Quake[]> {
    const response = await fetch(USGS_FEED_URL);
    if (!response.ok) {
      throw new Error(`USGS feed responded ${response.status}`);
    }
    return parseQuakes(await response.json());
  }
}
