import { CurrencyPipe, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MenuItem } from '../../models/producto.model';

@Component({
  selector: 'app-producto-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, NgOptimizedImage],
  templateUrl: './producto-card.html',
  styleUrl: './producto-card.css',
})
export class ProductoCard {
  readonly item = input.required<MenuItem>();
  readonly isFavorite = input(false);
  readonly add = output<MenuItem>();
  readonly toggleFavorite = output<MenuItem>();
  readonly view = output<MenuItem>();

  readonly availabilityText = computed(() =>
    this.item().inStock ? 'Disponible esta noche' : 'Cupo completo por hoy'
  );

  onAdd(): void {
    if (!this.item().inStock) {
      return;
    }

    this.add.emit(this.item());
  }

  onToggleFavorite(): void {
    this.toggleFavorite.emit(this.item());
  }

  onView(): void {
    this.view.emit(this.item());
  }
}
