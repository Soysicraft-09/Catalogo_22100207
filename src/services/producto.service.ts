import { Injectable } from '@angular/core';
import { Product } from '../models/producto.model';
import { from, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  // Regreso un Observable para que el componente consuma los productos como flujo de datos.
  getAll(): Observable<Product[]> {
    return from(
      // Intento leer el XML real primero, que es de donde sale el catalogo.
      fetch('/productos.xml')
        .then((response) => response.text())
        .then((xmlText) => {
          // Primero pruebo con DOMParser porque es la forma mas limpia de leer XML.
          const parsedByDom = this.parseProductsWithDom(xmlText);
          if (parsedByDom.length > 0) {
            return parsedByDom;
          }

          // Si por alguna razon el DOM no saca datos, hago un intento extra con regex.
          const parsedByRegex = this.parseProducts(xmlText);
          if (parsedByRegex.length > 0) {
            return parsedByRegex;
          }

          // Si el XML viene vacio o mal formado, al menos dejo productos de ejemplo.
          return this.getFallbackProducts();
        })
        .catch(() => this.getFallbackProducts())
    );
  }

  private parseProducts(xmlText: string): Product[] {
    // Este helper me evita repetir la misma logica para cada etiqueta.
    const getTagValue = (text: string, tag: string): string => {
      const regex = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i');
      return regex.exec(text)?.[1]?.trim() ?? '';
    };

    // Cada bloque <product>...</product> se convierte luego en un objeto Product.
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
    // DOMParser me deja tratar el XML casi como si fuera un documento HTML.
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
    // Estos datos son un respaldo para que la practica siga funcionando aunque falle el XML.
    return [
      {
        id: 1,
        name: 'Tenis Running Pro',
        price: 1899,
        imageUrl: '/img/tenis-running-pro.png',
        category: 'Calzado',
        description: 'Tenis ligeros para correr con suela antiderrapante.',
        inStock: true,
      },
      {
        id: 2,
        name: 'Sudadera Oversize',
        price: 799,
        imageUrl: '/img/sudadera-oversize.png',
        category: 'Ropa',
        description: 'Sudadera de algodon afelpada, corte comodo unisex.',
        inStock: false,
      },
      {
        id: 3,
        name: 'Playera Basica Blanca',
        price: 299,
        imageUrl: '/img/playera-blanca.png',
        category: 'Ropa',
        description: 'Playera de cuello redondo, tela suave y fresca.',
        inStock: true,
      },
      {
        id: 4,
        name: 'Jeans Slim Azul',
        price: 999,
        imageUrl: '/img/jeans-slim-azul.png',
        category: 'Ropa',
        description: 'Jeans elastico de ajuste slim para uso diario.',
        inStock: true,
      },
      {
        id: 5,
        name: 'Tenis Urban Street',
        price: 1499,
        imageUrl: '/img/tenis-urban-street.png',
        category: 'Calzado',
        description: 'Tenis casuales para ciudad con plantilla acolchada.',
        inStock: true,
      },
      {
        id: 6,
        name: 'Chaqueta Rompevientos',
        price: 1199,
        imageUrl: '/img/chaqueta-rompevientos.png',
        category: 'Ropa',
        description: 'Chaqueta ligera resistente al viento y salpicaduras.',
        inStock: false,
      },
    ];
  }
}

