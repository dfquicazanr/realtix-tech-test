import { TestBed } from '@angular/core/testing';
import { QuakesStore } from './quakes.store';
import { UsgsService } from './usgs.service';
import type { Quake } from './quake.model';

function quake(id: string, mag: number, time: number): Quake {
  return {
    type: 'Feature',
    id,
    geometry: { type: 'Point', coordinates: [1, 2] },
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

const NOW = Date.now();
const DAY = 24 * 60 * 60 * 1000;
const SAMPLE = [quake('0', 4.6, NOW - DAY), quake('1', 6.2, NOW - 2 * DAY)];

describe('QuakesStore', () => {
  let store: QuakesStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: UsgsService, useValue: { loadQuakes: () => Promise.resolve(SAMPLE) } },
      ],
    });
    store = TestBed.inject(QuakesStore);
  });

  it('exposes the loaded feed once it resolves', async () => {
    await store.load();
    expect(store.status()).toBe('ready');
    expect(store.visible().length).toBe(2);
  });

  it('reports the error instead of throwing when the feed fails', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: UsgsService,
          useValue: { loadQuakes: () => Promise.reject(new Error('USGS feed responded 503')) },
        },
      ],
    });
    const failing = TestBed.inject(QuakesStore);

    await failing.load();

    expect(failing.status()).toBe('error');
    expect(failing.error()).toBe('USGS feed responded 503');
    expect(failing.visible()).toEqual([]);
  });

  it('narrows visible() when the magnitude filter moves', async () => {
    await store.load();
    store.setMagRange([6, 10]);
    expect(store.visible().map((q) => q.id)).toEqual(['1']);
  });

  it('narrows visible() when the date filter moves', async () => {
    await store.load();
    store.setDateRange([NOW - 1.5 * DAY, NOW]);
    expect(store.visible().map((q) => q.id)).toEqual(['0']);
  });

  it('restores the full range on reset', async () => {
    await store.load();
    store.setMagRange([7, 10]);
    expect(store.visible()).toEqual([]);
    store.resetFilters();
    expect(store.visible().length).toBe(2);
  });

  it('resolves the selection against the visible set', async () => {
    await store.load();
    store.select('1');
    expect(store.selected()?.id).toBe('1');

    // Filtered out means no detail to show, even though the id is still set.
    store.setMagRange([4.5, 5]);
    expect(store.selected()).toBeNull();
  });
});
