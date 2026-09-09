import type { Page } from '@playwright/test';

export const USGS_FEED_URL =
  'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_month.geojson';

const DAY = 24 * 60 * 60 * 1000;

interface Sample {
  id: string;
  mag: number;
  place: string;
  daysAgo: number;
  coordinates: [number, number];
}

/** Spread over magnitude and time so a filter move has something to cut. */
export const SAMPLES: Sample[] = [
  { id: 'q1', mag: 4.6, place: 'Off the coast of Oregon', daysAgo: 1, coordinates: [-125.5, 43.2] },
  { id: 'q2', mag: 5.1, place: 'Tonga', daysAgo: 3, coordinates: [-175.2, -20.4] },
  { id: 'q3', mag: 5.8, place: 'Hokkaido, Japan', daysAgo: 6, coordinates: [143.1, 42.6] },
  { id: 'q4', mag: 6.3, place: 'Antofagasta, Chile', daysAgo: 10, coordinates: [-70.4, -23.7] },
  { id: 'q5', mag: 6.9, place: 'Mindanao, Philippines', daysAgo: 15, coordinates: [126.1, 6.9] },
  { id: 'q6', mag: 7.4, place: 'Kamchatka Peninsula', daysAgo: 22, coordinates: [160.6, 54.1] },
];

/**
 * Serves a deterministic feed so the assertions can talk about exact counts.
 * The app still requests the real USGS URL, which the first test checks.
 */
export async function stubFeed(page: Page): Promise<void> {
  const now = Date.now();
  const body = {
    type: 'FeatureCollection',
    features: SAMPLES.map((sample) => ({
      type: 'Feature',
      id: sample.id,
      properties: {
        mag: sample.mag,
        place: sample.place,
        time: now - sample.daysAgo * DAY,
        updated: now - sample.daysAgo * DAY,
        url: `https://earthquake.usgs.gov/earthquakes/eventpage/${sample.id}`,
        status: 'reviewed',
        tsunami: 0,
        sig: Math.round(sample.mag * 100),
        magType: 'mww',
        type: 'earthquake',
        title: `M ${sample.mag} - ${sample.place}`,
      },
      geometry: { type: 'Point', coordinates: [...sample.coordinates, 10] },
    })),
  };

  await page.route(USGS_FEED_URL, (route) =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) }),
  );
}
