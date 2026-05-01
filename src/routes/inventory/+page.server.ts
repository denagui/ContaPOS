import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { products, categories, suppliers } from '$lib/server/db/schema';
import { productServices } from '$lib/server/services/product.service';
import { eq, like, or, desc } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';

// Schema para validación de formulario
const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "El nombre es requerido"),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  cabysCode: z.string().length(13, "CABYS debe tener 13 dígitos").optional().or(z.literal("")),
  price: z.coerce.number().min(0, "El precio no puede ser negativo"),
  cost: z.coerce.number().min(0, "El costo no puede ser negativo"),
  stock: z.coerce.number().min(0, "El stock no puede ser negativo"),
  categoryId: z.string().optional(),
  supplierId: z.string().optional(),
  taxRate: z.coerce.number().min(0).max(100),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  recipeJson: z.string().optional() // JSON string for recipes
});

export const load: PageServerLoad = async ({ locals, url }) => {
  // Seguridad: Verificar sesión (mock por ahora)
  if (!locals.user) {
    throw redirect(303, '/login');
  }

  const search = url.searchParams.get('q') || '';
  const category = url.searchParams.get('cat') || '';
  
  // Obtener productos con filtros
  const whereConditions = [];
  if (search) {
    whereConditions.push(
      or(
        like(products.name, `%${search}%`),
        like(products.sku, `%${search}%`),
        like(products.barcode, `%${search}%`)
      )
    );
  }
  
  // Nota: En producción, filtrar por organization_id usando locals.orgId
  const allProducts = await db.query.products.findMany({
    where: whereConditions.length ? and(...whereConditions) : undefined,
    with: {
      category: true,
      supplier: true
    },
    orderBy: [desc(products.createdAt)]
  });

  // Obtener categorías y proveedores para los selects
  const allCategories = await db.query.categories.findMany();
  const allSuppliers = await db.query.suppliers.findMany();

  const form = await superValidate(zod(productSchema));

  return {
    products: allProducts,
    categories: allCategories,
    suppliers: allSuppliers,
    form,
    search,
    category
  };
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const form = await superValidate(request, zod(productSchema));
    
    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      // Validar CABYS si existe
      if (form.data.cabysCode && form.data.cabysCode.length !== 13) {
        return fail(400, { form, error: "El código CABYS debe tener 13 dígitos" });
      }

      await productServices.createProduct({
        ...form.data,
        organizationId: locals.orgId || 'demo-org', // Mock org ID
        createdBy: locals.user.id
      });

      return { success: true, form };
    } catch (error) {
      console.error("Error creating product:", error);
      return fail(500, { form, error: "No se pudo crear el producto" });
    }
  },

  update: async ({ request, locals }) => {
    const form = await superValidate(request, zod(productSchema));
    
    if (!form.valid || !form.data.id) {
      return fail(400, { form });
    }

    try {
      await productServices.updateProduct(form.data.id, {
        ...form.data,
        updatedBy: locals.user.id
      });

      return { success: true, form };
    } catch (error) {
      console.error("Error updating product:", error);
      return fail(500, { form, error: "No se pudo actualizar el producto" });
    }
  },

  delete: async ({ request, locals }) => {
    const formData = await request.formData();
    const id = formData.get('id') as string;

    if (!id) {
      return fail(400, { error: "ID inválido" });
    }

    try {
      await productServices.deleteProduct(id);
      return { success: true };
    } catch (error) {
      console.error("Error deleting product:", error);
      return fail(500, { error: "No se pudo eliminar el producto" });
    }
  }
};
