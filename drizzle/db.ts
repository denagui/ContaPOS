import { drizzle } from 'drizzle-orm/d1';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from './schema';

export type Database = DrizzleD1Database<typeof schema>;

export function createDb(d1: D1Database): Database {
  return drizzle(d1, { schema });
}

// Helper para obtener la DB desde el contexto de Cloudflare
export function getDb(context: any): Database {
  if (!context.env?.DB) {
    throw new Error('Database binding not found. Make sure DB is configured in wrangler.toml');
  }
  return createDb(context.env.DB);
}
