/**
 * Configuración Fiscal - Server Side
 * Manejo de configuración de proveedores de facturación electrónica
 */

import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { organizationSettings } from '$lib/server/db';
import { eq, and } from 'drizzle-orm';
import type { BillingConfig, BillingProviderType } from '$lib/server/services/billing/types';
import { createBillingOrchestrator } from '$lib/server/services/billing';

export const load: PageServerLoad = async ({ locals, db }) => {
  // Verificar autenticación
  if (!locals.user) {
    throw redirect(302, '/login');
  }

  const organizationId = locals.user.organizationId;

  // Cargar configuración actual de facturación
  try {
    const settings = await db
      .select()
      .from(organizationSettings)
      .where(
        and(
          eq(organizationSettings.organizationId, organizationId),
          eq(organizationSettings.settingKey, 'billingConfig')
        )
      )
      .limit(1);

    let currentConfig: BillingConfig | null = null;
    if (settings.length > 0) {
      currentConfig = JSON.parse(settings[0].settingValue) as BillingConfig;
    }

    // Verificar si el sistema está configurado y activo
    let isConfigured = false;
    let providerName = '';
    
    if (currentConfig) {
      const orchestrator = createBillingOrchestrator(db, organizationId);
      isConfigured = await orchestrator.isConfigured();
      const providerInfo = orchestrator.getProviderInfo();
      if (providerInfo) {
        providerName = providerInfo.name;
      }
    }

    return {
      currentConfig,
      isConfigured,
      providerName,
      providers: [
        { 
          id: 'kairux_native', 
          name: 'Kairux Native (Motor Propio)', 
          description: 'Solución nativa de Kairux. Ideal para empezar rápidamente.',
          requiresCertificate: false
        },
        { 
          id: 'generic_api', 
          name: 'API Genérica', 
          description: 'Conecta con cualquier proveedor que tenga API REST (Nubox, Facturate, etc.)',
          requiresCertificate: false
        },
        { 
          id: 'nubox', 
          name: 'Nubox Costa Rica', 
          description: 'Proveedor externo popular en Costa Rica',
          requiresCertificate: false
        },
      ],
    };
  } catch (error) {
    console.error('[Billing Settings] Error loading config:', error);
    return {
      currentConfig: null,
      isConfigured: false,
      providerName: '',
      providers: [],
      error: 'Error cargando configuración',
    };
  }
};

export const actions: Actions = {
  // Guardar configuración de facturación
  save: async ({ request, locals, db }) => {
    if (!locals.user) {
      return fail(401, { error: 'No autorizado' });
    }

    const organizationId = locals.user.organizationId;
    const formData = await request.formData();
    
    const providerType = formData.get('providerType') as BillingProviderType;
    const enabled = formData.get('enabled') === 'on';
    const testMode = formData.get('testMode') === 'on';

    if (!providerType) {
      return fail(400, { error: 'Debe seleccionar un proveedor' });
    }

    // Construir configuración según el tipo de proveedor
    let config: BillingConfig;

    switch (providerType) {
      case 'kairux_native':
        config = {
          providerType: 'kairux_native',
          enabled,
          testMode,
          certificatePath: formData.get('certificatePath') as string || undefined,
          privateKey: formData.get('privateKey') as string || undefined,
        };
        break;

      case 'generic_api':
      case 'nubox':
        const baseUrl = formData.get('baseUrl') as string;
        const apiKey = formData.get('apiKey') as string;
        
        if (!baseUrl || !apiKey) {
          return fail(400, { 
            error: 'URL base y API Key son requeridos',
            fields: { baseUrl, apiKey }
          });
        }

        config = {
          providerType: providerType === 'nubox' ? 'nubox' : 'generic_api',
          enabled,
          testMode,
          baseUrl,
          apiKey,
          apiSecret: formData.get('apiSecret') as string || undefined,
          timeout: parseInt(formData.get('timeout') as string) || 30000,
          environment: providerType === 'nubox' 
            ? (formData.get('environment') as 'sandbox' | 'production') || 'sandbox'
            : undefined,
        };
        break;

      default:
        return fail(400, { error: 'Tipo de proveedor no válido' });
    }

    try {
      // Guardar o actualizar configuración en la BD
      await db
        .insert(organizationSettings)
        .values({
          id: `billing_${organizationId}`,
          organizationId,
          settingKey: 'billingConfig',
          settingValue: JSON.stringify(config),
          updatedAt: Date.now(),
        })
        .onConflictDoUpdate({
          target: [organizationSettings.organizationId, organizationSettings.settingKey],
          set: {
            settingValue: JSON.stringify(config),
            updatedAt: Date.now(),
          },
        });

      return {
        success: true,
        message: 'Configuración guardada exitosamente',
        config,
      };
    } catch (error) {
      console.error('[Billing Settings] Error saving config:', error);
      return fail(500, { error: 'Error guardando configuración' });
    }
  },

  // Probar conexión con el proveedor
  testConnection: async ({ request, locals, db }) => {
    if (!locals.user) {
      return fail(401, { error: 'No autorizado' });
    }

    const organizationId = locals.user.organizationId;
    const formData = await request.formData();
    
    const providerType = formData.get('providerType') as BillingProviderType;

    try {
      // Crear orquestador temporal con la configuración proporcionada
      const orchestrator = createBillingOrchestrator(db, organizationId);
      
      // Intentar validar configuración
      const isValid = await orchestrator.isConfigured();

      if (isValid) {
        return {
          success: true,
          message: 'Conexión exitosa. El proveedor está configurado correctamente.',
        };
      } else {
        return fail(400, { 
          error: 'La configuración no es válida o el proveedor no responde',
        });
      }
    } catch (error) {
      console.error('[Billing Settings] Error testing connection:', error);
      return fail(500, { 
        error: 'Error probando conexión',
        details: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  },

  // Eliminar configuración
  delete: async ({ locals, db }) => {
    if (!locals.user) {
      return fail(401, { error: 'No autorizado' });
    }

    const organizationId = locals.user.organizationId;

    try {
      await db
        .delete(organizationSettings)
        .where(
          and(
            eq(organizationSettings.organizationId, organizationId),
            eq(organizationSettings.settingKey, 'billingConfig')
          )
        );

      return {
        success: true,
        message: 'Configuración eliminada exitosamente',
      };
    } catch (error) {
      console.error('[Billing Settings] Error deleting config:', error);
      return fail(500, { error: 'Error eliminando configuración' });
    }
  },
};
