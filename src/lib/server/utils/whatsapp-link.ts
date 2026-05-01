interface WhatsAppMessageOptions {
phone: string; // Formato: 50688888888 (código país + número sin espacios)
organizationName: string;
ticketNumber: string;
total: number;
items: Array<{
name: string;
quantity: number;
total: number;
}>;
}

export function generateWhatsAppLink(options: WhatsAppMessageOptions): string {
const { phone, organizationName, ticketNumber, total, items } = options;

// Construir mensaje con formato
let message = `*${organizationName}*\n`;
message += `Ticket: ${ticketNumber}\n`;
message += `----------------\n`;

items.forEach(item => {
message += `${item.quantity} x ${item.name} - ₡${item.total.toFixed(2)}\n`;
});

message += `----------------\n`;
message += `*TOTAL: ₡${total.toFixed(2)}*\n`;
message += `\nGracias por su compra! 🙏`;

// Codificar para URL
const encodedMessage = encodeURIComponent(message);

return `https://wa.me/${phone}?text=${encodedMessage}`;
}

export function generatePaymentReminderLink(
phone: string, 
clientName: string, 
amount: number, 
daysOverdue: number
): string {
const message = `Hola *${clientName}*,\n\nLe recordamos que tiene un pendiente de *₡${amount.toFixed(2)}* con ${daysOverdue} días de vencido.\n\nPor favor, acérquese a cancelar o realice un SINPE al número del negocio.\n\n¡Gracias!`;

const encodedMessage = encodeURIComponent(message);
return `https://wa.me/${phone}?text=${encodedMessage}`;
}

export function validatePhoneCR(phone: string): boolean {
// Validar formato Costa Rica: 506 + 8 dígitos (móvil) o 506 + 8 dígitos (fijo)
const regex = /^506[2-8]\d{7}$/;
return regex.test(phone.replace(/\D/g, ''));
}

export function formatPhoneCR(phone: string): string {
// Limpiar y formatear: 50688888888
const cleaned = phone.replace(/\D/g, '');

if (cleaned.length === 8) {
return '506' + cleaned;
}
if (cleaned.length === 11 && cleaned.startsWith('506')) {
return cleaned;
}

return cleaned; // Retornar como está si no coincide
}
