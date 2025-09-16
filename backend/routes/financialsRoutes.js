// backend/routes/financialsRoutes.js
const express = require('express');
const router = express.Router();
const financialsController = require('../controllers/financialsController');
// ✅ Importamos o middleware 'hasPermission'
const { verifyToken, hasPermission } = require('../middleware/authMiddleware');

// ❌ A regra geral 'router.use()' foi removida.

// ✅ Cada rota agora é protegida por sua permissão específica,
// permitindo controle total sobre quem vê cada tipo de relatório.

// A permissão 'admin_painel_financeiro' dá acesso ao resumo geral.
router.get('/summary', [verifyToken, hasPermission('admin_painel_financeiro')], financialsController.getSummary);

// As rotas abaixo usam as permissões financeiras granulares que definimos.
router.get('/sales-over-time', [verifyToken, hasPermission('financeiro_comparativo_mensal')], financialsController.getSalesOverTime);
router.get('/customer-profitability', [verifyToken, hasPermission('financeiro_top10_clientes')], financialsController.getCustomerProfitability);
router.get('/product-profitability', [verifyToken, hasPermission('financeiro_top10_produtos')], financialsController.getProductProfitability);
router.get('/payment-method-stats', [verifyToken, hasPermission('financeiro_analise_pagamentos')], financialsController.getPaymentMethodStats);
router.get('/available-months', [verifyToken, hasPermission('financeiro_comparativo_mensal')], financialsController.getAvailableMonths);
router.get('/monthly-comparison', [verifyToken, hasPermission('financeiro_comparativo_mensal')], financialsController.getMonthlyComparison);
router.get('/product-sales-comparison', [verifyToken, hasPermission('financeiro_comparativo_produto')], financialsController.getProductSalesComparison);

module.exports = router;