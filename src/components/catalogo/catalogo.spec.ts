import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Catalogo } from './catalogo';
import { ProductsService } from '../../services/producto.service';

// Verifica que Catalogo se pueda instanciar con dependencias simuladas.
describe('Catalogo', () => {
  let component: Catalogo;
  let fixture: ComponentFixture<Catalogo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // Pruebo el componente real, no una version simplificada.
      imports: [Catalogo],
      providers: [
        // Hace falta router porque el template usa routerLink.
        provideRouter([]),
        {
          // Simulo el servicio para no depender del XML durante la prueba.
          provide: ProductsService,
          useValue: { getAll: () => of([]) },
        },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(Catalogo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    // Si esto pasa, el catalogo puede construirse sin errores.
    expect(component).toBeTruthy();
  });
});
