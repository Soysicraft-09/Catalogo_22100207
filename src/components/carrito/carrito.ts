import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CarritoService } from '../../services/carrito.service';

@Component({
  selector: 'app-carrito',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './carrito.html',
  styleUrl: './carrito.css',
})
export class Carrito {
  // Todo lo que se ve aqui sale del servicio central del carrito.
  private readonly carritoService = inject(CarritoService);

  // Expongo la lista tal cual para renderizarla en la vista.
  readonly carrito = this.carritoService.productos;
  // El total se recalcula solo cuando cambia el contenido del carrito.
  readonly total = computed(() => this.carritoService.total());

  quitar(id: number): void {
    // Quito un producto por id desde la interfaz del carrito.
    this.carritoService.quitar(id);
  }

  vaciar(): void {
    // Borra todos los productos del carrito.
    this.carritoService.vaciar();
  }

  exportarXML(): void {
    // Genera y descarga el recibo en XML.
    this.carritoService.exportarXML();
  }
}