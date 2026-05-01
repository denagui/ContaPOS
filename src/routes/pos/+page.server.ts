import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { products, contacts } from '$lib/server/db/schema';
import { saleServices } from '$lib/server/services/sale.service';
import { productServices } from '$lib/server/services/product.service';
import { desc, like, or, eq } from 'drizzle-orm';
import { z } from 'zod';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

// Schema para procesar venta
const saleSchema = z.object({
  customerId: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().min(1),
    price: z.number().min(0),
    discount: z.number().min(0).default(0)
  })),
  paymentMethod: z.enum(['cash', 'card', 'transfer', 'sinpe', 'credit']),
  notes: z.string().optional()
});

export const load: PageServerLoad = async ({ locals, url }) => {
  if (!locals.user) {
    throw redirect(303, '/login');
  }

  const search = url.searchParams.get('q') || '';
  
  // Obtener productos activos para el grid del POS
  const whereConditions = [eq(products.isActive, true)];
  if (search) {
    whereConditions.push(
      or(
        like(products.name, `%${search}%`),
        like(products.sku, `%${search}%`),
        like(products.barcode, `%${search}%`)
      )
    );
  }

  const availableProducts = await db.query.products.findMany({
    where: whereConditions.length ? and(...whereConditions) : undefined,
    columns: {
      id: true,
      name: true,
      price: true,
      stock: true,
      barcode: true,
      sku: true,
      taxRate: true,
      hasRecipe: true
    },
    limit: 50 // Limitar para rendimiento en móvil
  });

  // Obtener clientes para selector rápido
  const customers = await db.query.contacts.findMany({
    where: eq(contacts.role, 'customer'),
    columns: {
      id: true,
      name: true,
      email: true,
      phone: true
    },
    limit: 100
  });

  // Últimas ventas del día para referencia rápida
  const recentSales = await db.query.sales.findMany({
    limit: 5,
    orderBy: [desc(sales.createdAt)],
    columns: {
      id: true,
      total: true,
      paymentMethod: true,
      createdAt: true
    }
  });

  const form = await superValidate(zod(saleSchema));

  return {
    products: availableProducts,
    customers,
    recentSales,
    form,
    search
  };
};

export const actions: Actions = {
  processSale: async ({ request, locals }) => {
    const formData = await request.formData();
    
    // Parsear items del carrito (viene como JSON string desde el form)
    const itemsJson = formData.get('items') as string;
    const items = JSON.parse(itemsJson || '[]');
    
    const customerId = formData.get('customerId') as string | undefined;
    const paymentMethod = formData.get('paymentMethod') as any;
    const notes = formData.get('notes') as string | undefined;

    if (!items || items.length === 0) {
      return fail(400, { error: "El carrito está vacío" });
    }

    try {
      // Validar stock antes de vender
      for (const item of items) {
        const product = await productServices.getProduct(item.productId);
        if (!product) {
          return fail(400, { error: `Producto no encontrado: ${item.productId}` });
        }
        if (product.stock < item.quantity && !product.hasRecipe) {
          return fail(400, { 
            error: `Stock insuficiente para ${product.name}. Disponible: ${product.stock}` 
          });
        }
      }

      // Procesar venta
      const sale = await saleServices.createSale({
        organizationId: locals.orgId || 'demo-org',
        userId: locals.user.id,
        customerId: customerId || null,
        items: items.map((i: any) => ({
          productId: i.productId,
          quantity: i.quantity,
          price: i.price,
          discount: i.discount || 0
        })),
        paymentMethod: paymentMethod,
        notes: notes,
        isCredit: paymentMethod === 'credit'
      });

      return { 
        success: true, 
        saleId: sale.id,
        haciendaKey: sale.haciendaKey,
        total: sale.total
      };
    } catch (error: any) {
      console.error("Error processing sale:", error);
      return fail(500, { error: error.message || "Error al procesar la venta" });
    }
  },

  // Acción para verificar stock en tiempo real (AJAX)
  checkStock: async ({ request }) => {
    const formData = await request.formData();
    const productId = formData.get('productId') as string;
    const quantity = parseInt(formData.get('quantity') as string);

    try {
      const product = await productServices.getProduct(productId);
      if (!product) {
        return { valid: false, message: "Producto no encontrado" };
      }
      
      const hasStock = product.stock >= quantity || product.hasRecipe;
      return { 
        valid: hasStock, 
        stock: product.stock,
        message: hasStock ? "Stock disponible" : `Solo quedan ${product.stock} unidades`
      };
    } catch (error) {
      return { valid: false, message: "Error verificando stock" };
    }
  }
};
