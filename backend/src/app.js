const express = require('express');
const cors = require('cors');
const productosRoutes = require('./routes/productos.routes');
const paypalRoutes = require('./routes/paypal.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'mi-proyecto-backend' });
});

app.use('/api/paypal', paypalRoutes);
app.use('/api', productosRoutes);

module.exports = app;
