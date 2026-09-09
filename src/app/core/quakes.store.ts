import { computed, inject, Injectable, signal } from '@angular/core';
import { filterQuakes, type Range } from './filter';
import type { Quake } from './quake.model';
import { UsgsService } from './usgs.service';

export const DAY_MS = 24 * 60 * 60 * 1000;
export const MAG_BOUNDS: Range = [4.5, 10];

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

/**
 * Single source of truth. Every component reads from here and writes only to
 * these signals: nothing tells the map or the list what to do directly, which
 * is what keeps clicks from bouncing between the two.
 */
@Injectable({ providedIn: 'root' })
export class QuakesStore {
  private readonly usgs = inject(UsgsService);

  private readonly now = Date.now();

  readonly quakes = signal<readonly Quake[]>([]);
  readonly status = signal<LoadStatus>('idle');
  readonly error = signal<string | null>(null);

  readonly magRange = signal<Range>(MAG_BOUNDS);
  readonly dateRange = signal<Range>([this.now - 30 * DAY_MS, this.now]);

  readonly selectedId = signal<string | null>(null);
  readonly hoveredId = signal<string | null>(null);

  /** Feeds the card list and `source.setData()` alike. */
  readonly visible = computed(() => filterQuakes(this.quakes(), this.magRange(), this.dateRange()));

  readonly selected = computed(() => {
    const id = this.selectedId();
    return id === null ? null : (this.visible().find((q) => q.id === id) ?? null);
  });

  readonly dateBounds = computed<Range>(() => [this.now - 30 * DAY_MS, this.now]);

  async load(): Promise<void> {
    this.status.set('loading');
    this.error.set(null);
    try {
      this.quakes.set(await this.usgs.loadQuakes());
      this.status.set('ready');
    } catch (cause) {
      this.error.set(cause instanceof Error ? cause.message : 'Could not load the USGS feed');
      this.status.set('error');
    }
  }

  select(id: string | null): void {
    this.selectedId.set(id);
  }

  hover(id: string | null): void {
    this.hoveredId.set(id);
  }

  setMagRange(range: Range): void {
    this.magRange.set(range);
  }

  setDateRange(range: Range): void {
    this.dateRange.set(range);
  }
}
