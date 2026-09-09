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
import { type GeoJSONSource, Map as MapLibreMap, type MapMouseEvent } from 'maplibre-gl';
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
      const map = this.map;
      if (!map) return;
      map.getSource<GeoJSONSource>(SOURCE_ID)?.setData(toCollection(features));
      // Mirrors what the layer is holding onto the DOM, so the end to end tests
      // can check the map and the list against each other without reaching
      // into the WebGL canvas.
      this.container().nativeElement.dataset['quakeCount'] = String(features.length);
      // setData drops every feature state, so put the current ones back once
      // the new data has settled.
      map.once('idle', () => this.applyFeatureStates());
    });

    // Selection and hover live in the store. The map reads them; it never
    // tells the list anything, which is what stops the two from ping-ponging.
    effect(() => {
      this.store.selectedId();
      this.store.hoveredId();
      if (!this.styleReady()) return;
      this.applyFeatureStates();
    });

    effect(() => {
      const selected = this.store.selected();
      if (!this.styleReady() || !selected) return;
      this.map?.flyTo({
        center: [selected.geometry.coordinates[0], selected.geometry.coordinates[1]],
        zoom: Math.max(this.map.getZoom(), 4),
        speed: 1.4,
      });
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
          'circle-radius': [
            'case',
            [
              'any',
              ['boolean', ['feature-state', 'selected'], false],
              ['boolean', ['feature-state', 'hover'], false],
            ],
            ['+', ['interpolate', ['linear'], ['get', 'mag'], 4.5, 4, 6, 8, 8, 16], 4],
            ['interpolate', ['linear'], ['get', 'mag'], 4.5, 4, 6, 8, 8, 16],
          ],
          'circle-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            '#1d4ed8',
            ['boolean', ['feature-state', 'hover'], false],
            '#facc15',
            '#f97316',
          ],
          'circle-opacity': 0.8,
          'circle-stroke-width': [
            'case',
            [
              'any',
              ['boolean', ['feature-state', 'selected'], false],
              ['boolean', ['feature-state', 'hover'], false],
            ],
            3,
            1,
          ],
          'circle-stroke-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            '#1e3a8a',
            ['boolean', ['feature-state', 'hover'], false],
            '#a16207',
            '#7c2d12',
          ],
        },
      });

      this.container().nativeElement.dataset['quakeCount'] = String(this.store.visible().length);
      this.styleReady.set(true);
      this.applyFeatureStates();
    });

    map.on('click', (event: MapMouseEvent) => {
      const [feature] = map.queryRenderedFeatures(event.point, { layers: [LAYER_ID] });
      const eventId = feature?.properties?.['eventId'];
      this.store.select(typeof eventId === 'string' ? eventId : null);
    });

    map.on('moveend', () => {
      const { lng, lat } = map.getCenter();
      this.container().nativeElement.dataset['mapCenter'] = `${lng.toFixed(3)},${lat.toFixed(3)}`;
    });

    map.on('mousemove', LAYER_ID, (event) => {
      map.getCanvas().style.cursor = 'pointer';
      const eventId = event.features?.[0]?.properties?.['eventId'];
      this.store.hover(typeof eventId === 'string' ? eventId : null);
    });

    map.on('mouseleave', LAYER_ID, () => {
      map.getCanvas().style.cursor = '';
      this.store.hover(null);
    });
  }

  /**
   * Mirrors the store's selection and hover onto the layer through feature
   * state, which repaints the two affected circles instead of rebuilding the
   * layer on every pointer move.
   */
  private applyFeatureStates(): void {
    const map = this.map;
    if (!map || !map.getSource(SOURCE_ID)) return;

    map.removeFeatureState({ source: SOURCE_ID });

    this.setState(this.store.selectedId(), 'selected');
    this.setState(this.store.hoveredId(), 'hover');
  }

  private setState(eventId: string | null, key: 'selected' | 'hover'): void {
    if (eventId === null) return;
    const quakeId = this.store.byId().get(eventId)?.properties.quakeId;
    if (quakeId === undefined) return;
    this.map?.setFeatureState({ source: SOURCE_ID, id: quakeId }, { [key]: true });
  }
}
