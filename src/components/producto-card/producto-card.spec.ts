import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductoCard } from './producto-card';
import { Product } from '../../models/producto.model';

describe('ProductoCard', () => {
  let component: ProductoCard;
  let fixture: ComponentFixture<ProductoCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // La tarjeta se prueba sola porque recibe todo por input.
      imports: [ProductoCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductoCard);
    component = fixture.componentInstance;

    // Creo un producto ficticio para llenar los datos del template.
    const productMock: Product = {
      id: 1,
      name: 'Producto test',
      price: 100,
      imageUrl: '/img/test.jpg',
      category: 'Categoria test',
      description: 'Descripcion test',
      inStock: true,
    };

    // setInput es la forma correcta de alimentar un input signal en pruebas.
    fixture.componentRef.setInput('product', productMock);
    await fixture.whenStable();
  });

  it('should create', () => {
    // Valida que la tarjeta se pueda montar con un producto valido.
    expect(component).toBeTruthy();
  });
});
