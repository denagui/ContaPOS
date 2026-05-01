import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { contacts } from '$lib/server/db/schema';
import { eq, like, or } from 'drizzle-orm';
import * as contactService from '$lib/server/services/contact.service';

export const load: PageServerLoad = async ({ locals, url }) => {
if (!locals.user) throw redirect(302, '/login');

const orgId = locals.organizationId;
if (!orgId) throw redirect(302, '/onboarding');

const page = parseInt(url.searchParams.get('page') || '1');
const search = url.searchParams.get('search') || '';
const type = url.searchParams.get('type') || 'all'; // all, customer, supplier

const result = await contactService.getContacts({
organizationId: orgId,
page,
search,
type: type as any
});

return { 
contacts: result.contacts,
pagination: result.pagination,
filters: { search, type }
};
};

export const actions: Actions = {
create: async ({ request, locals }) => {
if (!locals.user || !locals.organizationId) return fail(401, { error: 'No autorizado' });

const data = await request.formData();
const name = data.get('name') as string;
const email = data.get('email') as string;
const phone = data.get('phone') as string;
const taxId = data.get('taxId') as string;
const role = data.get('role') as 'customer' | 'supplier' | 'both';
const address = data.get('address') as string;

if (!name || !role) return fail(400, { error: 'Nombre y tipo son requeridos' });

try {
await contactService.createContact({
organizationId: locals.organizationId,
name,
email,
phone,
taxId,
role,
address
});
return { success: true };
} catch (e: any) {
return fail(500, { error: e.message || 'Error al crear contacto' });
}
},

update: async ({ request, locals }) => {
if (!locals.user || !locals.organizationId) return fail(401, { error: 'No autorizado' });

const data = await request.formData();
const id = data.get('id') as string;
const name = data.get('name') as string;
const email = data.get('email') as string;
const phone = data.get('phone') as string;
const taxId = data.get('taxId') as string;
const role = data.get('role') as 'customer' | 'supplier' | 'both';
const address = data.get('address') as string;

if (!id || !name) return fail(400, { error: 'ID y Nombre requeridos' });

try {
await contactService.updateContact(id, {
name, email, phone, taxId, role, address
});
return { success: true };
} catch (e: any) {
return fail(500, { error: e.message || 'Error al actualizar contacto' });
}
},

delete: async ({ request, locals }) => {
if (!locals.user || !locals.organizationId) return fail(401, { error: 'No autorizado' });

const data = await request.formData();
const id = data.get('id') as string;

if (!id) return fail(400, { error: 'ID requerido' });

try {
await contactService.deleteContact(id);
return { success: true };
} catch (e: any) {
return fail(500, { error: e.message || 'Error al eliminar contacto' });
}
}
};
