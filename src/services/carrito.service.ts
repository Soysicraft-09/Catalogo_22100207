import { Injectable, signal } from '@angular/core';
import { Product } from '../models/producto.model';

@Injectable({ providedIn: 'root' })
export class CarritoService {
  // Este signal es la fuente de verdad del carrito.
  private readonly productosSignal = signal<Product[]>([]);

  // Lo expongo en solo lectura para que otros componentes no lo modifiquen directo.
  readonly productos = this.productosSignal.asReadonly();

  agregar(producto: Product): void {
    // Aqui simplemente agrego el producto al final de la lista actual.
    this.productosSignal.update((lista) => [...lista, producto]);
  }

  quitar(id: number): void {
    this.productosSignal.update((lista) => {
      // Busco el primer producto con ese id para quitar solo una ocurrencia.
      const index = lista.findIndex((producto) => producto.id === id);

      if (index === -1) {
        // Si no existe, dejo la lista exactamente como estaba.
        return lista;
      }

      return [...lista.slice(0, index), ...lista.slice(index + 1)];
    });
  }

  vaciar(): void {
    // Esto limpia todo el carrito de un golpe.
    this.productosSignal.set([]);
  }

  total(): number {
    // Voy sumando los precios para sacar el total actual.
    return this.productosSignal().reduce((acumulado, producto) => acumulado + producto.price, 0);
  }

  exportarXML(): void {
    // Tomo una foto del carrito en este momento para construir el recibo.
    const productos = this.productosSignal();
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<recibo>\n';

    for (const producto of productos) {
      xml += '  <producto>\n';
      xml += `    <id>${producto.id}</id>\n`;
      xml += `    <nombre>${this.escapeXml(producto.name)}</nombre>\n`;
      xml += `    <precio>${producto.price}</precio>\n`;

      if (producto.description) {
        xml += `    <descripcion>${this.escapeXml(producto.description)}</descripcion>\n`;
      }

      xml += '  </producto>\n';
    }

    xml += `  <total>${this.total()}</total>\n`;
    xml += '</recibo>';

  // Creo un archivo temporal en memoria para forzar la descarga desde el navegador.
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'recibo.xml';
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  private escapeXml(value: string): string {
    // Esto evita que caracteres especiales rompan el XML exportado.
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&apos;');
  }
}