// Esta interfaz define la forma exacta en la que manejamos cada producto en toda la app.
export interface Product {
	// Identificador unico del producto.
	id: number;
	// Nombre comercial mostrado en catalogo y carrito.
	name: string;
	// Precio unitario en pesos (MXN).
	price: number;
	// Ruta de imagen servida desde /public/img.
	imageUrl: string;
	// Categoria para clasificar el producto en UI o filtros futuros.
	category: string;
	// Texto descriptivo breve para la tarjeta del catalogo.
	description: string;
	// Disponibilidad actual para permitir o bloquear la compra.
	inStock: boolean;
}