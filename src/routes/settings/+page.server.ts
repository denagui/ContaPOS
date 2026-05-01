import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { organizationService } from '$lib/server/services/organization.service';
import { getScope } from '$lib/server/db';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(303, '/login');
  }

  const scope = getScope(locals.user);
  
  // Cargar configuración actual de la organización
  const settings = await organizationService.getSettings(scope.organizationId);

  return {
    settings,
    user: locals.user
  };
};

export const actions: Actions = {
  updateSettings: async ({ request, locals }) => {
    const scope = getScope(locals.user);
    const data = await request.formData();

    try {
      const settingsData = {
        industryType: data.get('industryType') as string,
        currency: data.get('currency') as string,
        taxId: data.get('taxId') as string | null,
        businessName: data.get('businessName') as string | null,
        address: data.get('address') as string | null,
        phone: data.get('phone') as string | null,
        email: data.get('email') as string | null,
        logoUrl: data.get('logoUrl') as string | null,
        // Feature Flags según industria
        enableTables: data.get('enableTables') === 'on',
        enableRecipes: data.get('enableRecipes') === 'on',
        enableMeters: data.get('enableMeters') === 'on',
        enableCredit: data.get('enableCredit') === 'on',
        enableInvoicing: data.get('enableInvoicing') === 'on'
      };

      await organizationService.updateSettings(scope.organizationId, settingsData);

      return { success: true };
    } catch (error) {
      console.error('Error updating settings:', error);
      return fail(400, { error: 'Failed to update settings', message: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
};
