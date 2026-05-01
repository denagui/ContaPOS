/**
 * Export público del módulo de facturación Kairux
 */

// Tipos e interfaces
export type {
  BillingAdapter,
  BillingConfig,
  BillingProviderType,
  DocumentType,
  HaciendaStatus,
  ElectronicInvoice,
  InvoiceItem,
  TaxSummary,
  BillingResponse,
  BillingError,
  BillingResult,
  StatusResponse,
  CancellationResponse,
  BaseBillingConfig,
  KairuxConfig,
  GenericApiConfig,
  NuboxConfig,
  BillingEvent,
  BillingEventListener,
} from './types';

// Adapters
export { KairuxAdapter } from './kairux-adapter';
export { GenericApiAdapter } from './generic-api-adapter';

// Orquestador
export {
  BillingOrchestrator,
  createBillingOrchestrator,
} from './orchestrator';
