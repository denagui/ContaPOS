// Re-exportar todo el schema desde drizzle
export * from '../../drizzle/schema';

// Tipo ContactType para compatibilidad
export type ContactType = 'customer' | 'supplier' | 'both';
