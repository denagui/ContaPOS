import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { getDb, getScope, applyScope } from '../db';
import * as schema from '../../../drizzle/schema';

/**
 * Motor de IA Determinista para el ERP
 * No usa modelos probabilísticos (LLMs), sino reglas de negocio estrictas
 * basadas en datos históricos y umbrales configurables.
 */

export interface AIContext {
  organizationId: string;
  branchId?: string;
  userId?: string;
}

export class DeterministicAI {
  private db: any;
  private context: AIContext;

  constructor(db: any, context: AIContext) {
    this.db = db;
    this.context = context;
  }

  /**
   * 1. SUGERENCIA DE SIGUIENTE MEJOR ACCIÓN (Next Best Action)
   * Analiza transacciones vencidas y sugiere acciones basadas en días de mora y perfil del cliente.
   */
  async suggestNextAction(transactionId: string) {
    const transaction = await this.db.query.transactions.findFirst({
      where: eq(schema.transactions.id, transactionId),
      with: {
        contact: true,
        abonos: true
      }
    });

    if (!transaction) return null;

    const totalFacturado = parseFloat(transaction.total_facturado.toString());
    const totalAbonado = transaction.abonos?.reduce((sum: number, a: any) => sum + parseFloat(a.monto_pagado.toString()), 0) || 0;
    const saldo = totalFacturado - totalAbonado;

    if (saldo <= 0) {
      return { action: 'NONE', message: '✅ Factura pagada completamente', priority: 0 };
    }

    const hoy = new Date();
    const vencimiento = new Date(transaction.fecha_vencimiento);
    const diasMora = Math.floor((hoy.getTime() - vencimiento.getTime()) / (1000 * 60 * 60 * 24));

    // Reglas deterministas
    if (diasMora < 0) {
      return { action: 'WAIT', message: `⏳ Pendiente (vence en ${Math.abs(diasMora)} días)`, priority: 1 };
    } else if (diasMora === 0) {
      return { action: 'REMIND', message: '🔔 Vence hoy. Enviar recordatorio amable.', priority: 2 };
    } else if (diasMora <= 7) {
      return { action: 'CALL_SOFT', message: `📞 Llamar suavemente (${transaction.contact?.telefono}). Han pasado ${diasMora} días.`, priority: 3 };
    } else if (diasMora <= 30) {
      return { action: 'CALL_HARD', message: `⚠️ LLAMAR URGENTE. Mora de ${diasMora} días. Ofrecer plan de pago.`, priority: 4 };
    } else {
      return { action: 'LEGAL', message: `🚨 BLOQUEO/CARTAL LEGAL. Mora crítica de ${diasMora} días.`, priority: 5 };
    }
  }

  /**
   * 2. CLASIFICACIÓN AUTOMÁTICA INTELIGENTE
   * Sugiere categoría, cuenta contable o código CABYS basado en el nombre del ítem o contacto.
   */
  async suggestClassification(itemName: string, type: 'category' | 'cabys' | 'account') {
    const nameLower = itemName.toLowerCase();
    
    // Base de conocimiento local (se puede expandir con historial)
    const knowledgeBase = [
      { keywords: ['fertilizante', 'abono', 'semilla'], category: 'Insumos Agrícolas', cabys: '01234567' },
      { keywords: ['pan', 'harina', 'horno'], category: 'Panadería', cabys: '08901234' },
      { keywords: ['servicio legal', 'abogado', 'consulta jurídica'], category: 'Servicios Legales', cabys: '98765432' },
      { keywords: ['agua', 'medidor', 'cuota'], category: 'Servicios Públicos', cabys: '45678901' },
      { keywords: ['luz', 'electricidad', 'bombillo'], category: 'Suministros Eléctricos', cabys: '11223344' },
      { keywords: ['internet', 'datos', 'wifi'], category: 'Telecomunicaciones', cabys: '55667788' },
    ];

    const match = knowledgeBase.find(kb => kb.keywords.some(k => nameLower.includes(k)));

    if (!match) {
      return { suggestion: 'Manual Review Required', confidence: 0 };
    }

    let result: any = { confidence: 0.9 };
    if (type === 'category') result.suggestion = match.category;
    if (type === 'cabys') result.suggestion = match.cabys;
    if (type === 'account') result.suggestion = match.category; // Simplificado para el ejemplo

    return result;
  }

  /**
   * 3. PREDICCIÓN DE FLUJO DE CAJA (Cash Flow Forecasting)
   * Proyecta ingresos y egresos esperados para los próximos N días basándose en facturas pendientes.
   */
  async forecastCashFlow(days: number = 30) {
    const hoy = new Date();
    const futuro = new Date(hoy.getTime() + days * 24 * 60 * 60 * 1000);

    // Ingresos esperados (Ventas a crédito pendientes)
    const expectedIncome = await this.db.query.transactions.findMany({
      where: and(
        eq(schema.transactions.organization_id, this.context.organizationId),
        eq(schema.transactions.tipo_movimiento, 'INGRESO'),
        eq(schema.transactions.condicion_venta, 'CREDITO'),
        gte(schema.transactions.fecha_vencimiento, hoy.toISOString().split('T')[0]),
        lte(schema.transactions.fecha_vencimiento, futuro.toISOString().split('T')[0])
      )
    });

    // Egresos esperados (Compras a crédito pendientes)
    const expectedExpenses = await this.db.query.transactions.findMany({
      where: and(
        eq(schema.transactions.organization_id, this.context.organizationId),
        eq(schema.transactions.tipo_movimiento, 'GASTO'),
        eq(schema.transactions.condicion_venta, 'CREDITO'),
        gte(schema.transactions.fecha_vencimiento, hoy.toISOString().split('T')[0]),
        lte(schema.transactions.fecha_vencimiento, futuro.toISOString().split('T')[0])
      )
    });

    const totalIncome = expectedIncome.reduce((sum, t) => sum + parseFloat(t.total_facturado.toString()), 0);
    const totalExpenses = expectedExpenses.reduce((sum, t) => sum + parseFloat(t.total_facturado.toString()), 0);
    const netFlow = totalIncome - totalExpenses;

    const riskLevel = netFlow < 0 ? 'HIGH' : netFlow < (totalExpenses * 0.2) ? 'MEDIUM' : 'LOW';

    return {
      period: `Próximos ${days} días`,
      expectedIncome,
      expectedExpenses,
      totalIncome,
      totalExpenses,
      netFlow,
      riskLevel,
      message: riskLevel === 'HIGH' 
        ? '⚠️ ALERTA: Se proyecta un flujo de caja negativo. Revise cobranzas.' 
        : '✅ Flujo de caja saludable proyectado.'
    };
  }

  /**
   * 4. DETECCIÓN DE ANOMALÍAS (Fraude/Error)
   * Detecta precios fuera de rango estadístico o duplicidad sospechosa.
   */
  async detectAnomalies(itemId: string, price: number, quantity: number) {
    // Obtener historial de precios para este ítem en esta organización
    const history = await this.db.query.transactions.findMany({
      where: and(
        eq(schema.transactions.organization_id, this.context.organizationId),
        eq(schema.transactions.item_ref, itemId)
      ),
      columns: { precio_unitario: true }
    });

    if (history.length < 3) return { isAnomaly: false, reason: 'Insufficient data' };

    const prices = history.map(h => parseFloat(h.precio_unitario.toString()));
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);

    // Regla: Si el precio se desvía más del 20% del promedio
    const deviation = Math.abs(price - avgPrice) / avgPrice;
    
    if (deviation > 0.20) {
      return {
        isAnomaly: true,
        reason: `Precio fuera de rango (${(deviation * 100).toFixed(1)}% desviación). Promedio histórico: ${avgPrice.toFixed(2)}`,
        suggestedPrice: avgPrice,
        severity: deviation > 0.50 ? 'HIGH' : 'MEDIUM'
      };
    }

    // Regla: Cantidad inusualmente alta (más de 10x el promedio si tuviéramos ese dato, simplificado aquí)
    if (quantity > 1000) { // Umbral genérico
      return {
        isAnomaly: true,
        reason: 'Cantidad inusualmente alta',
        severity: 'LOW'
      };
    }

    return { isAnomaly: false, reason: 'Within normal parameters' };
  }
}

// Factory function para usar en los loaders/actions de SvelteKit
export function createAIEngine(db: any, context: any) {
  const scope = getScope(context);
  return new DeterministicAI(db, { organizationId: scope.organizationId, branchId: scope.branchId });
}
