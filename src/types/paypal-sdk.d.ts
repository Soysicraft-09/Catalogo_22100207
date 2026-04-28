interface PaypalButtonsActions {
  order: {
    create: (input: Record<string, unknown>) => Promise<string>;
    capture: () => Promise<unknown>;
  };
}

interface PaypalButtonsComponent {
  render: (selector: string) => Promise<void>;
}

interface PaypalNamespace {
  Buttons: (config: {
    createOrder: () => Promise<string>;
    onApprove: (data: { orderID: string }, actions: PaypalButtonsActions) => Promise<void>;
    onError?: (error: unknown) => void;
    onCancel?: () => void;
  }) => PaypalButtonsComponent;
}

interface Window {
  paypal?: PaypalNamespace;
}
