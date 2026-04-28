export interface MenuItem {
  id: number;
  name: string;
  price: number;
  imageUrl?: string;
  category: string;
  description: string;
  inStock: boolean;
  pairing: string;
  season: string;
}