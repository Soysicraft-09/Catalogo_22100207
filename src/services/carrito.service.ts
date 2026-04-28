import { effect, Injectable, signal } from '@angular/core';
import { MenuItem } from '../models/producto.model';

export interface CartLine {
  item: MenuItem;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CarritoService {
  private readonly cartStorageKey = 'poke-market-cart-v1';
  private readonly lineasSignal = signal<CartLine[]>(this.readStoredCart());

  readonly lineas = this.lineasSignal.asReadonly();

  constructor() {
    effect(() => {
      this.persistCart(this.lineasSignal());
    });
  }

  agregar(item: MenuItem): void {
    this.lineasSignal.update((current) => {
      const index = current.findIndex((linea) => linea.item.id === item.id);

      if (index === -1) {
        return [...current, { item, quantity: 1 }];
      }

      return current.map((linea, lineIndex) =>
        lineIndex === index ? { ...linea, quantity: linea.quantity + 1 } : linea
      );
    });
  }

  incrementar(id: number): void {
    this.lineasSignal.update((current) =>
      current.map((linea) =>
        linea.item.id === id ? { ...linea, quantity: linea.quantity + 1 } : linea
      )
    );
  }

  decrementar(id: number): void {
    this.lineasSignal.update((current) => {
      const line = current.find((linea) => linea.item.id === id);

      if (!line) {
        return current;
      }

      if (line.quantity <= 1) {
        return current.filter((linea) => linea.item.id !== id);
      }

      return current.map((linea) =>
        linea.item.id === id ? { ...linea, quantity: linea.quantity - 1 } : linea
      );
    });
  }

  eliminar(id: number): void {
    this.lineasSignal.update((current) => current.filter((linea) => linea.item.id !== id));
  }

  vaciar(): void {
    this.lineasSignal.set([]);
  }

  total(): number {
    return this.lineasSignal().reduce(
      (accumulator, line) => accumulator + line.item.price * line.quantity,
      0
    );
  }

  totalItems(): number {
    return this.lineasSignal().reduce((accumulator, line) => accumulator + line.quantity, 0);
  }

  exportarTicketXML(): void {
    const now = new Date();
    const ticketId = `TICKET-${now.getTime()}`;
    const total = this.total();

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<ticket>\n';
    xml += `  <folio>${ticketId}</folio>\n`;
    xml += `  <fecha>${now.toISOString()}</fecha>\n`;
    xml += '  <tienda>Poke Bazar MX</tienda>\n';
    xml += '  <lineas>\n';

    for (const line of this.lineasSignal()) {
      xml += '    <linea>\n';
      xml += `      <id>${line.item.id}</id>\n`;
      xml += `      <producto>${this.escapeXml(line.item.name)}</producto>\n`;
      xml += `      <categoria>${this.escapeXml(line.item.category)}</categoria>\n`;
      xml += `      <cantidad>${line.quantity}</cantidad>\n`;
      xml += `      <precio_unitario>${line.item.price}</precio_unitario>\n`;
      xml += `      <subtotal>${line.item.price * line.quantity}</subtotal>\n`;
      xml += '    </linea>\n';
    }

    xml += '  </lineas>\n';
    xml += `  <total>${total}</total>\n`;
    xml += '</ticket>';

    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `${ticketId}.xml`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  private escapeXml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&apos;');
  }

  private readStoredCart(): CartLine[] {
    try {
      const raw = localStorage.getItem(this.cartStorageKey);

      if (!raw) {
        return [];
      }

      const parsed: unknown = JSON.parse(raw);

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed
        .filter((line): line is CartLine => this.isCartLine(line))
        .map((line) => ({ ...line, item: { ...line.item } }));
    } catch {
      return [];
    }
  }

  private persistCart(lines: CartLine[]): void {
    try {
      localStorage.setItem(this.cartStorageKey, JSON.stringify(lines));
    } catch {
      // Ignored: cart persistence is best-effort only.
    }
  }

  private isCartLine(value: unknown): value is CartLine {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const line = value as Partial<CartLine>;

    return (
      typeof line.quantity === 'number' &&
      Number.isFinite(line.quantity) &&
      line.quantity > 0 &&
      this.isMenuItem(line.item)
    );
  }

  private isMenuItem(value: unknown): value is MenuItem {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const item = value as Partial<MenuItem>;

    return (
      typeof item.id === 'number' &&
      typeof item.name === 'string' &&
      typeof item.price === 'number' &&
      typeof item.category === 'string' &&
      typeof item.description === 'string' &&
      typeof item.inStock === 'boolean' &&
      typeof item.pairing === 'string' &&
      typeof item.season === 'string'
    );
  }
}
