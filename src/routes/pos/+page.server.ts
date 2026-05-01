import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { products, sales, saleItems, inventoryMovements, organizations } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { generateHaciendaKey } from '$lib/server/utils/hacienda-key';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
if (!locals.user) {
throw redirect(303, '/login');
}

const orgId = locals.organizationId;
if (!orgId) throw redirect(303, '/settings');

// Obtener productos activos de la organización
const activeProducts = await db.query.products.findMany({
where: and(eq(products.organizationId, orgId), eq(products.active, true)),
orderBy: (products, { asc }) => [asc(products.name)]
});

// Obtener clientes para el selector de fiado
const customers = await db.query.contacts.findMany({
where: and(eq(contacts.organizationId, orgId), eq(contacts.role, 'customer')),
orderBy: (contacts, { asc }) => [asc(contacts.name)]
});

return {
products: activeProducts,
customers,
user: locals.user
};
};

export const actions: Actions = {
createSale: async ({ request, locals }) => {
if (!locals.user || !locals.organizationId) {
return fail(401, { error: 'No autorizado' });
}

const data = await request.formData();
const itemsJson = data.get('items');
const customerId = data.get('customerId');
const paymentMethod = data.get('paymentMethod');
const totalAmount = parseFloat(data.get('totalAmount') as string);
const taxAmount = parseFloat(data.get('taxAmount') as string);

if (!itemsJson) return fail(400, { error: 'No hay items en la venta' });

const items = JSON.parse(itemsJson as string);
if (!Array.isArray(items) || items.length === 0) {
return fail(400, { error: 'La venta debe tener al menos un producto' });
}

const orgId = locals.organizationId;
const userId = locals.user.id;

// Generar Clave de Hacienda única
const haciendaKey = generateHaciendaKey(orgId); // Implementar lógica real según specs

try {
// 1. Crear la venta principal
const [newSale] = await db.insert(sales).values({
organizationId: orgId,
userId,
customerId: customerId ? parseInt(customerId as string) : null,
haciendaKey,
totalAmount,
taxAmount,
paymentMethod: paymentMethod as string,
status: 'completed',
createdAt: new Date()
}).returning();

// 2. Procesar cada item
for (const item of items) {
const product = await db.query.products.findFirst({
where: eq(products.id, item.productId)
});

if (!product) continue;

// Insertar item de venta
await db.insert(saleItems).values({
saleId: newSale.id,
productId: product.id,
quantity: item.quantity,
unitPrice: item.price,
totalPrice: item.quantity * item.price,
taxRate: product.taxRate || 13
});

// Actualizar Stock
const newStock = (product.stock || 0) - item.quantity;
await db.update(products)
.set({ stock: newStock })
.where(eq(products.id, product.id));

// Registrar movimiento de inventario
await db.insert(inventoryMovements).values({
productId: product.id,
organizationId: orgId,
quantity: -item.quantity,
type: 'sale',
referenceId: newSale.id,
reason: `Venta #${newSale.id}`,
createdAt: new Date()
});
}

return { success: true, saleId: newSale.id, haciendaKey };

} catch (error) {
console.error('Error creando venta:', error);
return fail(500, { error: 'Error interno al procesar la venta' });
}
}
};
