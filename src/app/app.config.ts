import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    // Esto hace que errores globales del navegador pasen por Angular.
    provideBrowserGlobalErrorListeners(),
    // Lo dejo listo por si luego consumes APIs HTTP con HttpClient.
    provideHttpClient(),
    // Aqui se conectan las rutas declaradas en app.routes.ts.
    provideRouter(routes)
  ]
};
