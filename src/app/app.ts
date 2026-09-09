import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { QuakeDetail } from './detail/quake-detail';
import { QuakeList } from './list/quake-list';
import { QuakeMap } from './map/quake-map';
import { QuakesStore } from './core/quakes.store';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [QuakeDetail, QuakeList, QuakeMap],
  templateUrl: './app.html',
})
export class App implements OnInit {
  protected readonly store = inject(QuakesStore);

  ngOnInit(): void {
    void this.store.load();
  }
}
