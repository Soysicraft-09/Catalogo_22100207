import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Carrito } from './carrito';

describe('Carrito', () => {
  let component: Carrito;
  let fixture: ComponentFixture<Carrito>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // Importo el carrito completo para probar su plantilla y dependencias reales.
      imports: [Carrito],
      // Hace falta por el enlace de regreso al catalogo.
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Carrito);
    component = fixture.componentInstance;

    // detectChanges dispara el primer render del template.
    fixture.detectChanges();
  });

  it('should create', () => {
    // Con esto confirmo que el carrito se puede instanciar sin romperse.
    expect(component).toBeTruthy();
  });
});