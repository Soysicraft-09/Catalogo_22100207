import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductoCard } from '../producto-card/producto-card';
import { ProductsService } from '../../services/producto.service';
import { CarritoService } from '../../services/carrito.service';
import { Product } from '../../models/producto.model';

@Component({
  selector: 'app-catalogo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ProductoCard],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.css',
})
export class Catalogo {
  // inject() evita llenar el constructor solo para pedir dependencias.
  private readonly productsService = inject(ProductsService);
  private readonly carritoService = inject(CarritoService);

  // Aqui guardo la lista que viene del XML o de los datos de respaldo.
  readonly products = signal<Product[]>([]);
  // Este mensaje solo se usa si algo falla al cargar el catalogo.
  readonly errorMessage = signal('');
  // Dato derivado: me sirve para mostrar cuantos productos siguen disponibles.
  readonly inStockCount = computed(() => this.products().filter((product) => product.inStock).length);
  // Otro dato derivado para el badge del carrito.
  readonly carritoCount = computed(() => this.carritoService.productos().length);

  constructor() {
    // Apenas se crea el componente, pido los productos al servicio.
    this.productsService.getAll().subscribe({
      next: (products) => {
        this.products.set(products);
      },
      error: () => {
        this.errorMessage.set('No se pudieron cargar los productos desde el XML.');
        this.products.set([]);
      },
    });
  }

  agregar(producto: Product): void {
    // El componente no guarda el carrito; solo delega la accion al servicio.
    this.carritoService.agregar(producto);
  }
}
