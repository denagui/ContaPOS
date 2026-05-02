// @ts-nocheck
import { fail, redirect } from '@sveltejs/kit';
import { productServices } from '$lib/server/services/product.service';
import type { Actions, PageServerLoad } from './$types';

export const load = async ({ locals, url }: Parameters<PageServerLoad>[0]) => {
  if (!locals.user) throw redirect(303, '/login');

  const search = url.get('search') || '';
  const category = url.get('category') || '';
  
  const products = await productServices.getAll({
    organizationId: locals.organization.id,
    search,
    category
  });

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  return { products, categories, filters: { search, category } };
};

export const actions = {
  create: async ({ request, locals }: import('./$types').RequestEvent) => {
    const data = await request.formData();
    const name = data.get('name') as string;
    const price = parseFloat(data.get('price') as string);
    
    if (!name || !price) return fail(400, { error: 'Nombre y precio requeridos' });

    try {
      await productServices.create({
        organizationId: locals.organization.id,
        name,
        sku: data.get('sku') as string,
        barcode: data.get('barcode') as string,
        price,
        cost: parseFloat(data.get('cost') as string) || 0,
        stock: parseInt(data.get('stock') as string) || 0,
        category: data.get('category') as string,
        cabysCode: data.get('cabysCode') as string,
        taxRate: parseFloat(data.get('taxRate') as string) || 0.13,
        hasRecipe: data.get('hasRecipe') === 'on'
      });
      return { success: true };
    } catch (e) {
      return fail(500, { error: 'Error al crear' });
    }
  },
  delete: async ({ request, locals }: import('./$types').RequestEvent) => {
    const data = await request.formData();
    const id = data.get('id') as string;
    if (!id) return fail(400, { error: 'ID requerido' });
    try {
      await productServices.delete(id);
      return { success: true };
    } catch (e) {
      return fail(500, { error: 'Error al eliminar' });
    }
  }
};
;null as any as Actions;