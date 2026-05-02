// @ts-nocheck
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { organizationSettings, organizations } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load = async ({ locals }: Parameters<PageServerLoad>[0]) => {
if (!locals.user) throw redirect(302, '/login');

const orgId = locals.organizationId;
if (!orgId) throw redirect(302, '/onboarding');

const settings = await db.query.organizationSettings.findFirst({
where: eq(organizationSettings.organizationId, orgId)
});

return { 
settings: settings || null,
industries: [
{ value: 'retail', label: 'Pulpería / Tienda' },
{ value: 'restaurant', label: 'Restaurante / Bar / Soda' },
{ value: 'services', label: 'Servicios Profesionales' },
{ value: 'utility', label: 'ASADA / Servicios Públicos' }
]
};
};

export const actions = {
update: async ({ request, locals }: import('./$types').RequestEvent) => {
if (!locals.user || !locals.organizationId) return fail(401, { error: 'No autorizado' });

const data = await request.formData();
const industry = data.get('industry') as string;
const currency = data.get('currency') as string;
const taxId = data.get('taxId') as string;

// Feature Flags dinámicos según industria
const flags: any = {
hasTables: industry === 'restaurant',
hasRecipes: industry === 'restaurant',
hasMeters: industry === 'utility',
hasProjects: industry === 'services',
hasLoyalty: industry === 'retail' || industry === 'restaurant',
hasExpenses: true // Todos lo necesitan
};

try {
await db.insert(organizationSettings)
.values({
organizationId: locals.organizationId,
industry,
currency,
taxId,
...flags
})
.onConflictDoUpdate({
target: organizationSettings.organizationId,
set: { industry, currency, taxId, ...flags }
});

return { success: true };
} catch (e) {
console.error('Error guardando configuración:', e);
return fail(500, { error: 'Error al guardar configuración' });
}
}
};
;null as any as Actions;