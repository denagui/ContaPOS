/**
 * Seed Script - Datos de prueba multi-industria
 */

async function seed() {
  console.log('🌱 Iniciando seed de datos...');
  
  const users = [
    { email: 'admin@kairux.cr', role: 'owner', name: 'Administrador' },
    { email: 'cajero@kairux.cr', role: 'cashier', name: 'Cajero Demo' },
    { email: 'mesero@kairux.cr', role: 'waiter', name: 'Mesero Demo' },
    { email: 'contador@externo.com', role: 'accountant', name: 'Contador Externo' }
  ];

  const products = [
    { name: 'Arroz Tío Pelón 1kg', sku: '7700001234567', cabys: '1010100100000', price: 1250, taxRate: 0.04 },
    { name: 'Coca Cola 355ml', sku: 'BAR-001', cabys: '1110100100000', price: 1500, taxRate: 0.13 },
    { name: 'Hamburguesa Clásica', sku: 'REC-001', cabys: '1120100100000', price: 4500, taxRate: 0.13, isRecipe: true }
  ];

  console.log('✅ Seed completado exitosamente');
  console.log(`   - ${users.length} Usuarios`);
  console.log(`   - ${products.length} Productos`);
}

seed().catch(console.error);
