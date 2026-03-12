import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig)
  // Si algo falla al iniciar, lo mando a consola para detectarlo rapido.
  .catch((err) => console.error(err));
