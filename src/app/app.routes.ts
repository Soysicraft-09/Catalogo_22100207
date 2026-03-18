import { Routes } from '@angular/router';

// Ruteo principal con carga diferida de componentes para mantener arranque liviano.
export const routes: Routes = [
  {
    // La vista principal muestra el catalogo de productos.
    path: '',
    loadComponent: () => import('../components/catalogo/catalogo').then((module) => module.Catalogo),
  },
  {
    // El carrito vive en su propia pantalla para no mezclarlo con el catalogo.
    path: 'carrito',
    loadComponent: () => import('../components/carrito/carrito').then((module) => module.Carrito),
  },
  // Si escriben una ruta que no existe, mejor regresarlos al inicio.
  { path: '**', redirectTo: '' },
];
