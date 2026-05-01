import { db } from '$lib/server/db';
import { contacts, type ContactType } from '$lib/server/db/schema';
import { eq, and, like, or, desc } from 'drizzle-orm';

export interface CreateContactInput {
  organizationId: string;
  name: string;
  contactType: ContactType;
  tradeName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  province?: string;
  canton?: string;
  district?: string;
  postalCode?: string;
  documentType?: 'cedula_fisica' | 'cedula_juridica' | 'dimex' | 'nite' | 'pasaporte';
  documentNumber?: string;
  creditLimit?: number;
  creditDays?: number;
  cabysCode?: string;
}

export async function createContact(input: CreateContactInput) {
  // Validar tipo de documento si existe
  if (input.documentNumber && !isValidCostaRicaDocument(input.documentNumber, input.documentType)) {
    throw new Error('Documento tributario inválido');
  }

  const [newContact] = await db.insert(contacts).values({
    organizationId: input.organizationId,
    name: input.name,
    contactType: input.contactType,
    tradeName: input.tradeName,
    email: input.email,
    phone: input.phone,
    mobile: input.mobile,
    address: input.address,
    province: input.province,
    canton: input.canton,
    district: input.district,
    postalCode: input.postalCode,
    documentType: input.documentType || 'cedula_fisica',
    documentNumber: input.documentNumber,
    creditLimit: input.creditLimit || 0,
    creditDays: input.creditDays || 0,
    cabysCode: input.cabysCode,
    active: 1,
  }).returning();

  return newContact;
}

export async function getContactsByOrganization(organizationId: string, contactType?: string, search?: string) {
  let conditions = [eq(contacts.organizationId, organizationId), eq(contacts.active, 1)];
  
  if (contactType && contactType !== 'both') {
    conditions.push(eq(contacts.contactType, contactType as ContactType));
  }
  
  if (search) {
    conditions.push(
      or(
        like(contacts.name, `%${search}%`),
        like(contacts.email, `%${search}%`),
        like(contacts.phone, `%${search}%`),
        like(contacts.documentNumber, `%${search}%`)
      )
    );
  }

  return await db.select().from(contacts)
    .where(and(...conditions))
    .orderBy(desc(contacts.createdAt));
}

export async function getContactById(id: string, organizationId: string) {
  const [contact] = await db.select().from(contacts)
    .where(and(eq(contacts.id, id), eq(contacts.organizationId, organizationId)));
  
  if (!contact) throw new Error('Contacto no encontrado');
  return contact;
}

export async function updateContact(id: string, organizationId: string, updates: Partial<CreateContactInput>) {
  if (updates.documentNumber && !isValidCostaRicaDocument(updates.documentNumber, updates.documentType)) {
    throw new Error('Documento tributario inválido');
  }

  const [updated] = await db.update(contacts)
    .set({
      ...updates,
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(contacts.id, id), eq(contacts.organizationId, organizationId)))
    .returning();

  return updated;
}

export async function deleteContact(id: string, organizationId: string) {
  // Soft delete
  await db.update(contacts)
    .set({ active: 0, updatedAt: new Date().toISOString() })
    .where(and(eq(contacts.id, id), eq(contacts.organizationId, organizationId)));
}

// Validador de documentos CR
function isValidCostaRicaDocument(documentNumber: string, documentType?: string): boolean {
  if (!documentNumber) return true;
  
  const numOnly = documentNumber.replace(/[-\s]/g, '');
  
  switch (documentType) {
    case 'cedula_fisica':
      // Cédula física: 9-10 dígitos
      return /^\d{9,10}$/.test(numOnly);
    case 'cedula_juridica':
      // Cédula jurídica: 10 dígitos empezando con 3
      return /^3\d{9}$/.test(numOnly);
    case 'dimex':
      // DIMEX: 12 dígitos
      return /^\d{12}$/.test(numOnly);
    case 'nite':
      // NITE: variable, generalmente 10-12 dígitos
      return /^\d{10,12}$/.test(numOnly);
    case 'pasaporte':
      // Pasaporte: alfanumérico, validar longitud mínima
      return numOnly.length >= 6;
    default:
      return /^\d{9,12}$/.test(numOnly);
  }
}

export async function getCustomersWithDebt(organizationId: string) {
  return await db.select().from(contacts)
    .where(and(
      eq(contacts.organizationId, organizationId),
      eq(contacts.active, 1),
      or(eq(contacts.contactType, 'customer'), eq(contacts.contactType, 'both'))
    ));
}
