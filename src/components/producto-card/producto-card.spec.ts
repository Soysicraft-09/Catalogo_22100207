import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductoCard } from './producto-card';
import { Product } from '../../models/producto.model';

describe('ProductoCard', () => {
  let component: ProductoCard;
  let fixture: ComponentFixture<ProductoCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductoCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductoCard);
    component = fixture.componentInstance;
    const productMock: Product = {
      id: 1,
      name: 'Producto test',
      price: 100,
      imageUrl: 'https://example.com/test.jpg',
      category: 'Categoria test',
      description: 'Descripcion test',
      inStock: true,
    };
    fixture.componentRef.setInput('product', productMock);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
