const express = require('express');
const { createOrder, captureOrder } = require('../controllers/paypal.controller');

const router = express.Router();

router.post('/create-order', createOrder);
router.post('/capture-order', captureOrder);

module.exports = router;
