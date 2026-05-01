import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import * as contactService from '$lib/server/services/contact.service';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) throw redirect(302, '/login');
	
	const orgId = locals.organizationId;
	if (!orgId) throw redirect(302, '/onboarding');
	
	const search = url.searchParams.get('search') || '';
	const contactType = url.searchParams.get('type') || 'both'; // both, customer, supplier
	
	const contacts = await contactService.getContactsByOrganization(orgId, contactType, search);
	
	return { 
		contacts,
		filters: { search, contactType }
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.user || !locals.organizationId) return fail(401, { error: 'No autorizado' });
		
		const data = await request.formData();
		const name = data.get('name') as string;
		const contactType = data.get('contactType') as 'customer' | 'supplier' | 'both';
		const email = data.get('email') as string;
		const phone = data.get('phone') as string;
		const mobile = data.get('mobile') as string;
		const documentType = data.get('documentType') as any;
		const documentNumber = data.get('documentNumber') as string;
		const address = data.get('address') as string;
		const province = data.get('province') as string;
		const canton = data.get('canton') as string;
		const district = data.get('district') as string;
		const creditLimit = parseFloat(data.get('creditLimit') as string) || 0;
		const creditDays = parseInt(data.get('creditDays') as string) || 0;
		
		if (!name || !contactType) return fail(400, { error: 'Nombre y tipo son requeridos' });
		
		try {
			await contactService.createContact({
				organizationId: locals.organizationId,
				name,
				contactType,
				email,
				phone,
				mobile,
				documentType,
				documentNumber,
				address,
				province,
				canton,
				district,
				creditLimit,
				creditDays
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
		const contactType = data.get('contactType') as 'customer' | 'supplier' | 'both';
		const email = data.get('email') as string;
		const phone = data.get('phone') as string;
		const mobile = data.get('mobile') as string;
		const documentType = data.get('documentType') as any;
		const documentNumber = data.get('documentNumber') as string;
		const address = data.get('address') as string;
		const province = data.get('province') as string;
		const canton = data.get('canton') as string;
		const district = data.get('district') as string;
		const creditLimit = parseFloat(data.get('creditLimit') as string) || 0;
		const creditDays = parseInt(data.get('creditDays') as string) || 0;
		
		if (!id || !name) return fail(400, { error: 'ID y Nombre requeridos' });
		
		try {
			await contactService.updateContact(id, locals.organizationId, {
				name,
				contactType,
				email,
				phone,
				mobile,
				documentType,
				documentNumber,
				address,
				province,
				canton,
				district,
				creditLimit,
				creditDays
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
			await contactService.deleteContact(id, locals.organizationId);
			return { success: true };
		} catch (e: any) {
			return fail(500, { error: e.message || 'Error al eliminar contacto' });
		}
	}
};
