// Esta interfaz define la forma exacta en la que manejamos cada producto en toda la app.
export interface Product {
	id: number;
	name: string;
	price: number;
	imageUrl: string;
	category: string;
	description: string;
	inStock: boolean;
}