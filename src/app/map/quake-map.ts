import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { type GeoJSONSource, Map as MapLibreMap } from 'maplibre-gl';
import { QuakesStore } from '../core/quakes.store';
import { toCollection } from '../core/quake.model';

const BASEMAP_STYLE = 'https://demotiles.maplibre.org/style.json';
const SOURCE_ID = 'quakes';
const LAYER_ID = 'quake-points';

@Component({
  selector: 'app-quake-map',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div #container class="h-full w-full" data-testid="map"></div>`,
})
export class QuakeMap implements AfterViewInit {
  private readonly store = inject(QuakesStore);
  private readonly container = viewChild.required<ElementRef<HTMLDivElement>>('container');

  private map?: MapLibreMap;
  private readonly styleReady = signal(false);

  constructor() {
    // The map is a plain reader of `visible()`: one array drives both the list
    // and the layer, so the two can never show different sets.
    effect(() => {
      const features = this.store.visible();
      if (!this.styleReady()) return;
      this.map?.getSource<GeoJSONSource>(SOURCE_ID)?.setData(toCollection(features));
    });

    inject(DestroyRef).onDestroy(() => this.map?.remove());
  }

  ngAfterViewInit(): void {
    const map = new MapLibreMap({
      container: this.container().nativeElement,
      style: BASEMAP_STYLE,
      center: [0, 20],
      zoom: 1.4,
      attributionControl: { compact: true },
    });
    this.map = map;

    map.on('load', () => {
      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: toCollection(this.store.visible()),
        // Stable numeric ids assigned at load time; `setFeatureState` needs them.
        promoteId: 'quakeId',
      });

      map.addLayer({
        id: LAYER_ID,
        type: 'circle',
        source: SOURCE_ID,
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['get', 'mag'], 4.5, 4, 6, 8, 8, 16],
          'circle-color': '#f97316',
          'circle-opacity': 0.75,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#7c2d12',
        },
      });

      this.styleReady.set(true);
    });
  }
}
