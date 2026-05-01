import { createLocalDatabase } from '$lib/server/database';

export const load = async ({ platform }) => {
	// Server-first: verificar conexión a D1
	const db = platform?.env?.DB || await createLocalDatabase();
	
	return {
		message: 'POS Cloudflare - Sistema Moderno',
		version: '1.0.0',
		features: ['POS', 'Inventario', 'CRM', 'Reportes'],
		offlineCapable: true
	};
};
