import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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

type CheckoutStep = 1 | 2 | 3;
type OrderStatus = 'recibido' | 'preparando' | 'en-camino' | 'entregado';

@Component({
  selector: 'app-catalogo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProductoCard, ReactiveFormsModule, CurrencyPipe],
  host: {
    '(document:keydown.escape)': 'handleEscape()',
  },
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.css',
})
export class Catalogo implements OnDestroy {
  private readonly favoritesStorageKey = 'casa-quetzal-favorites-v1';
  private readonly menuService = inject(MenuService);
  private readonly carritoService = inject(CarritoService);
  private readonly currencyFormatter = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  });
  private readonly orderTimers: number[] = [];

  readonly menuItems = signal<MenuItem[]>([]);
  readonly errorMessage = signal('');
  readonly selectedCategory = signal('Todas');
  readonly onlyAvailable = signal(false);
  readonly searchTerm = signal('');
  readonly favoriteIds = signal<number[]>(this.readFavoriteIds());
  readonly selectedItem = signal<MenuItem | null>(null);
  readonly checkoutOpen = signal(false);
  readonly checkoutStep = signal<CheckoutStep>(1);
  readonly orderStatus = signal<OrderStatus | null>(null);
  readonly orderCode = signal('');
  readonly cartLines = this.carritoService.lineas;

  readonly checkoutForm = new FormGroup({
    customerName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
    }),
    phone: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^[0-9]{10}$/)],
    }),
    address: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
    deliveryNotes: new FormControl('', { nonNullable: true }),
    deliveryTime: new FormControl('Lo antes posible', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    paymentMethod: new FormControl<'Tarjeta' | 'Transferencia' | 'Efectivo'>('Tarjeta', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    cardLast4: new FormControl('', { nonNullable: true }),
  });

  readonly favoriteSet = computed(() => new Set(this.favoriteIds()));
  readonly favoriteItems = computed(() => {
    const favoriteIds = this.favoriteSet();
    return this.menuItems().filter((item) => favoriteIds.has(item.id));
  });

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

  readonly recommendedItems = computed(() => {
    const items = this.menuItems();

    if (items.length === 0) {
      return [];
    }

    const favorites = this.favoriteSet();
    const cartIds = new Set(this.cartLines().map((line) => line.item.id));
    const cartCategory = this.cartLines()[0]?.item.category;
    const selectedCategory = this.selectedCategory();

    return items
      .filter((item) => item.inStock && !cartIds.has(item.id))
      .map((item) => {
        let score = 0;

        if (favorites.has(item.id)) {
          score += 5;
        }

        if (cartCategory && item.category === cartCategory) {
          score += 3;
        }

        if (selectedCategory !== 'Todas' && item.category === selectedCategory) {
          score += 2;
        }

        if (item.category === 'Postres') {
          score += 1;
        }

        return { item, score };
      })
      .sort((a, b) => b.score - a.score || a.item.price - b.item.price)
      .slice(0, 4)
      .map((entry) => entry.item);
  });

  readonly estimatedDeliveryMinutes = computed(() => 25 + this.cartItemsCount() * 3);
  readonly orderStatusLabel = computed(() => {
    const status = this.orderStatus();

    switch (status) {
      case 'recibido':
        return 'Pedido recibido';
      case 'preparando':
        return 'Estamos preparando tu orden';
      case 'en-camino':
        return 'Tu pedido va en camino';
      case 'entregado':
        return 'Pedido entregado';
      default:
        return '';
    }
  });

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

  ngOnDestroy(): void {
    this.clearOrderTimers();
  }

  handleEscape(): void {
    if (this.selectedItem()) {
      this.closeDetail();
      return;
    }

    if (this.checkoutOpen()) {
      this.closeCheckout();
    }
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

  toggleFavorito(item: MenuItem): void {
    this.favoriteIds.update((ids) => {
      if (ids.includes(item.id)) {
        const next = ids.filter((id) => id !== item.id);
        this.persistFavoriteIds(next);
        return next;
      }

      const next = [...ids, item.id];
      this.persistFavoriteIds(next);
      return next;
    });
  }

  isFavorite(id: number): boolean {
    return this.favoriteSet().has(id);
  }

  openDetail(item: MenuItem): void {
    this.selectedItem.set(item);
  }

  closeDetail(): void {
    this.selectedItem.set(null);
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

  openCheckout(): void {
    if (this.cartLines().length === 0) {
      return;
    }

    this.checkoutOpen.set(true);
    this.checkoutStep.set(1);
  }

  closeCheckout(): void {
    this.checkoutOpen.set(false);
    this.checkoutStep.set(1);
  }

  previousCheckoutStep(): void {
    const step = this.checkoutStep();

    if (step > 1) {
      this.checkoutStep.set((step - 1) as CheckoutStep);
    }
  }

  nextCheckoutStep(): void {
    const step = this.checkoutStep();

    if (step === 1 && !this.validateStepOne()) {
      return;
    }

    if (step === 2 && !this.validateStepTwo()) {
      return;
    }

    if (step < 3) {
      this.checkoutStep.set((step + 1) as CheckoutStep);
    }
  }

  confirmOrder(): void {
    if (!this.validateStepOne() || !this.validateStepTwo() || this.cartLines().length === 0) {
      return;
    }

    this.orderCode.set(this.buildOrderCode());
    this.orderStatus.set('recibido');
    this.checkoutStep.set(3);
    this.scheduleOrderProgress();
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

  private validateStepOne(): boolean {
    const controls = [
      this.checkoutForm.controls.customerName,
      this.checkoutForm.controls.phone,
      this.checkoutForm.controls.address,
      this.checkoutForm.controls.deliveryTime,
    ];

    controls.forEach((control) => {
      control.markAsTouched();
      control.updateValueAndValidity();
    });

    return controls.every((control) => control.valid);
  }

  private validateStepTwo(): boolean {
    const paymentControl = this.checkoutForm.controls.paymentMethod;
    const cardControl = this.checkoutForm.controls.cardLast4;

    paymentControl.markAsTouched();
    paymentControl.updateValueAndValidity();

    if (paymentControl.value === 'Tarjeta') {
      cardControl.markAsTouched();
      const isValidLast4 = /^[0-9]{4}$/.test(cardControl.value);

      cardControl.setErrors(isValidLast4 ? null : { cardLast4Invalid: true });
      return paymentControl.valid && isValidLast4;
    }

    cardControl.setErrors(null);
    return paymentControl.valid;
  }

  private scheduleOrderProgress(): void {
    this.clearOrderTimers();

    this.orderTimers.push(
      window.setTimeout(() => this.orderStatus.set('preparando'), 3000),
      window.setTimeout(() => this.orderStatus.set('en-camino'), 7000),
      window.setTimeout(() => this.orderStatus.set('entregado'), 12000)
    );
  }

  private clearOrderTimers(): void {
    for (const timer of this.orderTimers) {
      clearTimeout(timer);
    }

    this.orderTimers.length = 0;
  }

  private buildOrderCode(): string {
    const seed = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `CQ-${seed}`;
  }

  private readFavoriteIds(): number[] {
    try {
      const raw = localStorage.getItem(this.favoritesStorageKey);

      if (!raw) {
        return [];
      }

      const parsed: unknown = JSON.parse(raw);

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.filter((id): id is number => typeof id === 'number' && Number.isFinite(id));
    } catch {
      return [];
    }
  }

  private persistFavoriteIds(ids: number[]): void {
    try {
      localStorage.setItem(this.favoritesStorageKey, JSON.stringify(ids));
    } catch {
      // Ignored: favorites persistence is best-effort only.
    }
  }
}
