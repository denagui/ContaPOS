/**
 * BankReconciliationService - Servicio de Conciliación Bancaria
 * 
 * Importación de extractos bancarios (CSV/OFX) y matching automático
 * con journal_lines para conciliación bancaria.
 * 
 * Características:
 * - Importación desde CSV/OFX con mapeo configurable
 * - Matching automático basado en monto, fecha y descripción
 * - Detección de partidas pendientes (depósitos en tránsito, cheques pendientes)
 * - Generación de lotes de conciliación
 * - Reporte de discrepancias
 */

import { db } from '$lib/server/db';
import { 
  bankAccounts,
  bankTransactions,
  reconciliationBatches,
  reconciliationItems,
  journalLines,
  journalEntries,
  type NewBankAccount,
  type NewBankTransaction,
  type NewReconciliationBatch,
  type NewReconciliationItem,
} from '$lib/server/db/schema';
import { eq, and, sql, desc, between, isNull, or, like } from 'drizzle-orm';
import { MoneyUtils } from '$lib/server/utils/money-utils';

// ============================================
// TIPOS
// ============================================

export interface BankImportConfig {
  dateFormat: string; // ej: 'YYYY-MM-DD', 'DD/MM/YYYY'
  amountColumn: string;
  dateColumn: string;
  descriptionColumn: string;
  referenceColumn?: string;
  balanceColumn?: string;
  debitColumn?: string;
  creditColumn?: string;
  hasHeader: boolean;
  delimiter: ',' | ';' | '\t';
  encoding?: 'utf-8' | 'latin1' | 'windows-1252';
}

export interface ImportedTransaction {
  transactionDate: number; // Epoch 13
  description: string;
  reference?: string;
  amountCents: number;
  balanceAfterCents?: number;
  transactionType?: 'debit' | 'credit' | 'fee' | 'interest' | 'transfer' | 'other';
}

export interface MatchCandidate {
  journalLineId: string;
  accountId: string;
  accountName: string;
  amountCents: number;
  transactionDate: number;
  description: string;
  confidenceScore: number; // 0.0 a 1.0
  matchReasons: string[];
}

export interface ReconciliationSummary {
  batchId: string;
  openingBalanceCents: number;
  closingBalanceCents: number;
  totalDepositsCents: number;
  totalWithdrawalsCents: number;
  outstandingDepositsCents: number;
  outstandingWithdrawalsCents: number;
  matchedCount: number;
  unmatchedCount: number;
  discrepancyAmountCents: number;
  isBalanced: boolean;
}

// ============================================
// SERVICIO DE CONCILIACIÓN BANCARIA
// ============================================

export class BankReconciliationService {

  // ============================================
  // GESTIÓN DE CUENTAS BANCARIAS
  // ============================================

  /**
   * Crea una nueva cuenta bancaria
   */
  static async createBankAccount(data: {
    companyId: string;
    branchId?: string;
    accountName: string;
    accountNumber: string;
    bankName: string;
    accountType?: 'checking' | 'savings' | 'credit_card' | 'loan';
    currency?: string;
    importFormat?: 'csv' | 'ofx' | 'qif' | 'manual';
    csvMapping?: BankImportConfig;
  }): Promise<string> {
    const newAccount: NewBankAccount = {
      id: crypto.randomUUID(),
      companyId: data.companyId,
      branchId: data.branchId,
      accountName: data.accountName,
      accountNumber: this.maskAccountNumber(data.accountNumber),
      bankName: data.bankName,
      accountType: data.accountType || 'checking',
      currency: data.currency || 'CRC',
      currentBalanceCents: 0,
      lastReconciledBalanceCents: 0,
      importFormat: data.importFormat || 'csv',
      csvMapping: data.csvMapping ? JSON.stringify(data.csvMapping) : null,
      isActive: 1,
    };

    const [account] = await db.insert(bankAccounts).values(newAccount).returning();
    return account.id;
  }

  /**
   * Obtiene cuentas bancarias de una compañía
   */
  static async getBankAccounts(companyId: string, branchId?: string) {
    const accounts = await db.query.bankAccounts.findMany({
      where: and(
        eq(bankAccounts.companyId, companyId),
        eq(bankAccounts.isActive, 1),
        branchId ? eq(bankAccounts.branchId, branchId) : undefined
      ),
      orderBy: [bankAccounts.accountName],
    });

    return accounts;
  }

  /**
   * Actualiza saldo de cuenta bancaria
   */
  static async updateBankBalance(
    bankAccountId: string,
    balanceCents: number
  ): Promise<void> {
    await db.update(bankAccounts)
      .set({
        currentBalanceCents: balanceCents,
        updatedAt: Date.now(),
      })
      .where(eq(bankAccounts.id, bankAccountId));
  }

  // ============================================
  // IMPORTACIÓN DE TRANSACCIONES
  // ============================================

  /**
   * Importa transacciones desde CSV
   */
  static async importFromCSV(
    bankAccountId: string,
    companyId: string,
    csvContent: string,
    config: BankImportConfig,
    importedBy?: string
  ): Promise<{ importedCount: number; batchId: string }> {
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      throw new Error('Archivo CSV vacío');
    }

    const startIndex = config.hasHeader ? 1 : 0;
    const transactions: ImportedTransaction[] = [];

    for (let i = startIndex; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i], config.delimiter);
      const transaction = this.mapCSVToTransaction(values, config);
      
      if (transaction) {
        transactions.push(transaction);
      }
    }

    if (transactions.length === 0) {
      throw new Error('No se pudieron importar transacciones del CSV');
    }

    // Generar ID de lote
    const importBatchId = `IMPORT-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

    // Insertar transacciones
    for (const trans of transactions) {
      const newTransaction: NewBankTransaction = {
        id: crypto.randomUUID(),
        bankAccountId,
        companyId,
        transactionDate: trans.transactionDate,
        postingDate: trans.transactionDate,
        description: trans.description,
        reference: trans.reference,
        transactionType: trans.transactionType || 'other',
        amountCents: trans.amountCents,
        balanceAfterCents: trans.balanceAfterCents,
        matchStatus: 'unmatched',
        importBatchId,
        importSource: 'csv',
        importedBy,
        isReconciled: 0,
      };

      await db.insert(bankTransactions).values(newTransaction);
    }

    return {
      importedCount: transactions.length,
      batchId: importBatchId,
    };
  }

  /**
   * Parsea línea CSV según delimitador
   */
  private static parseCSVLine(line: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  /**
   * Mapea valores CSV a transacción
   */
  private static mapCSVToTransaction(
    values: string[],
    config: BankImportConfig
  ): ImportedTransaction | null {
    try {
      // Obtener índices de columnas
      const dateIndex = this.getColumnIndex(config.dateColumn, values);
      const amountIndex = this.getColumnIndex(config.amountColumn, values);
      const descIndex = this.getColumnIndex(config.descriptionColumn, values);
      const refIndex = config.referenceColumn 
        ? this.getColumnIndex(config.referenceColumn, values) 
        : -1;
      const balanceIndex = config.balanceColumn 
        ? this.getColumnIndex(config.balanceColumn, values) 
        : -1;

      if (dateIndex === -1 || amountIndex === -1 || descIndex === -1) {
        return null;
      }

      // Parsear fecha
      const dateStr = values[dateIndex];
      const transactionDate = this.parseDate(dateStr, config.dateFormat);

      // Parsear monto
      const amountStr = values[amountIndex].replace(/[^0-9.,-]/g, '');
      const amount = parseFloat(amountStr.replace(',', '.'));
      const amountCents = Math.round(Math.abs(amount) * 100);

      // Determinar tipo de transacción
      let transactionType: 'debit' | 'credit' | 'other' = 'other';
      if (config.debitColumn && config.creditColumn) {
        const debitVal = values[this.getColumnIndex(config.debitColumn, values)];
        const creditVal = values[this.getColumnIndex(config.creditColumn, values)];
        
        if (debitVal && parseFloat(debitVal.replace(',', '.')) > 0) {
          transactionType = 'debit';
        } else if (creditVal && parseFloat(creditVal.replace(',', '.')) > 0) {
          transactionType = 'credit';
        }
      } else if (amount < 0) {
        transactionType = 'debit';
      } else if (amount > 0) {
        transactionType = 'credit';
      }

      // Parsear saldo
      let balanceAfterCents: number | undefined;
      if (balanceIndex !== -1 && values[balanceIndex]) {
        const balanceStr = values[balanceIndex].replace(/[^0-9.,-]/g, '');
        const balance = parseFloat(balanceStr.replace(',', '.'));
        balanceAfterCents = Math.round(Math.abs(balance) * 100);
      }

      return {
        transactionDate,
        description: values[descIndex] || 'Sin descripción',
        reference: refIndex !== -1 ? values[refIndex] : undefined,
        amountCents,
        balanceAfterCents,
        transactionType,
      };
    } catch (error) {
      console.error('Error parsing CSV row:', error);
      return null;
    }
  }

  /**
   * Obtiene índice de columna desde nombres posibles
   */
  private static getColumnIndex(columnName: string, values: string[]): number {
    // Buscar coincidencia exacta o parcial
    const index = values.findIndex(v => 
      v.toLowerCase().includes(columnName.toLowerCase())
    );
    return index;
  }

  /**
   * Parsea fecha desde string
   */
  private static parseDate(dateStr: string, format: string): number {
    // Implementación básica - se puede expandir según formatos necesarios
    const cleaned = dateStr.trim();
    
    // Intentar formato ISO primero
    if (/^\d{4}-\d{2}-\d{2}/.test(cleaned)) {
      return new Date(cleaned).getTime();
    }
    
    // Formato DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}/.test(cleaned)) {
      const [day, month, year] = cleaned.split('/');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).getTime();
    }
    
    // Formato MM/DD/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}/.test(cleaned) && format.includes('MM/DD')) {
      const [month, day, year] = cleaned.split('/');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).getTime();
    }

    // Fallback a fecha actual si no se puede parsear
    console.warn('Unable to parse date:', dateStr);
    return Date.now();
  }

  /**
   * Enmascara número de cuenta para seguridad
   */
  private static maskAccountNumber(accountNumber: string): string {
    if (accountNumber.length <= 4) return accountNumber;
    const last4 = accountNumber.slice(-4);
    return '*'.repeat(accountNumber.length - 4) + last4;
  }

  // ============================================
  // MATCHING AUTOMÁTICO
  // ============================================

  /**
   * Encuentra posibles coincidencias entre transacciones bancarias y journal lines
   */
  static async findMatches(
    bankTransactionId: string,
    companyId: string,
    toleranceDays: number = 3,
    toleranceCents: number = 0
  ): Promise<MatchCandidate[]> {
    const bankTrans = await db.query.bankTransactions.findFirst({
      where: eq(bankTransactions.id, bankTransactionId),
    });

    if (!bankTrans) {
      throw new Error('Transacción bancaria no encontrada');
    }

    const candidates: MatchCandidate[] = [];

    // Buscar journal lines dentro del rango de fechas y monto similar
    const toleranceMs = toleranceDays * 24 * 60 * 60 * 1000;
    const fromDate = bankTrans.transactionDate - toleranceMs;
    const toDate = bankTrans.transactionDate + toleranceMs;

    // Obtener journal lines relacionados con la compañía
    const journalLinesList = await db.query.journalLines.findMany({
      where: and(
        isNull(journalLines.matchedJournalLineId), // No匹配ados aún
      ),
      with: {
        entry: {
          where: and(
            eq(journalEntries.companyId, companyId),
            between(journalEntries.transactionDate, fromDate, toDate)
          ),
        },
        account: true,
      },
    });

    for (const line of journalLinesList) {
      if (!line.entry) continue;

      const lineAmount = line.debitCents > 0 ? line.debitCents : line.creditCents;
      const amountDiff = Math.abs(lineAmount - bankTrans.amountCents);

      // Calcular score de confianza
      let confidenceScore = 0;
      const matchReasons: string[] = [];

      // Matching por monto (50% del score)
      if (toleranceCents === 0 && amountDiff === 0) {
        confidenceScore += 0.5;
        matchReasons.push('Monto exacto');
      } else if (toleranceCents > 0 && amountDiff <= toleranceCents) {
        confidenceScore += 0.5 - (amountDiff / toleranceCents) * 0.5;
        matchReasons.push(`Monto dentro de tolerancia (diff: ${amountDiff})`);
      }

      // Matching por fecha (20% del score)
      const dateDiff = Math.abs(line.entry.transactionDate - bankTrans.transactionDate);
      const dateScore = Math.max(0, 0.2 - (dateDiff / toleranceMs) * 0.2);
      confidenceScore += dateScore;
      if (dateDiff < 24 * 60 * 60 * 1000) {
        matchReasons.push('Misma fecha');
      } else if (dateDiff < 3 * 24 * 60 * 60 * 1000) {
        matchReasons.push(`Fecha cercana (${Math.round(dateDiff / (24 * 60 * 60 * 1000))} días)`);
      }

      // Matching por descripción (30% del score)
      const descriptionSimilarity = this.calculateStringSimilarity(
        bankTrans.description.toLowerCase(),
        (line.description || '').toLowerCase()
      );
      const descScore = descriptionSimilarity * 0.3;
      confidenceScore += descScore;
      if (descriptionSimilarity > 0.7) {
        matchReasons.push(`Descripción similar (${Math.round(descriptionSimilarity * 100)}%)`);
      }

      // Solo incluir candidatos con score significativo
      if (confidenceScore >= 0.5) {
        candidates.push({
          journalLineId: line.id,
          accountId: line.accountId,
          accountName: line.account?.accountName || 'Desconocida',
          amountCents: lineAmount,
          transactionDate: line.entry.transactionDate,
          description: line.description || '',
          confidenceScore: Math.min(1.0, confidenceScore),
          matchReasons,
        });
      }
    }

    // Ordenar por score de confianza
    candidates.sort((a, b) => b.confidenceScore - a.confidenceScore);

    return candidates.slice(0, 10); // Retornar top 10 candidatos
  }

  /**
   * Calcula similitud entre dos strings (Levenshtein simplificado)
   */
  private static calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Distancia de Levenshtein para comparación de strings
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Aplica matching automático a todas las transacciones no匹配adas
   */
  static async autoMatchAll(
    bankAccountId: string,
    companyId: string,
    minConfidenceScore: number = 0.8
  ): Promise<{ matchedCount: number }> {
    const unmatchedTransactions = await db.query.bankTransactions.findMany({
      where: and(
        eq(bankTransactions.bankAccountId, bankAccountId),
        eq(bankTransactions.matchStatus, 'unmatched')
      ),
    });

    let matchedCount = 0;

    for (const trans of unmatchedTransactions) {
      const candidates = await this.findMatches(trans.id, companyId);
      
      if (candidates.length > 0 && candidates[0].confidenceScore >= minConfidenceScore) {
        const bestMatch = candidates[0];
        
        // Actualizar transacción bancaria
        await db.update(bankTransactions)
          .set({
            matchedJournalLineId: bestMatch.journalLineId,
            matchStatus: 'matched',
            matchConfidenceScore: bestMatch.confidenceScore,
            matchNotes: bestMatch.matchReasons.join('; '),
            updatedAt: Date.now(),
          })
          .where(eq(bankTransactions.id, trans.id));

        matchedCount++;
      }
    }

    return { matchedCount };
  }

  // ============================================
  // GESTIÓN DE LOTES DE CONCILIACIÓN
  // ============================================

  /**
   * Crea un nuevo lote de conciliación
   */
  static async createReconciliationBatch(data: {
    bankAccountId: string;
    companyId: string;
    startDate: number;
    endDate: number;
    openingBalanceCents: number;
    closingBalanceCents: number;
    createdBy?: string;
  }): Promise<string> {
    // Generar número de lote
    const batchNumber = await this.generateBatchNumber(data.companyId);

    const newBatch: NewReconciliationBatch = {
      id: crypto.randomUUID(),
      bankAccountId: data.bankAccountId,
      companyId: data.companyId,
      batchNumber,
      startDate: data.startDate,
      endDate: data.endDate,
      openingBalanceCents: data.openingBalanceCents,
      closingBalanceCents: data.closingBalanceCents,
      status: 'in_progress',
      hasDiscrepancies: 0,
      discrepancyAmountCents: 0,
      createdBy: data.createdBy,
    };

    const [batch] = await db.insert(reconciliationBatches).values(newBatch).returning();
    return batch.id;
  }

  /**
   * Genera número consecutivo de lote
   */
  private static async generateBatchNumber(companyId: string): Promise<string> {
    const year = new Date().getFullYear();
    
    const lastBatch = await db.query.reconciliationBatches.findFirst({
      where: eq(reconciliationBatches.companyId, companyId),
      orderBy: [desc(reconciliationBatches.createdAt)],
    });

    let nextNumber = 1;
    if (lastBatch) {
      const match = lastBatch.batchNumber.match(/-(\\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    return `REC-${year}-${String(nextNumber).padStart(5, '0')}`;
  }

  /**
   * Agrega item a lote de conciliación
   */
  static async addReconciliationItem(data: {
    batchId: string;
    bankTransactionId?: string;
    journalLineId?: string;
    itemType: 'matched' | 'outstanding_deposit' | 'outstanding_withdrawal' | 'bank_error' | 'book_error';
    amountCents: number;
    notes?: string;
  }): Promise<string> {
    const newItem: NewReconciliationItem = {
      id: crypto.randomUUID(),
      batchId: data.batchId,
      bankTransactionId: data.bankTransactionId,
      journalLineId: data.journalLineId,
      itemType: data.itemType,
      amountCents: data.amountCents,
      isCleared: 1,
      clearedAt: Date.now(),
      notes: data.notes,
    };

    const [item] = await db.insert(reconciliationItems).values(newItem).returning();

    // Si es item匹配ado, actualizar transacción bancaria
    if (data.bankTransactionId && data.itemType === 'matched') {
      await db.update(bankTransactions)
        .set({
          isReconciled: 1,
          reconciledAt: Date.now(),
        })
        .where(eq(bankTransactions.id, data.bankTransactionId));
    }

    return item.id;
  }

  /**
   * Calcula resumen de conciliación
   */
  static async calculateReconciliationSummary(batchId: string): Promise<ReconciliationSummary> {
    const batch = await db.query.reconciliationBatches.findFirst({
      where: eq(reconciliationBatches.id, batchId),
      with: {
        items: true,
      },
    });

    if (!batch) {
      throw new Error('Lote de conciliación no encontrado');
    }

    let totalDepositsCents = 0;
    let totalWithdrawalsCents = 0;
    let outstandingDepositsCents = 0;
    let outstandingWithdrawalsCents = 0;
    let matchedCount = 0;
    let unmatchedCount = 0;

    for (const item of batch.items) {
      switch (item.itemType) {
        case 'matched':
        case 'outstanding_deposit':
          totalDepositsCents += item.amountCents;
          if (item.itemType === 'outstanding_deposit') {
            outstandingDepositsCents += item.amountCents;
          } else {
            matchedCount++;
          }
          break;
        case 'outstanding_withdrawal':
        case 'bank_error':
        case 'book_error':
          totalWithdrawalsCents += item.amountCents;
          if (item.itemType === 'outstanding_withdrawal') {
            outstandingWithdrawalsCents += item.amountCents;
          } else {
            unmatchedCount++;
          }
          break;
      }
    }

    // Calcular discrepancia
    const bookBalance = batch.openingBalanceCents + totalDepositsCents - totalWithdrawalsCents;
    const discrepancyAmountCents = bookBalance - batch.closingBalanceCents;
    const isBalanced = discrepancyAmountCents === 0;

    return {
      batchId,
      openingBalanceCents: batch.openingBalanceCents,
      closingBalanceCents: batch.closingBalanceCents,
      totalDepositsCents,
      totalWithdrawalsCents,
      outstandingDepositsCents,
      outstandingWithdrawalsCents,
      matchedCount,
      unmatchedCount,
      discrepancyAmountCents,
      isBalanced,
    };
  }

  /**
   * Completa lote de conciliación
   */
  static async completeReconciliationBatch(
    batchId: string,
    reviewedBy?: string,
    approvedBy?: string
  ): Promise<void> {
    const summary = await this.calculateReconciliationSummary(batchId);

    await db.update(reconciliationBatches)
      .set({
        status: 'completed',
        completedAt: Date.now(),
        hasDiscrepancies: summary.discrepancyAmountCents !== 0 ? 1 : 0,
        discrepancyAmountCents: summary.discrepancyAmountCents,
        discrepancyNotes: summary.discrepancyAmountCents !== 0 
          ? `Diferencia de ${MoneyUtils.formatMoney(summary.discrepancyAmountCents)}` 
          : null,
        reviewedBy,
        approvedBy,
        approvedAt: Date.now(),
        totalDepositsCents: summary.totalDepositsCents,
        totalWithdrawalsCents: summary.totalWithdrawalsCents,
        outstandingDepositsCents: summary.outstandingDepositsCents,
        outstandingWithdrawalsCents: summary.outstandingWithdrawalsCents,
        matchedTransactionCount: summary.matchedCount,
        updatedAt: Date.now(),
      })
      .where(eq(reconciliationBatches.id, batchId));

    // Actualizar última conciliación de la cuenta bancaria
    const batch = await db.query.reconciliationBatches.findFirst({
      where: eq(reconciliationBatches.id, batchId),
    });

    if (batch) {
      await db.update(bankAccounts)
        .set({
          lastReconciledBalanceCents: batch.closingBalanceCents,
          lastReconciledAt: Date.now(),
          updatedAt: Date.now(),
        })
        .where(eq(bankAccounts.id, batch.bankAccountId));
    }
  }

  // ============================================
  // REPORTES Y CONSULTAS
  // ============================================

  /**
   * Obtiene transacciones pendientes de conciliar
   */
  static async getUnreconciledTransactions(
    bankAccountId: string,
    companyId: string,
    limit: number = 100
  ) {
    const transactions = await db.query.bankTransactions.findMany({
      where: and(
        eq(bankTransactions.bankAccountId, bankAccountId),
        eq(bankTransactions.isReconciled, 0)
      ),
      orderBy: [desc(bankTransactions.transactionDate)],
      limit,
    });

    return transactions;
  }

  /**
   * Obtiene historial de conciliaciones
   */
  static async getReconciliationHistory(
    companyId: string,
    bankAccountId?: string,
    limit: number = 50
  ) {
    const batches = await db.query.reconciliationBatches.findMany({
      where: and(
        eq(reconciliationBatches.companyId, companyId),
        bankAccountId ? eq(reconciliationBatches.bankAccountId, bankAccountId) : undefined,
        eq(reconciliationBatches.status, 'completed')
      ),
      orderBy: [desc(reconciliationBatches.completedAt)],
      limit,
      with: {
        bankAccount: true,
      },
    });

    return batches;
  }
}

export default BankReconciliationService;
