import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { contacts } from '$lib/server/db/schema';
import { contactServices } from '$lib/server/services/contact.service';
import { eq, like, or, desc } from 'drizzle-orm';
import { z } from 'zod';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

// Schema unificado para Contactos (Cliente/Proveedor)
const contactSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().min(6, "Teléfono muy corto").optional(),
  role: z.enum(['customer', 'supplier', 'both']),
  docType: z.enum(['dni', 'dimex', 'ruc']).default('dni'),
  docNumber: z.string().min(5, "Documento inválido"),
  address: z.string().optional(),
  creditLimit: z.coerce.number().min(0).default(0),
  notes: z.string().optional()
});

export const load: PageServerLoad = async ({ locals, url }) => {
  if (!locals.user) {
    throw redirect(303, '/login');
  }

  const search = url.searchParams.get('q') || '';
  const roleFilter = url.searchParams.get('role') || 'all';

  // Construir filtros
  const whereConditions = [];
  if (search) {
    whereConditions.push(
      or(
        like(contacts.name, `%${search}%`),
        like(contacts.email, `%${search}%`),
        like(contacts.phone, `%${search}%`),
        like(contacts.docNumber, `%${search}%`)
      )
    );
  }
  
  if (roleFilter !== 'all') {
    whereConditions.push(eq(contacts.role, roleFilter as any));
  }

  const allContacts = await db.query.contacts.findMany({
    where: whereConditions.length ? and(...whereConditions) : undefined,
    orderBy: [desc(contacts.createdAt)]
  });

  const form = await superValidate(zod(contactSchema));

  return {
    contacts: allContacts,
    form,
    search,
    roleFilter
  };
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const form = await superValidate(request, zod(contactSchema));
    
    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      await contactServices.createContact({
        ...form.data,
        organizationId: locals.orgId || 'demo-org',
        createdBy: locals.user.id
      });

      return { success: true, form };
    } catch (error: any) {
      console.error("Error creating contact:", error);
      return fail(500, { form, error: error.message || "No se pudo crear el contacto" });
    }
  },

  update: async ({ request, locals }) => {
    const form = await superValidate(request, zod(contactSchema));
    
    if (!form.valid || !form.data.id) {
      return fail(400, { form });
    }

    try {
      await contactServices.updateContact(form.data.id, {
        ...form.data,
        updatedBy: locals.user.id
      });

      return { success: true, form };
    } catch (error: any) {
      console.error("Error updating contact:", error);
      return fail(500, { form, error: error.message || "No se pudo actualizar el contacto" });
    }
  },

  delete: async ({ request, locals }) => {
    const formData = await request.formData();
    const id = formData.get('id') as string;

    if (!id) {
      return fail(400, { error: "ID inválido" });
    }

    try {
      await contactServices.deleteContact(id);
      return { success: true };
    } catch (error: any) {
      console.error("Error deleting contact:", error);
      return fail(500, { error: error.message || "No se pudo eliminar el contacto" });
    }
  }
};
