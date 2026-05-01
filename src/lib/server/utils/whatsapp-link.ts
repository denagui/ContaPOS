interface WhatsAppTicketData {
  businessName: string;
  receiptNumber: string;
  total: number;
  items: Array<{
    description: string;
    quantity: number;
    total: number;
  }>;
  customerPhone?: string;
}

/**
 * Genera un enlace de WhatsApp con el ticket formateado
 * Compatible con WhatsApp Business API y click-to-chat
 */
export function generateWhatsAppLink(data: WhatsAppTicketData, customerPhone?: string): string {
  const basePhone = customerPhone || '';
  
  // Formatear mensaje para WhatsApp
  const message = `
*${data.businessName}*
🧾 Ticket #${data.receiptNumber}
━━━━━━━━━━━━━━━━
${data.items.map(item => 
    `• ${item.quantity} x ${item.description}\n  ₡${item.total.toFixed(2)}`
  ).join('\n')}
━━━━━━━━━━━━━━━━
*TOTAL: ₡${data.total.toFixed(2)}*
━━━━━━━━━━━━━━━━
¡Gracias por su compra!
  `.trim();

  // Codificar para URL
  const encodedMessage = encodeURIComponent(message);
  
  // Si hay número de cliente, enviar directo. Si no, abrir chat para que elija contacto
  if (basePhone) {
    // Limpiar número (quitar +, espacios, guiones)
    const cleanPhone = basePhone.replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  }
  
  // Sin número específico: abrir WhatsApp Web/App para seleccionar contacto
  return `https://wa.me/?text=${encodedMessage}`;
}

/**
 * Versión corta para SMS o sistemas con límite de caracteres
 */
export function generateShortWhatsAppLink(data: WhatsAppTicketData, customerPhone?: string): string {
  const message = `${data.businessName} - Ticket #${data.receiptNumber}. Total: ₡${data.total.toFixed(2)}. ¡Gracias!`;
  const encodedMessage = encodeURIComponent(message);
  
  if (customerPhone) {
    const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  }
  
  return `https://wa.me/?text=${encodedMessage}`;
}

/**
 * Verifica si un número de teléfono es válido para WhatsApp
 * Soporta formatos de Costa Rica (+506) y internacionales
 */
export function isValidWhatsAppPhone(phone: string): boolean {
  // Limpiar formato
  const clean = phone.replace(/[^0-9+]/g, '');
  
  // Patrón básico: debe tener al menos 8 dígitos
  const digits = clean.replace(/\D/g, '');
  if (digits.length < 8) return false;
  
  // Si comienza con +, validar formato internacional
  if (clean.startsWith('+')) {
    return /^\+\d{8,15}$/.test(clean);
  }
  
  // Número local (asumir Costa Rica si tiene 8 dígitos)
  if (digits.length === 8) {
    return /^[2-8]\d{7}$/.test(digits); // Números válidos de CR
  }
  
  return true; // Aceptar otros formatos internacionales
}

/**
 * Formatea número de teléfono para mostrar en UI
 */
export function formatPhoneForDisplay(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  
  // Formato Costa Rica: 8888-8888
  if (clean.length === 8) {
    return `${clean.slice(0, 4)}-${clean.slice(4)}`;
  }
  
  // Formato internacional con código de país
  if (clean.length > 8) {
    return `+${clean.slice(0, 3)} ${clean.slice(3)}`;
  }
  
  return phone;
}
