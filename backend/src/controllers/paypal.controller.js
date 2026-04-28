const { hasPaypalCredentials } = require('../config/paypal.config');
const {
  createOrderInPaypal,
  captureOrderInPaypal,
} = require('../services/paypal.service');

const createOrder = async (req, res) => {
  try {
    if (!hasPaypalCredentials()) {
      return res.status(500).json({
        error: 'Faltan credenciales de PayPal en variables de entorno',
      });
    }

    const total = Number(req.body?.total || 0);
    const currency = typeof req.body?.currency === 'string' ? req.body.currency : 'MXN';

    if (!Number.isFinite(total) || total <= 0) {
      return res.status(400).json({ error: 'Total invalido para crear orden' });
    }

    const order = await createOrderInPaypal({ total, currency });
    return res.status(201).json(order);
  } catch (error) {
    return res.status(500).json({
      error: 'Error al crear orden en PayPal',
      detail: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
};

const captureOrder = async (req, res) => {
  try {
    if (!hasPaypalCredentials()) {
      return res.status(500).json({
        error: 'Faltan credenciales de PayPal en variables de entorno',
      });
    }

    const orderId = typeof req.body?.orderId === 'string' ? req.body.orderId : '';

    if (!orderId.trim()) {
      return res.status(400).json({ error: 'orderId es obligatorio' });
    }

    const capture = await captureOrderInPaypal(orderId);

    return res.json({
      id: capture.id,
      status: capture.status,
      payer: capture.payer,
      purchaseUnits: capture.purchase_units,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Error al capturar orden en PayPal',
      detail: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
};

module.exports = {
  createOrder,
  captureOrder,
};
