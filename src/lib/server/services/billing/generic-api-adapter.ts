/**
 * GenericApiAdapter - Adaptador para proveedores de facturación vía API REST
 * 
 * Este adapter permite conectar con cualquier proveedor externo de facturación
 * electrónica que exponga una API REST (Nubox, Facturate, etc.)
 * 
 * Configuración requerida:
 * - baseUrl: URL base del proveedor
 * - apiKey: Clave de autenticación
 * - endpoints: Mapeo de endpoints específicos
 */

import type {
  BillingAdapter,
  ElectronicInvoice,
  BillingResponse,
  BillingError,
  StatusResponse,
  CancellationResponse,
  GenericApiConfig,
} from './types';

export class GenericApiAdapter implements BillingAdapter {
  readonly providerName = 'Generic API Provider';
  readonly providerType = 'generic_api' as const;

  private config: GenericApiConfig | null = null;
  private initialized = false;

  /**
   * Inicializar el adapter con configuración específica
   */
  async initialize(config: Record<string, unknown>): Promise<void> {
    const genericConfig = config as GenericApiConfig;

    if (!genericConfig.providerType || genericConfig.providerType !== 'generic_api') {
      throw new Error('Invalid configuration for GenericApiAdapter');
    }

    if (!genericConfig.baseUrl || !genericConfig.apiKey) {
      throw new Error('baseUrl and apiKey are required for GenericApiAdapter');
    }

    this.config = genericConfig;
    this.initialized = true;

    console.log(`[GenericApiAdapter] Initialized for ${genericConfig.baseUrl}`);
  }

  /**
   * Enviar documento electrónico a la API externa
   */
  async sendDocument(invoice: ElectronicInvoice): Promise<BillingResponse | BillingError> {
    if (!this.initialized || !this.config) {
      return {
        success: false,
        errorCode: 'NOT_INITIALIZED',
        message: 'GenericApiAdapter not initialized. Call initialize() first.',
      };
    }

    try {
      const timeout = this.config.timeout || 30000; // 30s default
      
      // Construir payload según estándar del proveedor
      const payload = this.buildPayload(invoice);

      // Configurar headers
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        ...this.config.headers,
      };

      // Hacer request a la API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${this.config.baseUrl}/documents`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // Transformar respuesta del proveedor a nuestro formato estándar
      return this.transformResponse(result, invoice);
    } catch (error) {
      console.error('[GenericApiAdapter] Error sending document:', error);

      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          errorCode: 'TIMEOUT',
          message: 'Request timed out',
        };
      }

      return {
        success: false,
        errorCode: 'API_ERROR',
        message: error instanceof Error ? error.message : 'Unknown API error',
        details: { invoice },
      };
    }
  }

  /**
   * Consultar estado de un documento
   */
  async checkStatus(documentKey: string): Promise<StatusResponse> {
    if (!this.initialized || !this.config) {
      throw new Error('GenericApiAdapter not initialized');
    }

    try {
      const response = await fetch(
        `${this.config.baseUrl}/documents/${documentKey}/status`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      return {
        documentKey,
        status: this.mapStatus(result.status),
        lastUpdate: Date.now(),
        message: result.message,
        xmlResponse: result.xml,
      };
    } catch (error) {
      console.error('[GenericApiAdapter] Error checking status:', error);
      throw error;
    }
  }

  /**
   * Cancelar un documento electrónico
   */
  async cancelDocument(documentKey: string, reason: string): Promise<CancellationResponse> {
    if (!this.initialized || !this.config) {
      return {
        success: false,
        documentKey,
        status: 'pending',
        message: 'Adapter not initialized',
      };
    }

    try {
      const response = await fetch(
        `${this.config.baseUrl}/documents/${documentKey}/cancel`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`,
          },
          body: JSON.stringify({ reason }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      return {
        success: result.success,
        documentKey,
        cancellationKey: result.cancellationKey,
        status: result.success ? 'cancelled' : 'rejected',
        message: result.message,
      };
    } catch (error) {
      return {
        success: false,
        documentKey,
        status: 'rejected',
        message: error instanceof Error ? error.message : 'Error al cancelar',
      };
    }
  }

  /**
   * Generar PDF del comprobante
   */
  async generatePDF(invoice: ElectronicInvoice, signedXml?: string): Promise<Uint8Array> {
    if (!this.initialized || !this.config) {
      throw new Error('GenericApiAdapter not initialized');
    }

    try {
      // Solicitar PDF al proveedor externo
      const response = await fetch(`${this.config.baseUrl}/documents/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          invoice: this.buildPayload(invoice),
          xml: signedXml,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Obtener bytes del PDF
      const arrayBuffer = await response.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    } catch (error) {
      console.error('[GenericApiAdapter] Error generating PDF:', error);
      
      // Fallback: usar implementación básica si falla el proveedor
      console.log('[GenericApiAdapter] Falling back to basic PDF generation');
      const { KairuxAdapter } = await import('./kairux-adapter');
      const fallback = new KairuxAdapter();
      await fallback.initialize({ providerType: 'kairux_native', enabled: true, testMode: true });
      return fallback.generatePDF(invoice, signedXml);
    }
  }

  /**
   * Validar configuración
   */
  async validateConfig(): Promise<boolean> {
    if (!this.config) {
      return false;
    }

    if (this.config.enabled === false) {
      return false;
    }

    // Testear conexión con la API
    try {
      const response = await fetch(`${this.config.baseUrl}/health`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // ============================================
  // MÉTODOS PRIVADOS DE AYUDA
  // ============================================

  /**
   * Construir payload para la API externa
   * Puede sobrescribirse para adaptarse a proveedores específicos
   */
  protected buildPayload(invoice: ElectronicInvoice): Record<string, unknown> {
    return {
      documentType: invoice.documentType,
      issueDate: new Date(invoice.issueDate).toISOString(),
      emitter: invoice.emitter,
      receiver: invoice.receiver,
      currency: invoice.currency,
      exchangeRate: invoice.exchangeRate,
      items: invoice.items.map(item => ({
        lineNumber: item.lineNumber,
        cabysCode: item.cabysCode,
        quantity: item.quantity,
        unitOfMeasure: item.unitOfMeasure,
        unitPrice: item.unitPrice,
        discount: item.discount,
        tax: {
          type: item.taxType,
          amount: item.taxAmount,
        },
        totalAmount: item.totalAmount,
        description: item.description,
      })),
      totals: {
        subtotal: invoice.subtotal,
        totalDiscount: invoice.totalDiscount,
        taxSummary: invoice.taxSummary,
        totalAmount: invoice.totalAmount,
      },
      paymentMethod: invoice.paymentMethod,
      notes: invoice.notes,
    };
  }

  /**
   * Transformar respuesta del proveedor a formato estándar
   */
  protected transformResponse(result: Record<string, unknown>, invoice: ElectronicInvoice): BillingResponse {
    return {
      success: true,
      documentKey: result.documentKey as string || invoice.documentKey!,
      consecutiveNumber: result.consecutiveNumber as string || '',
      xmlSigned: result.xmlSigned as string || '',
      xmlHash: result.xmlHash as string || '',
      qrCode: result.qrCode as string,
      sentAt: Date.now(),
      providerReference: result.providerReference as string,
      message: result.message as string,
    };
  }

  /**
   * Mapear estado del proveedor a estado estándar
   */
  protected mapStatus(providerStatus: string): StatusResponse['status'] {
    const statusMap: Record<string, StatusResponse['status']> = {
      'pending': 'pending',
      'sent': 'sent',
      'accepted': 'accepted',
      'approved': 'accepted',
      'rejected': 'rejected',
      'cancelled': 'cancelled',
    };
    return statusMap[providerStatus.toLowerCase()] || 'pending';
  }
}
