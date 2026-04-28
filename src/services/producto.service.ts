import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MenuItem } from '../models/producto.model';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/productos`;

  getAll(): Observable<MenuItem[]> {
    return this.http.get<MenuItem[]>(this.apiUrl, {
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
      params: {
        _ts: Date.now().toString(),
      },
    }).pipe(
      map((apiItems) => {
        if (!Array.isArray(apiItems)) {
          throw new Error('La API devolvio datos invalidos');
        }

        const normalized = apiItems
          .map((item) => this.normalizeMenuItem(item))
          .filter((item): item is MenuItem => item !== null);

        if (normalized.length === 0) {
          throw new Error('La API no devolvio productos validos');
        }

        return normalized;
      })
    );
  }

  private normalizeMenuItem(item: unknown): MenuItem | null {
    if (!item || typeof item !== 'object') {
      return null;
    }

    const candidate = item as Partial<MenuItem>;
    const id = Number(candidate.id);
    const price = Number(candidate.price);

    if (!Number.isFinite(id) || !Number.isFinite(price)) {
      return null;
    }

    if (typeof candidate.name !== 'string' || candidate.name.trim().length === 0) {
      return null;
    }

    const normalized: MenuItem = {
      id,
      name: candidate.name.trim(),
      price,
      category: typeof candidate.category === 'string' && candidate.category.trim().length > 0
        ? candidate.category.trim()
        : 'Sin categoria',
      description: typeof candidate.description === 'string'
        ? candidate.description
        : '',
      inStock: Boolean(candidate.inStock),
      pairing: typeof candidate.pairing === 'string' && candidate.pairing.trim().length > 0
        ? candidate.pairing.trim()
        : 'No especificada',
      season: typeof candidate.season === 'string' && candidate.season.trim().length > 0
        ? candidate.season.trim()
        : 'No especificada',
    };

    if (typeof candidate.imageUrl === 'string' && candidate.imageUrl.trim().length > 0) {
      normalized.imageUrl = candidate.imageUrl.trim();
    }

    return normalized;
  }
}

