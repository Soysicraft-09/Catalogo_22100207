import { Component, Input } from '@angular/core';
import { Product } from '../../models/producto.model';  

@Component({
  selector: 'app-producto-card',
  imports: [],
  templateUrl: './producto-card.html',
  styleUrl: './producto-card.css',
})
export class ProductoCard {
  @Input({required: true}) product!: Product;
}
