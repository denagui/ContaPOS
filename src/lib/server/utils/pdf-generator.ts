import PDFDocument from 'pdfkit';
import type { SaleWithItems } from '../services/sale.service';

interface TicketOptions {
organizationName: string;
organizationTaxId: string;
organizationAddress: string;
organizationPhone: string;
ticketNumber: string;
date: string;
items: Array<{
name: string;
quantity: number;
unitPrice: number;
total: number;
}>;
subtotal: number;
tax: number;
total: number;
paymentMethod: string;
clientName?: string;
}

export function generateTicketPDF(options: TicketOptions): Buffer {
const doc = new PDFDocument({ 
size: [80 * 3.78, 200 * 3.78], // 80mm thermal printer size
margin: 5 
});

const chunks: Buffer[] = [];
doc.on('data', chunk => chunks.push(chunk));

// Header
doc.fontSize(10).text(options.organizationName, { align: 'center', bold: true });
doc.fontSize(8).text(options.organizationTaxId, { align: 'center' });
doc.fontSize(8).text(options.organizationAddress, { align: 'center' });
doc.fontSize(8).text(options.organizationPhone, { align: 'center' });
doc.moveDown(0.5);
doc.text('--------------------------------', { align: 'center' });
doc.moveDown(0.3);

// Ticket Info
doc.fontSize(9).text(`Ticket: ${options.ticketNumber}`, { align: 'left' });
doc.fontSize(9).text(`Fecha: ${options.date}`, { align: 'left' });
if (options.clientName) {
doc.fontSize(9).text(`Cliente: ${options.clientName}`, { align: 'left' });
}
doc.moveDown(0.3);
doc.text('--------------------------------', { align: 'center' });
doc.moveDown(0.3);

// Items
options.items.forEach(item => {
doc.fontSize(8).text(`${item.quantity} x ${item.name}`, { continued: true });
doc.text(`₡${item.total.toFixed(2)}`, { align: 'right' });
});

doc.moveDown(0.3);
doc.text('--------------------------------', { align: 'center' });
doc.moveDown(0.3);

// Totals
doc.fontSize(9).text(`Subtotal: ₡${options.subtotal.toFixed(2)}`, { align: 'right' });
doc.fontSize(9).text(`IVA: ₡${options.tax.toFixed(2)}`, { align: 'right' });
doc.fontSize(10).bold().text(`TOTAL: ₡${options.total.toFixed(2)}`, { align: 'right' });
doc.moveDown(0.3);
doc.text('--------------------------------', { align: 'center' });
doc.moveDown(0.3);

// Footer
doc.fontSize(8).text(`Pago: ${options.paymentMethod}`, { align: 'center' });
doc.moveDown(0.5);
doc.fontSize(7).text('¡Gracias por su compra!', { align: 'center' });
doc.fontSize(7).text('www.kairux.cr', { align: 'center' });

doc.end();

return Buffer.concat(chunks);
}

export function generateSimpleInvoice(data: any): Buffer {
// Implementación para factura formal 8.5x11
const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
const chunks: Buffer[] = [];
doc.on('data', chunk => chunks.push(chunk));

// Aquí iría la lógica completa de factura electrónica CR
// Por ahora es un placeholder
doc.fontSize(12).text('FACTURA ELECTRÓNICA', { align: 'center' });
doc.text(`Clave: ${data.haciendaKey}`, { align: 'center' });

doc.end();
return Buffer.concat(chunks);
}
