import { expect, test, type Page } from '@playwright/test';
import { SAMPLES, stubFeed, USGS_FEED_URL } from './fixture';

const map = (page: Page) => page.getByTestId('map');
const cards = (page: Page) => page.getByTestId('quake-card');

async function mapCount(page: Page): Promise<number> {
  return Number(await map(page).getAttribute('data-quake-count'));
}

test.beforeEach(async ({ page }) => {
  await stubFeed(page);
});

test('carga la app, pide el feed de USGS y pinta los puntos en el mapa', async ({ page }) => {
  const feedRequest = page.waitForRequest(USGS_FEED_URL);
  await page.goto('/');
  await feedRequest;

  await expect(page.locator('.maplibregl-canvas')).toBeVisible();
  await expect(cards(page)).toHaveCount(SAMPLES.length);
  await expect(map(page)).toHaveAttribute('data-quake-count', String(SAMPLES.length));
});

test('clic en una tarjeta mueve el mapa hasta el sismo y abre su detalle', async ({ page }) => {
  await page.goto('/');
  await expect(cards(page)).toHaveCount(SAMPLES.length);

  const target = SAMPLES.find((sample) => sample.place === 'Kamchatka Peninsula')!;
  await cards(page).filter({ hasText: target.place }).click();

  await expect(page.getByTestId('quake-detail')).toContainText(target.place);

  // flyTo runs off the selection effect, so the map ends up centred on the quake.
  await expect
    .poll(async () => {
      const center = await map(page).getAttribute('data-map-center');
      if (!center) return null;
      const [lng, lat] = center.split(',').map(Number);
      return Math.abs(lng - target.coordinates[0]) < 0.5 && Math.abs(lat - target.coordinates[1]) < 0.5;
    }, { timeout: 15_000 })
    .toBe(true);
});

test('mover un filtro reduce la lista y el mapa a la vez', async ({ page }) => {
  await page.goto('/');
  await expect(cards(page)).toHaveCount(SAMPLES.length);
  expect(await mapCount(page)).toBe(SAMPLES.length);

  // Magnitude 6.0 and up: three of the six samples.
  const expected = SAMPLES.filter((sample) => sample.mag >= 6).length;
  await page.getByTestId('mag-min').fill('6');
  await page.getByTestId('mag-min').dispatchEvent('input');

  await expect(cards(page)).toHaveCount(expected);
  await expect(map(page)).toHaveAttribute('data-quake-count', String(expected));
  expect(await mapCount(page)).toBe(await cards(page).count());
});
