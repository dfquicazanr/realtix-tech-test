import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MAG_BOUNDS, QuakesStore } from '../core/quakes.store';

/** `YYYY-MM-DD` in local time, which is what `<input type="date">` expects. */
export function toDateInput(epochMs: number): string {
  const date = new Date(epochMs);
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Start or end of the given local day, as epoch ms. */
export function fromDateInput(value: string, edge: 'start' | 'end'): number | null {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return edge === 'start'
    ? new Date(year, month - 1, day, 0, 0, 0, 0).getTime()
    : new Date(year, month - 1, day, 23, 59, 59, 999).getTime();
}

@Component({
  selector: 'app-quake-filters',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe],
  template: `
    <form class="space-y-4 px-4 py-3 text-sm" data-testid="filters" (submit)="$event.preventDefault()">
      <fieldset>
        <legend class="font-medium">Magnitud</legend>
        <p class="text-xs text-slate-500" data-testid="mag-summary">
          {{ store.magRange()[0] | number: '1.1-1' }} a {{ store.magRange()[1] | number: '1.1-1' }}
        </p>
        <label class="mt-2 flex items-center gap-2">
          <span class="w-8 text-xs text-slate-500">mín</span>
          <input
            type="range"
            class="flex-1"
            data-testid="mag-min"
            [min]="bounds[0]"
            [max]="bounds[1]"
            step="0.1"
            [value]="store.magRange()[0]"
            (input)="onMagMin($event)"
          />
        </label>
        <label class="flex items-center gap-2">
          <span class="w-8 text-xs text-slate-500">máx</span>
          <input
            type="range"
            class="flex-1"
            data-testid="mag-max"
            [min]="bounds[0]"
            [max]="bounds[1]"
            step="0.1"
            [value]="store.magRange()[1]"
            (input)="onMagMax($event)"
          />
        </label>
      </fieldset>

      <fieldset>
        <legend class="font-medium">Fechas</legend>
        <div class="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
          <label class="min-w-0 flex-1">
            <span class="block text-xs text-slate-500">desde</span>
            <input
              type="date"
              class="w-full rounded border border-slate-300 px-2 py-1"
              data-testid="date-from"
              [min]="minDate()"
              [max]="maxDate()"
              [value]="fromValue()"
              (change)="onDateFrom($event)"
            />
          </label>
          <label class="min-w-0 flex-1">
            <span class="block text-xs text-slate-500">hasta</span>
            <input
              type="date"
              class="w-full rounded border border-slate-300 px-2 py-1"
              data-testid="date-to"
              [min]="minDate()"
              [max]="maxDate()"
              [value]="toValue()"
              (change)="onDateTo($event)"
            />
          </label>
        </div>
      </fieldset>

      <button
        type="button"
        class="rounded border border-slate-300 px-3 py-1 text-xs hover:bg-slate-100"
        data-testid="filters-reset"
        (click)="reset()"
      >
        Limpiar filtros
      </button>
    </form>
  `,
})
export class QuakeFilters {
  protected readonly store = inject(QuakesStore);
  protected readonly bounds = MAG_BOUNDS;

  protected readonly minDate = computed(() => toDateInput(this.store.dateBounds()[0]));
  protected readonly maxDate = computed(() => toDateInput(this.store.dateBounds()[1]));
  protected readonly fromValue = computed(() => toDateInput(this.store.dateRange()[0]));
  protected readonly toValue = computed(() => toDateInput(this.store.dateRange()[1]));

  protected onMagMin(event: Event): void {
    const [, max] = this.store.magRange();
    const value = Number((event.target as HTMLInputElement).value);
    this.store.setMagRange([Math.min(value, max), max]);
  }

  protected onMagMax(event: Event): void {
    const [min] = this.store.magRange();
    const value = Number((event.target as HTMLInputElement).value);
    this.store.setMagRange([min, Math.max(value, min)]);
  }

  protected onDateFrom(event: Event): void {
    const [, to] = this.store.dateRange();
    const value = fromDateInput((event.target as HTMLInputElement).value, 'start');
    if (value === null) return;
    this.store.setDateRange([Math.min(value, to), to]);
  }

  protected onDateTo(event: Event): void {
    const [from] = this.store.dateRange();
    const value = fromDateInput((event.target as HTMLInputElement).value, 'end');
    if (value === null) return;
    this.store.setDateRange([from, Math.max(value, from)]);
  }

  protected reset(): void {
    this.store.resetFilters();
  }
}
