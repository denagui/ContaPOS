/**
 * BillingOrchestrator - Orquestador del Sistema de Facturación Kairux
 * 
 * Este componente es el corazón del sistema de facturación. Se encarga de:
 * 1. Leer la configuración de facturación de la organización
 * 2. Seleccionar e inicializar el adapter correcto según el proveedor configurado
 * 3. Ejecutar las operaciones de facturación (enviar, consultar, cancelar)
 * 4. Gestionar eventos y notificaciones
 * 
 * Patrón: Factory + Strategy
 */

import type { Database } from '$lib/server/db';
import { companySettings, contacts, companies } from '$lib/server/db';
import { eq, and } from 'drizzle-orm';
import type {
  BillingAdapter,
  BillingConfig,
  ElectronicInvoice,
  BillingResponse,
  BillingError,
  StatusResponse,
  CancellationResponse,
  BillingProviderType,
  BillingEvent,
  BillingEventListener,
} from './types';
import { KairuxAdapter } from './kairux-adapter';
import { GenericApiAdapter } from './generic-api-adapter';

export class BillingOrchestrator {
  private adapter: BillingAdapter | null = null;
  private adapterType: BillingProviderType | null = null;
  private eventListeners: BillingEventListener[] = [];

  constructor(
    private db: Database,
    private organizationId: string
  ) {}

  /**
   * Inicializar el orquestador cargando la configuración de la organización
   * y creando el adapter correspondiente
   */
  async initialize(): Promise<void> {
    // 1. Cargar configuración de facturación de la organización
    const config = await this.loadBillingConfig();

    if (!config || !config.enabled) {
      console.log('[BillingOrchestrator] Billing not configured for this organization');
      return;
    }

    // 2. Crear el adapter según el tipo de proveedor
    this.adapter = await this.createAdapter(config);
    this.adapterType = config.providerType;

    // 3. Inicializar el adapter
    await this.adapter.initialize(config as Record<string, unknown>);

    console.log(`[BillingOrchestrator] Initialized with provider: ${this.adapter.providerName}`);
  }

  /**
   * Enviar un comprobante electrónico a facturación
   * Este es el método principal que se llama desde el servicio de ventas
   */
  async sendInvoice(invoice: ElectronicInvoice): Promise<BillingResponse | BillingError> {
    if (!this.adapter) {
      await this.initialize();
      
      if (!this.adapter) {
        return {
          success: false,
          errorCode: 'NOT_CONFIGURED',
          message: 'Billing system not configured for this organization',
        };
      }
    }

    try {
      // Validar datos básicos de la factura
      this.validateInvoice(invoice);

      // Enviar al adapter
      const result = await this.adapter.sendDocument(invoice);

      // Emitir evento
      this.emitEvent({
        type: result.success ? 'document_sent' : 'error',
        documentKey: result.success ? result.documentKey : 'unknown',
        timestamp: Date.now(),
        data: result,
      });

      return result;
    } catch (error) {
      console.error('[BillingOrchestrator] Error sending invoice:', error);
      
      this.emitEvent({
        type: 'error',
        documentKey: invoice.documentKey || 'unknown',
        timestamp: Date.now(),
        data: { error },
      });

      return {
        success: false,
        errorCode: 'ORCHESTRATOR_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Consultar el estado de un documento
   */
  async checkStatus(documentKey: string): Promise<StatusResponse> {
    if (!this.adapter) {
      await this.initialize();
    }

    if (!this.adapter) {
      throw new Error('Billing system not initialized');
    }

    return await this.adapter.checkStatus(documentKey);
  }

  /**
   * Cancelar un documento electrónico
   */
  async cancelDocument(documentKey: string, reason: string): Promise<CancellationResponse> {
    if (!this.adapter) {
      await this.initialize();
    }

    if (!this.adapter) {
      return {
        success: false,
        documentKey,
        status: 'pending',
        message: 'Billing system not configured',
      };
    }

    const result = await this.adapter.cancelDocument(documentKey, reason);

    if (result.success) {
      this.emitEvent({
        type: 'status_changed',
        documentKey,
        timestamp: Date.now(),
        data: { status: 'cancelled' },
      });
    }

    return result;
  }

  /**
   * Generar PDF de un comprobante
   */
  async generatePDF(invoice: ElectronicInvoice, signedXml?: string): Promise<Uint8Array> {
    if (!this.adapter) {
      await this.initialize();
    }

    if (!this.adapter) {
      throw new Error('Billing system not initialized');
    }

    return await this.adapter.generatePDF(invoice, signedXml);
  }

  /**
   * Verificar si el sistema de facturación está configurado y activo
   */
  async isConfigured(): Promise<boolean> {
    if (this.adapter && this.adapterType) {
      return await this.adapter.validateConfig();
    }

    try {
      await this.initialize();
      return !!this.adapter;
    } catch {
      return false;
    }
  }

  /**
   * Obtener información del proveedor configurado
   */
  getProviderInfo(): { name: string; type: BillingProviderType } | null {
    if (!this.adapter) {
      return null;
    }

    return {
      name: this.adapter.providerName,
      type: this.adapterType!,
    };
  }

  /**
   * Suscribirse a eventos de facturación
   */
  subscribe(listener: BillingEventListener): () => void {
    this.eventListeners.push(listener);

    // Retornar función para desuscribirse
    return () => {
      this.eventListeners = this.eventListeners.filter(l => l !== listener);
    };
  }

  /**
   * Resetear el adapter (útil para testing o recargar configuración)
   */
  reset(): void {
    this.adapter = null;
    this.adapterType = null;
  }

  // ============================================
  // MÉTODOS PRIVADOS
  // ============================================

  /**
   * Cargar configuración de facturación desde la base de datos
   */
  private async loadBillingConfig(): Promise<BillingConfig | null> {
    try {
      const settings = await this.db
        .select()
        .from(companySettings)
        .where(
          and(
            eq(companySettings.companyId, this.organizationId),
            eq(companySettings.settingKey, 'billingConfig')
          )
        )
        .limit(1);

      if (!settings.length) {
        return null;
      }

      const setting = settings[0];
      
      // Parsear JSON de configuración
      const config = JSON.parse(setting.settingValue) as BillingConfig;
      
      return config;
    } catch (error) {
      console.error('[BillingOrchestrator] Error loading billing config:', error);
      return null;
    }
  }

  /**
   * Factory method para crear el adapter correcto según configuración
   */
  private async createAdapter(config: BillingConfig): Promise<BillingAdapter> {
    switch (config.providerType) {
      case 'kairux_native':
        return new KairuxAdapter();
      
      case 'generic_api':
        return new GenericApiAdapter();
      
      case 'nubox':
        // Nubox usa GenericApiAdapter con configuración específica
        return new GenericApiAdapter();
      
      case 'facturate':
        // Facturate.cr también usa GenericApiAdapter
        return new GenericApiAdapter();
      
      case 'hacienda_direct':
        // Conexión directa a Hacienda (futuro)
        console.warn('[BillingOrchestrator] hacienda_direct not yet implemented, using kairux_native');
        return new KairuxAdapter();
      
      default:
        throw new Error(`Unknown billing provider type: ${(config as BillingConfig).providerType}`);
    }
  }

  /**
   * Validar datos básicos de una factura antes de enviarla
   */
  private validateInvoice(invoice: ElectronicInvoice): void {
    // Validar emisor
    if (!invoice.emitter.taxId || !invoice.emitter.name) {
      throw new Error('Invalid emitter data: taxId and name are required');
    }

    if (!invoice.emitter.address.line1 || !invoice.emitter.address.city) {
      throw new Error('Invalid emitter address: line1 and city are required');
    }

    // Validar items
    if (!invoice.items || invoice.items.length === 0) {
      throw new Error('Invoice must have at least one item');
    }

    // Validar totales
    if (invoice.totalAmount <= 0) {
      throw new Error('Invalid total amount');
    }

    // Validar fecha
    if (!invoice.issueDate || invoice.issueDate <= 0) {
      throw new Error('Invalid issue date');
    }
  }

  /**
   * Emitir evento a todos los listeners
   */
  private emitEvent(event: BillingEvent): void {
    for (const listener of this.eventListeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('[BillingOrchestrator] Error in event listener:', error);
      }
    }
  }

  /**
   * Obtener datos de la organización para construir facturas
   */
  async getOrganizationData(): Promise<{
    id: string;
    name: string;
    taxId: string | null;
    legalName: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
  } | null> {
    const orgs = await this.db
      .select()
      .from(companies)
      .where(eq(companies.id, this.organizationId))
      .limit(1);

      if (!orgs.length) {
        return null;
      }

      const org = orgs[0];
      return {
        id: org.id,
        name: org.name,
        taxId: org.taxId,
        legalName: org.legalName,
      address: org.address,
      phone: org.phone,
      email: org.email,
    };
  }

  /**
   * Obtener datos de un contacto (cliente) para facturar
   */
  async getContactData(contactId: string): Promise<{
    id: string;
    name: string;
    taxId: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    province: string | null;
  } | null> {
    const results = await this.db
      .select()
      .from(contacts)
      .where(
        and(
          eq(contacts.id, contactId),
          eq(contacts.companyId, this.organizationId)
        )
      )
      .limit(1);

    if (!results.length) {
      return null;
    }

    const contact = results[0];
    return {
      id: contact.id,
      name: contact.name,
      taxId: contact.documentNumber,
      email: contact.email,
      phone: contact.phone,
      address: contact.address,
      province: contact.province,
    };
  }
}

/**
 * Factory function para crear una instancia del orquestador
 */
export function createBillingOrchestrator(db: Database, organizationId: string): BillingOrchestrator {
  return new BillingOrchestrator(db, organizationId);
}
