import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { QuakesStore } from '../core/quakes.store';

@Component({
  selector: 'app-quake-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, DecimalPipe],
  template: `
    <ul class="divide-y divide-slate-200" data-testid="quake-list">
      @for (quake of store.visible(); track quake.id) {
        <li
          class="flex items-start gap-3 px-4 py-3"
          data-testid="quake-card"
          [attr.data-quake-id]="quake.id"
        >
          <span
            class="mt-0.5 shrink-0 rounded px-2 py-1 text-sm font-semibold tabular-nums text-white"
            [style.background-color]="magColor(quake.properties.mag)"
            data-testid="quake-mag"
          >
            {{ quake.properties.mag | number: '1.1-1' }}
          </span>
          <span class="min-w-0">
            <span class="block truncate text-sm font-medium" data-testid="quake-place">
              {{ quake.properties.place }}
            </span>
            <span class="block text-xs text-slate-500">
              {{ quake.properties.time | date: 'medium' }}
            </span>
          </span>
        </li>
      } @empty {
        <li class="px-4 py-6 text-sm text-slate-500" data-testid="quake-list-empty">
          Ningún sismo coincide con los filtros.
        </li>
      }
    </ul>
  `,
})
export class QuakeList {
  protected readonly store = inject(QuakesStore);

  protected magColor(mag: number): string {
    if (mag >= 7) return '#7f1d1d';
    if (mag >= 6) return '#b91c1c';
    if (mag >= 5) return '#ea580c';
    return '#d97706';
  }
}
