import { bootstrapApplication } from '@angular/platform-browser';
import { setWorkerUrl } from 'maplibre-gl';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// maplibre-gl loads its tile worker as a separate module. Neither the dev
// server nor the production bundle emits it, so it is copied into `maplibre/`
// as a build asset (see angular.json) and pointed at from here.
setWorkerUrl(new URL('maplibre/maplibre-gl-worker.mjs', document.baseURI).href);

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
