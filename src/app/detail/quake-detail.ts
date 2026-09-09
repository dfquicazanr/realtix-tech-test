import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { QuakesStore } from '../core/quakes.store';

@Component({
  selector: 'app-quake-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, DecimalPipe],
  template: `
    @if (store.selected(); as quake) {
      <section
        class="w-80 rounded-lg border border-slate-300 bg-white/95 p-4 shadow-lg backdrop-blur"
        data-testid="quake-detail"
      >
        <header class="flex items-start gap-2">
          <h2 class="min-w-0 flex-1 text-sm font-semibold" data-testid="detail-title">
            {{ quake.properties.title }}
          </h2>
          <button
            type="button"
            class="rounded px-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Cerrar detalle"
            data-testid="detail-close"
            (click)="store.select(null)"
          >
            ✕
          </button>
        </header>

        <dl class="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
          <dt class="text-slate-500">Lugar</dt>
          <dd class="text-right">{{ quake.properties.place }}</dd>

          <dt class="text-slate-500">Magnitud</dt>
          <dd class="text-right tabular-nums">
            {{ quake.properties.mag | number: '1.1-1' }} {{ quake.properties.magType }}
          </dd>

          <dt class="text-slate-500">Fecha</dt>
          <dd class="text-right">{{ quake.properties.time | date: 'medium' }}</dd>

          <dt class="text-slate-500">Actualizado</dt>
          <dd class="text-right">{{ quake.properties.updated | date: 'medium' }}</dd>

          <dt class="text-slate-500">Profundidad</dt>
          <dd class="text-right tabular-nums">
            {{ quake.properties.depthKm | number: '1.0-1' }} km
          </dd>

          <dt class="text-slate-500">Coordenadas</dt>
          <dd class="text-right tabular-nums">
            {{ quake.geometry.coordinates[1] | number: '1.3-3' }},
            {{ quake.geometry.coordinates[0] | number: '1.3-3' }}
          </dd>

          <dt class="text-slate-500">Estado</dt>
          <dd class="text-right">{{ quake.properties.status }}</dd>

          <dt class="text-slate-500">Tipo</dt>
          <dd class="text-right">{{ quake.properties.type }}</dd>

          <dt class="text-slate-500">Significancia</dt>
          <dd class="text-right tabular-nums">{{ quake.properties.sig }}</dd>

          <dt class="text-slate-500">Alerta</dt>
          <dd class="text-right">{{ quake.properties.alert ?? 'ninguna' }}</dd>

          <dt class="text-slate-500">Tsunami</dt>
          <dd class="text-right">{{ quake.properties.tsunami ? 'sí' : 'no' }}</dd>

          <dt class="text-slate-500">Reportes</dt>
          <dd class="text-right tabular-nums">{{ quake.properties.felt ?? 0 }}</dd>

          <dt class="text-slate-500">Id</dt>
          <dd class="text-right font-mono">{{ quake.id }}</dd>
        </dl>

        @if (quake.properties.url) {
          <a
            class="mt-3 inline-block text-xs font-medium text-blue-700 underline"
            [href]="quake.properties.url"
            target="_blank"
            rel="noopener"
          >
            Ver en USGS
          </a>
        }
      </section>
    }
  `,
})
export class QuakeDetail {
  protected readonly store = inject(QuakesStore);
}
