import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { MenuItem } from '../../models/producto.model';
import { CartLine, CarritoService } from '../../services/carrito.service';
import { PaypalService } from '../../services/paypal.service';
import { ProductService } from '../../services/producto.service';
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
type PaymentMethod = 'Tarjeta' | 'Transferencia' | 'Efectivo' | 'PayPal';

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
  private readonly favoritesStorageKey = 'poke-market-favorites-v1';
  private readonly productService = inject(ProductService);
  private readonly carritoService = inject(CarritoService);
  private readonly paypalService = inject(PaypalService);
  private readonly currencyFormatter = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  });
  private readonly orderTimers: number[] = [];
  private paypalSdkPromise: Promise<void> | null = null;

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
  readonly paypalMessage = signal('');
  readonly paypalLoading = signal(false);
  readonly cartLines = this.carritoService.lineas;
  readonly paypalClientId = environment.paypalClientId;
  readonly isPaypalMethod = computed(() => this.checkoutForm.controls.paymentMethod.value === 'PayPal');

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
    deliveryTime: new FormControl('Despacho inmediato', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    paymentMethod: new FormControl<PaymentMethod>('Tarjeta', {
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
    this.menuItems().filter((item) => item.category === 'Destacadas')
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

        if (item.category === 'Legendarias') {
          score += 1;
        }

        return { item, score };
      })
      .sort((a, b) => b.score - a.score || a.item.price - b.item.price)
      .slice(0, 4)
      .map((entry) => entry.item);
  });

  readonly estimatedDispatchHours = computed(() => 12 + this.cartItemsCount() * 2);
  readonly orderStatusLabel = computed(() => {
    const status = this.orderStatus();

    switch (status) {
      case 'recibido':
        return 'Orden recibida';
      case 'preparando':
        return 'Estamos preparando tu paquete';
      case 'en-camino':
        return 'Tu envio va en camino';
      case 'entregado':
        return 'Orden entregada';
      default:
        return '';
    }
  });

  readonly insightCards: InsightCard[] = [
    {
      value: '151+',
      title: 'Cartas base en el set original',
      detail: 'La nostalgia del Base Set sigue moviendo compras y coleccionismo.',
    },
    {
      value: '24h',
      title: 'Actualizacion de stock y precios',
      detail: 'El inventario se revisa diario para evitar sobreventa y mejorar confianza.',
    },
    {
      value: '100%',
      title: 'Verificacion visual de cartas',
      detail: 'Cada carta se publica con fotos reales y descripcion de condicion.',
    },
  ];

  readonly pillars: ExperiencePillar[] = [
    {
      title: 'Cartas originales y verificadas',
      description:
        'Revisamos bordes, centering y superficie para ofrecer cartas listas para coleccion o juego.',
    },
    {
      title: 'Catalogo por rareza y expansion',
      description:
        'Filtra por comunes, holo, full art, trainer y legendarias en segundos.',
    },
    {
      title: 'Compra rapida y segura',
      description:
        'Checkout simple, tracking de orden y ticket en XML para control de compra.',
    },
  ];

  readonly chefMilestones: ChefMilestone[] = [
    {
      year: '2023',
      title: 'Inicio de la tienda',
      detail:
        'Comenzamos vendiendo cartas sueltas de colecciones modernas y clasicas en linea.',
    },
    {
      year: '2025',
      title: 'Expansion del inventario',
      detail:
        'Se agregan cartas de sets japoneses, promos y productos sellados de alta demanda.',
    },
    {
      year: '2026',
      title: 'Operacion digital en Mexico',
      detail:
        'Nos enfocamos en venta online con envios nacionales y empaque de proteccion premium.',
    },
  ];

  readonly commitments: Commitment[] = [
    {
      title: 'Autenticidad primero',
      description:
        'Rechazamos reproducciones y listamos solo cartas verificadas por nuestro equipo.',
    },
    {
      title: 'Transparencia comercial',
      description:
        'Publicamos precios finales en MXN, estado de carta y fotos sin filtros agresivos.',
    },
    {
      title: 'Catalogo vivo',
      description:
        'El stock y las ofertas se actualizan en tiempo real segun disponibilidad real.',
    },
  ];

  readonly deliverySteps: DeliveryStep[] = [
    {
      title: '1. Explora y filtra cartas',
      detail: 'Busca por expansion, tipo y rareza para encontrar tu objetivo rapido.',
    },
    {
      title: '2. Arma tu carrito',
      detail: 'Combina cartas para deck competitivo o piezas clave de coleccion.',
    },
    {
      title: '3. Recibe tu envio',
      detail: 'Despachamos con empaque protegido y numero de seguimiento.',
    },
  ];

  constructor() {
    this.productService.getAll().subscribe({
      next: (items) => {
        this.menuItems.set(items);
      },
      error: () => {
        this.errorMessage.set('No fue posible cargar el catalogo Pokemon en este momento.');
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

    this.resetOrderState();
    this.checkoutOpen.set(true);
    this.checkoutStep.set(1);
  }

  closeCheckout(): void {
    this.checkoutOpen.set(false);
    this.checkoutStep.set(1);
    this.resetOrderState();
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
      const nextStep = (step + 1) as CheckoutStep;
      this.checkoutStep.set(nextStep);

      if (nextStep === 3) {
        this.handleStepThreeEntry();
      }
    }
  }

  confirmOrder(): void {
    if (!this.validateStepOne() || !this.validateStepTwo() || this.cartLines().length === 0) {
      return;
    }

    if (this.isPaypalMethod()) {
      this.paypalMessage.set('Usa el boton de PayPal para completar el pago.');
      return;
    }

    this.completeOrder();
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

  private handleStepThreeEntry(): void {
    if (!this.isPaypalMethod()) {
      this.paypalMessage.set('');
      return;
    }

    if (!this.paypalClientId) {
      this.paypalMessage.set('Falta configurar paypalClientId en src/environments/environment.ts');
      return;
    }

    this.paypalMessage.set('');
    window.setTimeout(() => {
      void this.renderPaypalButtons();
    });
  }

  private async renderPaypalButtons(): Promise<void> {
    if (!this.checkoutOpen() || this.checkoutStep() !== 3 || !this.isPaypalMethod() || this.orderCode()) {
      return;
    }

    const container = document.getElementById('paypal-buttons');

    if (!container) {
      return;
    }

    container.innerHTML = '';

    try {
      await this.loadPaypalSdk();

      if (!window.paypal) {
        this.paypalMessage.set('No fue posible cargar el SDK de PayPal.');
        return;
      }

      await window.paypal
        .Buttons({
          createOrder: async () => {
            this.paypalLoading.set(true);
            const order = await firstValueFrom(
              this.paypalService.createOrder({
                total: this.cartTotal(),
                currency: environment.currency,
              })
            );
            this.paypalLoading.set(false);
            return order.id;
          },
          onApprove: async (data) => {
            this.paypalLoading.set(true);
            this.paypalMessage.set('');

            await firstValueFrom(this.paypalService.captureOrder(data.orderID));

            this.paypalLoading.set(false);
            this.completeOrder();
          },
          onCancel: () => {
            this.paypalLoading.set(false);
            this.paypalMessage.set('El pago fue cancelado. Puedes intentarlo nuevamente.');
          },
          onError: () => {
            this.paypalLoading.set(false);
            this.paypalMessage.set('Ocurrio un error al procesar el pago con PayPal.');
          },
        })
        .render('#paypal-buttons');
    } catch {
      this.paypalLoading.set(false);
      this.paypalMessage.set('No fue posible iniciar PayPal. Revisa credenciales y backend.');
    }
  }

  private loadPaypalSdk(): Promise<void> {
    if (window.paypal) {
      return Promise.resolve();
    }

    if (this.paypalSdkPromise) {
      return this.paypalSdkPromise;
    }

    this.paypalSdkPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      const sdkParams = new URLSearchParams({
        'client-id': this.paypalClientId,
        currency: environment.currency,
        locale: environment.paypalLocale,
      });

      script.src = `https://www.paypal.com/sdk/js?${sdkParams.toString()}`;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('No se pudo cargar el SDK de PayPal'));
      document.head.append(script);
    });

    return this.paypalSdkPromise;
  }

  private completeOrder(): void {
    this.orderCode.set(this.buildOrderCode());
    this.orderStatus.set('recibido');
    this.checkoutStep.set(3);
    this.scheduleOrderProgress();
    this.carritoService.vaciar();
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
    return `PK-${seed}`;
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

  private resetOrderState(): void {
    this.orderCode.set('');
    this.orderStatus.set(null);
    this.paypalMessage.set('');
    this.paypalLoading.set(false);
    this.clearOrderTimers();
  }
}
