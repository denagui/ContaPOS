import { db } from '$lib/server/db';
import { contacts } from '$lib/server/db/schema';
import { eq, and, like, or } from 'drizzle-orm';

export type ContactRole = 'customer' | 'supplier' | 'both';

export interface CreateContactInput {
  organizationId: string;
  name: string;
  role: ContactRole;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string; // RUC/DNI/CPJ
  creditLimit?: number;
}

export async function createContact(input: CreateContactInput) {
  // Validar tipo de documento si existe
  if (input.taxId && !isValidCostaRicaTaxId(input.taxId)) {
    throw new Error('Documento tributario inválido');
  }

  const [newContact] = await db.insert(contacts).values({
    organizationId: input.organizationId,
    name: input.name,
    role: input.role,
    email: input.email,
    phone: input.phone,
    address: input.address,
    taxId: input.taxId,
    creditLimit: input.creditLimit || 0,
  }).returning();

  return newContact;
}

export async function getContactsByOrganization(organizationId: string, role?: ContactRole, search?: string) {
  let conditions = [eq(contacts.organizationId, organizationId)];
  
  if (role && role !== 'both') {
    conditions.push(eq(contacts.role, role));
  }
  
  if (search) {
    conditions.push(
      or(
        like(contacts.name, `%${search}%`),
        like(contacts.email, `%${search}%`),
        like(contacts.phone, `%${search}%`),
        like(contacts.taxId, `%${search}%`)
      )
    );
  }

  return await db.select().from(contacts)
    .where(and(...conditions));
}

export async function getContactById(id: number, organizationId: string) {
  const [contact] = await db.select().from(contacts)
    .where(and(eq(contacts.id, id), eq(contacts.organizationId, organizationId)));
  
  if (!contact) throw new Error('Contacto no encontrado');
  return contact;
}

export async function updateContact(id: number, organizationId: string, updates: Partial<CreateContactInput>) {
  if (updates.taxId && !isValidCostaRicaTaxId(updates.taxId)) {
    throw new Error('Documento tributario inválido');
  }

  const [updated] = await db.update(contacts)
    .set(updates)
    .where(and(eq(contacts.id, id), eq(contacts.organizationId, organizationId)))
    .returning();

  return updated;
}

export async function deleteContact(id: number, organizationId: string) {
  await db.delete(contacts)
    .where(and(eq(contacts.id, id), eq(contacts.organizationId, organizationId)));
}

// Validador simple de documentos CR
function isValidCostaRicaTaxId(taxId: string): boolean {
  // DNI: 9-10 dígitos, RUC: 12 dígitos, CPJ: 10 dígitos empezando con 3
  const dniRegex = /^\d{9,10}$/;
  const rucRegex = /^\d{12}$/;
  const cpjRegex = /^3\d{9}$/;
  
  return dniRegex.test(taxId) || rucRegex.test(taxId) || cpjRegex.test(taxId);
}

export async function getCustomersWithDebt(organizationId: string) {
  // Esta consulta requiere join con sales, se puede implementar después
  // Por ahora retornamos todos los clientes
  return await db.select().from(contacts)
    .where(and(
      eq(contacts.organizationId, organizationId),
      or(eq(contacts.role, 'customer'), eq(contacts.role, 'both'))
    ));
}
