import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../components/catalogo/catalogo').then((module) => module.Catalogo),
  },
  { path: '**', redirectTo: '' },
];
