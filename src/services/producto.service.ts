import { Injectable } from '@angular/core';
import { Product } from '../models/producto.model';
import { from, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  getAll(): Observable<Product[]> {
    return from(
      fetch('/productos.xml')
        .then((response) => response.text())
        .then((xmlText) => {
          const parsedByDom = this.parseProductsWithDom(xmlText);
          if (parsedByDom.length > 0) {
            return parsedByDom;
          }

          const parsedByRegex = this.parseProducts(xmlText);
          if (parsedByRegex.length > 0) {
            return parsedByRegex;
          }

          return this.getFallbackProducts();
        })
        .catch(() => this.getFallbackProducts())
    );
  }

  private parseProducts(xmlText: string): Product[] {
    const getTagValue = (text: string, tag: string): string => {
      const regex = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i');
      return regex.exec(text)?.[1]?.trim() ?? '';
    };

    const blocks = xmlText.match(/<product>([\s\S]*?)<\/product>/gi) ?? [];
    return blocks.map((block) => ({
      id: Number(getTagValue(block, 'id')),
      name: getTagValue(block, 'name'),
      price: Number(getTagValue(block, 'price')),
      imageUrl: getTagValue(block, 'imageUrl'),
      category: getTagValue(block, 'category'),
      description: getTagValue(block, 'description'),
      inStock: getTagValue(block, 'inStock').toLowerCase() === 'true',
    }));
  }

  private parseProductsWithDom(xmlText: string): Product[] {
    const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
    const nodes = Array.from(doc.getElementsByTagName('product'));

    return nodes.map((node) => ({
      id: Number(node.getElementsByTagName('id')[0]?.textContent?.trim() ?? '0'),
      name: node.getElementsByTagName('name')[0]?.textContent?.trim() ?? '',
      price: Number(node.getElementsByTagName('price')[0]?.textContent?.trim() ?? '0'),
      imageUrl: node.getElementsByTagName('imageUrl')[0]?.textContent?.trim() ?? '',
      category: node.getElementsByTagName('category')[0]?.textContent?.trim() ?? '',
      description: node.getElementsByTagName('description')[0]?.textContent?.trim() ?? '',
      inStock:
        (node.getElementsByTagName('inStock')[0]?.textContent?.trim().toLowerCase() ?? '') ===
        'true',
    }));
  }

  private getFallbackProducts(): Product[] {
    return [
      {
        id: 1,
        name: 'Tenis Running Pro',
        price: 1899,
        imageUrl: 'https://picsum.photos/seed/tenis-running/640/360',
        category: 'Calzado',
        description: 'Tenis ligeros para correr con suela antiderrapante.',
        inStock: true,
      },
      {
        id: 2,
        name: 'Sudadera Oversize',
        price: 799,
        imageUrl: 'https://picsum.photos/seed/sudadera-oversize/640/360',
        category: 'Ropa',
        description: 'Sudadera de algodon afelpada, corte comodo unisex.',
        inStock: false,
      },
      {
        id: 3,
        name: 'Playera Basica Blanca',
        price: 299,
        imageUrl: 'https://picsum.photos/seed/playera-blanca/640/360',
        category: 'Ropa',
        description: 'Playera de cuello redondo, tela suave y fresca.',
        inStock: true,
      },
      {
        id: 4,
        name: 'Jeans Slim Azul',
        price: 999,
        imageUrl: 'https://picsum.photos/seed/jeans-slim/640/360',
        category: 'Ropa',
        description: 'Jeans elastico de ajuste slim para uso diario.',
        inStock: true,
      },
      {
        id: 5,
        name: 'Tenis Urban Street',
        price: 1499,
        imageUrl: 'https://picsum.photos/seed/tenis-urban/640/360',
        category: 'Calzado',
        description: 'Tenis casuales para ciudad con plantilla acolchada.',
        inStock: true,
      },
      {
        id: 6,
        name: 'Chaqueta Rompevientos',
        price: 1199,
        imageUrl: 'https://picsum.photos/seed/rompevientos/640/360',
        category: 'Ropa',
        description: 'Chaqueta ligera resistente al viento y salpicaduras.',
        inStock: false,
      },
    ];
  }
}
