/**
 * Tipos e Interfaces para el Sistema de Facturación Electrónica Kairux
 * Patrón Adapter/Strategy para soporte multi-proveedor
 */

// ============================================
// ENUMS Y TIPOS BASE
// ============================================

export type BillingProviderType = 
  | 'kairux_native'      // Motor nativo Kairux (simulado)
  | 'generic_api'        // API REST genérica
  | 'nubox'              // Nubox Costa Rica
  | 'facturate'          // Facturate.cr
  | 'hacienda_direct';   // Conexión directa a Hacienda CR

export type DocumentType = 
  | '01' // Factura Electrónica
  | '02' // Nota de Débito
  | '03' // Nota de Crédito
  | '04' // Ticket de Venta
  | '05' // Comprobante Simplificado;

export type HaciendaStatus = 
  | 'pending'    // Pendiente de envío
  | 'sent'       // Enviado a Hacienda
  | 'accepted'   // Aceptado por Hacienda
  | 'rejected'   // Rechazado por Hacienda
  | 'cancelled'; // Cancelado

export interface TaxSummary {
  taxType: '0' | '4' | '8' | '13';
  taxableAmount: number;
  taxAmount: number;
}

// ============================================
// INTERFAZ DEL ADAPTADOR (CONTRATO)
// ============================================

/**
 * Interface que deben implementar todos los adapters de facturación
 * Sigue el patrón Strategy para permitir intercambio dinámico
 */
export interface BillingAdapter {
  /**
   * Nombre identificador del proveedor
   */
  readonly providerName: string;

  /**
   * Tipo de proveedor
   */
  readonly providerType: BillingProviderType;

  /**
   * Inicializar el adapter con la configuración específica
   */
  initialize(config: Record<string, unknown>): Promise<void>;

  /**
   * Enviar un comprobante electrónico a timbrar/firmar
   * @param invoice - Datos de la factura
   * @returns Resultado del proceso con XML firmado y metadatos
   */
  sendDocument(invoice: ElectronicInvoice): Promise<BillingResponse>;

  /**
   * Consultar el estado de un documento ya enviado
   * @param documentKey - Clave del comprobante (50 dígitos)
   * @returns Estado actual del documento
   */
  checkStatus(documentKey: string): Promise<StatusResponse>;

  /**
   * Cancelar un documento electrónico
   * @param documentKey - Clave del comprobante
   * @param reason - Motivo de la cancelación
   * @returns Resultado de la cancelación
   */
  cancelDocument(documentKey: string, reason: string): Promise<CancellationResponse>;

  /**
   * Generar el PDF del comprobante (ticket o factura)
   * @param invoice - Datos de la factura
   * @param signedXml - XML firmado (opcional)
   * @returns Buffer del PDF generado
   */
  generatePDF(invoice: ElectronicInvoice, signedXml?: string): Promise<Uint8Array>;

  /**
   * Validar que la configuración es correcta
   */
  validateConfig(): Promise<boolean>;
}

// ============================================
// DTOs DE ENTRADA
// ============================================

/**
 * Datos de una factura electrónica según estándar CR
 */
export interface ElectronicInvoice {
  // Encabezado
  documentType: DocumentType;
  documentKey?: string; // Se genera si no existe
  issueDate: number; // Epoch 13
  expirationDate?: number; // Epoch 13
  
  // Emisor
  emitter: {
    taxId: string; // Cédula jurídica o física
    name: string;
    commercialName?: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      province: string;
      postalCode?: string;
    };
    email?: string;
    phone?: string;
  };

  // Receptor (opcional para ticket)
  receiver?: {
    taxId?: string;
    name: string;
    email?: string;
    phone?: string;
    address?: {
      line1: string;
      city: string;
      province: string;
    };
  };

  // Detalles
  currency: string; // ISO 4217 (CRC, USD)
  exchangeRate?: number; // Si es diferente de 1
  items: InvoiceItem[];
  
  // Totales
  subtotal: number;
  totalDiscount: number;
  taxSummary: TaxSummary[];
  totalAmount: number;
  
  // Pago
  paymentMethod: 'cash' | 'card' | 'transfer' | 'sinpe' | 'credit';
  paymentConditions?: string;
  
  // Referencia (para notas de crédito/débito)
  reference?: {
    documentType: DocumentType;
    documentKey: string;
    reason: string;
  };

  // Metadatos adicionales
  notes?: string;
  branchId: string;
  saleId?: string;
}

/**
 * Item individual de una factura
 */
export interface InvoiceItem {
  lineNumber: number;
  cabysCode: string; // Código CABYS de 13 dígitos
  quantity: number;
  unitOfMeasure: string; // 'Sp' (servicio), 'Ni' (unidad), etc.
  unitPrice: number;
  unitPriceTotal: number;
  discount?: {
    amount: number;
    percentage?: number;
  };
  taxType: '0' | '4' | '8' | '13';
  taxAmount: number;
  totalAmount: number;
  description: string;
}

// ============================================
// DTOs DE SALIDA
// ============================================

/**
 * Respuesta exitosa del proceso de facturación
 */
export interface BillingResponse {
  success: true;
  documentKey: string; // Clave de 50 dígitos
  consecutiveNumber: string; // Consecutivo interno
  xmlSigned: string; // XML firmado en base64 o string
  xmlHash: string; // Hash SHA-256 del XML
  qrCode?: string; // URL o base64 del QR
  pdf?: Uint8Array; // PDF generado (opcional)
  sentAt: number; // Epoch 13
  providerReference?: string; // Referencia del proveedor externo
  message?: string;
}

/**
 * Respuesta de error
 */
export interface BillingError {
  success: false;
  errorCode: string;
  message: string;
  details?: Record<string, unknown>;
}

export type BillingResult = BillingResponse | BillingError;

/**
 * Estado de un documento
 */
export interface StatusResponse {
  documentKey: string;
  status: HaciendaStatus;
  lastUpdate: number; // Epoch 13
  message?: string;
  xmlResponse?: string; // XML de respuesta de Hacienda
}

/**
 * Resultado de cancelación
 */
export interface CancellationResponse {
  success: boolean;
  documentKey: string;
  cancellationKey?: string; // Clave del mensaje receptor
  status: HaciendaStatus;
  message?: string;
}

// ============================================
// CONFIGURACIÓN DEL PROVEEDOR
// ============================================

/**
 * Configuración base para cualquier proveedor
 */
export interface BaseBillingConfig {
  providerType: BillingProviderType;
  enabled: boolean;
  testMode?: boolean;
}

/**
 * Configuración específica para Kairux Native
 */
export interface KairuxConfig extends BaseBillingConfig {
  providerType: 'kairux_native';
  // Configuración interna
  certificatePath?: string;
  privateKey?: string;
}

/**
 * Configuración para API Genérica
 */
export interface GenericApiConfig extends BaseBillingConfig {
  providerType: 'generic_api';
  baseUrl: string;
  apiKey: string;
  apiSecret?: string;
  timeout?: number; // ms
  headers?: Record<string, string>;
}

/**
 * Configuración para Nubox
 */
export interface NuboxConfig extends BaseBillingConfig {
  providerType: 'nubox';
  apiUrl: string;
  username: string;
  password: string;
  environment: 'sandbox' | 'production';
}

/**
 * Unión de todas las configuraciones posibles
 */
export type BillingConfig = 
  | KairuxConfig 
  | GenericApiConfig 
  | NuboxConfig;

// ============================================
// EVENTOS PARA EL ORQUESTADOR
// ============================================

export interface BillingEvent {
  type: 'document_sent' | 'status_changed' | 'error';
  documentKey: string;
  timestamp: number;
  data?: unknown;
}

export type BillingEventListener = (event: BillingEvent) => void;
