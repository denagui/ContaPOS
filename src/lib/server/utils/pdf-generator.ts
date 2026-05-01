import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { SaleWithItems } from '../services/sale.service';

export interface TicketOptions {
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
  haciendaKey?: string;
}

/**
 * Genera un ticket PDF para impresora térmica 80mm
 * Compatible con Cloudflare Workers (usa @pdf-lib en lugar de pdfkit)
 */
export async function generateTicketPDF(options: TicketOptions): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  
  // Tamaño 80mm x 200mm en puntos (1mm = 2.83 puntos)
  const page = pdfDoc.addPage([80 * 2.83, 200 * 2.83]);
  
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const { width, height } = page.getSize();
  let y = height - 20;
  const lineHeight = 12;
  const margin = 10;
  
  // Helper para centrar texto
  const drawCenteredText = (text: string, fontSize: number, fontObj = font, yPos: number) => {
    const textWidth = fontObj.widthOfString(text, { size: fontSize });
    const x = (width - textWidth) / 2;
    page.drawText(text, { x, y: yPos, size: fontSize, font: fontObj });
    return yPos - fontSize - 2;
  };
  
  // Helper para texto izquierda
  const drawLeftText = (text: string, fontSize: number, yPos: number) => {
    page.drawText(text, { x: margin, y: yPos, size: fontSize, font });
    return yPos - fontSize - 2;
  };
  
  // Helper para texto derecha
  const drawRightText = (text: string, fontSize: number, yPos: number) => {
    const textWidth = font.widthOfString(text, { size: fontSize });
    page.drawText(text, { x: width - margin - textWidth, y: yPos, size: fontSize, font });
    return yPos;
  };
  
  // Header
  y = drawCenteredText(options.organizationName, 10, fontBold, y);
  y = drawCenteredText(options.organizationTaxId, 8, font, y);
  y = drawCenteredText(options.organizationAddress, 8, font, y);
  y = drawCenteredText(options.organizationPhone, 8, font, y);
  y -= 8;
  y = drawCenteredText('-'.repeat(32), 8, font, y);
  y -= 4;
  
  // Ticket Info
  y = drawLeftText(`Ticket: ${options.ticketNumber}`, 9, y);
  y = drawLeftText(`Fecha: ${options.date}`, 9, y);
  if (options.clientName) {
    y = drawLeftText(`Cliente: ${options.clientName}`, 9, y);
  }
  if (options.haciendaKey) {
    y = drawLeftText(`Clave: ${options.haciendaKey.substring(0, 20)}...`, 7, y);
  }
  y -= 4;
  y = drawCenteredText('-'.repeat(32), 8, font, y);
  y -= 4;
  
  // Items
  for (const item of options.items) {
    const itemText = `${item.quantity} x ${item.name.substring(0, 20)}`;
    const totalText = `₡${item.total.toFixed(2)}`;
    
    y = drawLeftText(itemText, 8, y);
    drawRightText(totalText, 8, y + 10);
    y -= 4;
  }
  
  y -= 4;
  y = drawCenteredText('-'.repeat(32), 8, font, y);
  y -= 4;
  
  // Totals
  drawRightText(`Subtotal: ₡${options.subtotal.toFixed(2)}`, 9, y);
  y -= 12;
  drawRightText(`IVA: ₡${options.tax.toFixed(2)}`, 9, y);
  y -= 14;
  
  // Total en bold
  const totalText = `TOTAL: ₡${options.total.toFixed(2)}`;
  const totalWidth = fontBold.widthOfString(totalText, { size: 10 });
  page.drawText(totalText, { 
    x: width - margin - totalWidth, 
    y, 
    size: 10, 
    font: fontBold 
  });
  y -= 16;
  
  y = drawCenteredText('-'.repeat(32), 8, font, y);
  y -= 8;
  
  // Footer
  y = drawCenteredText(`Pago: ${options.paymentMethod}`, 8, font, y);
  y -= 12;
  y = drawCenteredText('¡Gracias por su compra!', 7, font, y);
  y = drawCenteredText('www.kairux.cr', 7, font, y);
  
  return await pdfDoc.save();
}

/**
 * Genera una factura electrónica formal 8.5x11
 */
export async function generateSimpleInvoice(data: {
  haciendaKey: string;
  organizationName: string;
  clientName: string;
  items: Array<{ name: string; quantity: number; price: number; total: number }>;
  subtotal: number;
  tax: number;
  total: number;
  date: string;
}): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage('LETTER');
  
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const { width, height } = page.getSize();
  let y = height - 50;
  const margin = 50;
  
  // Header
  page.drawText('FACTURA ELECTRÓNICA', { 
    x: margin, 
    y, 
    size: 16, 
    font: fontBold 
  });
  y -= 20;
  
  page.drawText(`Clave Hacienda: ${data.haciendaKey}`, { 
    x: margin, 
    y, 
    size: 9, 
    font 
  });
  y -= 30;
  
  // Info emisor
  page.drawText(data.organizationName, { x: margin, y, size: 12, font: fontBold });
  y -= 40;
  
  // Info cliente
  page.drawText(`Cliente: ${data.clientName}`, { x: margin, y, size: 10, font });
  y -= 15;
  page.drawText(`Fecha: ${data.date}`, { x: margin, y, size: 10, font });
  y -= 30;
  
  // Tabla de items (simplificada)
  let totalY = y;
  for (const item of data.items) {
    page.drawText(`${item.quantity} x ${item.name}`, { x: margin, y: totalY, size: 9, font });
    page.drawText(`₡${item.total.toFixed(2)}`, { x: width - margin - 80, y: totalY, size: 9, font });
    totalY -= 15;
  }
  
  y = totalY - 20;
  
  // Totales
  page.drawText(`Subtotal: ₡${data.subtotal.toFixed(2)}`, { 
    x: width - margin - 150, 
    y, 
    size: 10, 
    font 
  });
  y -= 15;
  
  page.drawText(`IVA: ₡${data.tax.toFixed(2)}`, { 
    x: width - margin - 150, 
    y, 
    size: 10, 
    font 
  });
  y -= 20;
  
  page.drawText(`TOTAL: ₡${data.total.toFixed(2)}`, { 
    x: width - margin - 150, 
    y, 
    size: 12, 
    font: fontBold 
  });
  
  return await pdfDoc.save();
}

