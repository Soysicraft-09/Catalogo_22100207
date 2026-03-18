import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MenuItem } from '../../models/producto.model';
import { CartLine, CarritoService } from '../../services/carrito.service';
import { MenuService } from '../../services/producto.service';
import { ProductoCard } from '../producto-card/producto-card';

interface InsightCard {
  value: string;
  title: string;
  detail: string;
}

interface ExperiencePillar {
  title: string;
  description: string;
}

interface Commitment {
  title: string;
  description: string;
}

interface ChefMilestone {
  year: string;
  title: string;
  detail: string;
}

interface DeliveryStep {
  title: string;
  detail: string;
}

@Component({
  selector: 'app-catalogo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProductoCard],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.css',
})
export class Catalogo {
  private readonly menuService = inject(MenuService);
  private readonly carritoService = inject(CarritoService);
  private readonly currencyFormatter = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  });

  readonly menuItems = signal<MenuItem[]>([]);
  readonly errorMessage = signal('');
  readonly selectedCategory = signal('Todas');
  readonly onlyAvailable = signal(false);
  readonly searchTerm = signal('');
  readonly cartLines = this.carritoService.lineas;

  readonly availableCount = computed(() =>
    this.menuItems().filter((dish) => dish.inStock).length
  );

  readonly cartItemsCount = computed(() => this.carritoService.totalItems());
  readonly cartTotal = computed(() => this.carritoService.total());

  readonly categoriesCount = computed(() => new Set(this.menuItems().map((dish) => dish.category)).size);

  readonly menuCategories = computed(() => {
    const uniqueCategories = new Set(this.menuItems().map((dish) => dish.category));
    return ['Todas', ...Array.from(uniqueCategories)];
  });

  readonly filteredMenuItems = computed(() => {
    const category = this.selectedCategory();
    const mustBeAvailable = this.onlyAvailable();
    const search = this.searchTerm().trim().toLowerCase();

    return this.menuItems().filter((dish) => {
      const categoryMatches = category === 'Todas' || dish.category === category;
      const availabilityMatches = !mustBeAvailable || dish.inStock;
      const searchMatches =
        search.length === 0 ||
        dish.name.toLowerCase().includes(search) ||
        dish.description.toLowerCase().includes(search) ||
        dish.category.toLowerCase().includes(search);

      return categoryMatches && availabilityMatches && searchMatches;
    });
  });

  readonly mixologyItems = computed(() =>
    this.menuItems().filter((item) => item.category === 'Mixologia')
  );

  readonly insightCards: InsightCard[] = [
    {
      value: '12.2%',
      title: 'Peso del sector restaurantero en Mexico',
      detail: 'CANIRAC 2023 confirma un crecimiento sostenido de experiencias premium.',
    },
    {
      value: '95%+',
      title: 'Penetracion digital en segmento objetivo C+ y A/B',
      detail: 'Asociacion de Internet MX 2023 muestra alta adopcion movil y consumo visual.',
    },
    {
      value: '30%',
      title: 'Gasto destinado a esparcimiento y experiencias',
      detail: 'INEGI 2022 respalda la viabilidad de tickets altos cuando hay diferenciacion.',
    },
  ];

  readonly pillars: ExperiencePillar[] = [
    {
      title: 'Cocina de autor con raiz mexicana',
      description:
        'Cada plato cuenta una historia regional: tecnica contemporanea, ingredientes de origen y montaje editorial.',
    },
    {
      title: 'Mixologia con identidad local',
      description:
        'La barra integra destilados nacionales, frutas de temporada y perfiles aromaticos que armonizan cada tiempo.',
    },
    {
      title: 'Diseno visual premium para conversion',
      description:
        'El menu digital esta pensado para capturar atencion, mejorar decision de compra y aumentar pedidos online.',
    },
  ];

  readonly chefMilestones: ChefMilestone[] = [
    {
      year: '2014',
      title: 'Origen del proyecto',
      detail:
        'El chef inicia una investigacion culinaria por Oaxaca, Puebla y Yucatan para reinterpretar tecnicas tradicionales.',
    },
    {
      year: '2019',
      title: 'Nacimiento de Casa Quetzal',
      detail:
        'Arranca el concepto de alta cocina mexicana enfocada en experiencia, fotografia y narrativa culinaria.',
    },
    {
      year: '2026',
      title: 'Formato digital tipo delivery',
      detail:
        'El negocio evoluciona a modelo ficticio de pedidos en linea, sin ubicacion fisica abierta al publico.',
    },
  ];

  readonly commitments: Commitment[] = [
    {
      title: 'Kilometro Cero',
      description:
        'Priorizamos proveedores locales para reducir huella de carbono y fortalecer cadenas de valor regional.',
    },
    {
      title: 'Transparencia legal y comercial',
      description:
        'Mostramos precios en MXN con impuestos incluidos y mantenemos politicas claras de privacidad.',
    },
    {
      title: 'Menu digital vivo',
      description:
        'Actualizamos disponibilidad y costo por inflacion de insumos gourmet sin sacrificar claridad para el comensal.',
    },
  ];

  readonly deliverySteps: DeliveryStep[] = [
    {
      title: '1. Explora y filtra el menu',
      detail: 'Navega por categorias, busca ingredientes y revisa maridajes sugeridos.',
    },
    {
      title: '2. Elige tu experiencia',
      detail: 'Combina entradas, fuertes y mixologia para armar una cena gourmet en casa.',
    },
    {
      title: '3. Pide por app de delivery',
      detail: 'Nuestro modelo opera por plataformas tipo Uber Eats y aliados de ultima milla.',
    },
  ];

  constructor() {
    this.menuService.getSeasonMenu().subscribe({
      next: (items) => {
        this.menuItems.set(items);
      },
      error: () => {
        this.errorMessage.set('No fue posible cargar el menu gourmet en este momento.');
        this.menuItems.set([]);
      },
    });
  }

  setCategory(category: string): void {
    this.selectedCategory.set(category);
  }

  toggleAvailabilityFilter(): void {
    this.onlyAvailable.update((value) => !value);
  }

  updateSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
  }

  agregarAlCarrito(item: MenuItem): void {
    this.carritoService.agregar(item);
  }

  incrementar(line: CartLine): void {
    this.carritoService.incrementar(line.item.id);
  }

  decrementar(line: CartLine): void {
    this.carritoService.decrementar(line.item.id);
  }

  eliminar(line: CartLine): void {
    this.carritoService.eliminar(line.item.id);
  }

  vaciarCarrito(): void {
    this.carritoService.vaciar();
  }

  descargarTicket(): void {
    if (this.cartLines().length === 0) {
      return;
    }

    this.carritoService.exportarTicketXML();
  }

  formatPrice(value: number): string {
    return this.currencyFormatter.format(value);
  }
}
