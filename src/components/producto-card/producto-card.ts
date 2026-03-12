import { CurrencyPipe, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Product } from '../../models/producto.model';

@Component({
  selector: 'app-producto-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, NgOptimizedImage],
  templateUrl: './producto-card.html',
  styleUrl: './producto-card.css',
})
export class ProductoCard {
  // input.required obliga a que la tarjeta siempre reciba un producto valido.
  readonly product = input.required<Product>();
  // Este output avisa al componente padre cuando se quiere agregar algo al carrito.
  readonly add = output<Product>();

  onAdd(): void {
    // Reenvio el producto completo para que el padre decida que hacer con el.
    this.add.emit(this.product());
  }
}
