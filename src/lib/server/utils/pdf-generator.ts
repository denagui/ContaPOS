import { Page } from 'pdfkit';

interface TicketData {
  businessName: string;
  taxId: string;
  address: string;
  phone: string;
  receiptNumber: string;
  haciendaKey: string;
  date: Date;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
}

export function generateTicketPDF(data: TicketData): Buffer {
  // En entorno Cloudflare Workers, pdfkit necesita adaptación
  // Esta es una implementación base para Node.js local
  
  const doc = new Page({ margin: 40 });
  const buffers: Buffer[] = [];
  
  doc.on('data', buffers.push.bind(buffers));
  
  // Encabezado
  doc.fontSize(16).text(data.businessName, { align: 'center' });
  doc.fontSize(10).text(`RUC: ${data.taxId}`, { align: 'center' });
  doc.text(data.address, { align: 'center' });
  doc.text(`Tel: ${data.phone}`, { align: 'center' });
  doc.moveDown();
  
  // Información del ticket
  doc.fontSize(12).text(`TICKET #${data.receiptNumber}`, { align: 'center' });
  doc.fontSize(9).text(`Clave: ${data.haciendaKey}`, { align: 'center' });
  doc.text(`Fecha: ${data.date.toLocaleString()}`, { align: 'center' });
  doc.moveDown();
  
  // Línea divisoria
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(0.5);
  
  // Items
  data.items.forEach(item => {
    doc.fontSize(10).text(`${item.quantity} x ${item.description}`);
    doc.text(`${item.unitPrice.toFixed(2)} c/u`, { continued: true });
    doc.text(`₡${item.total.toFixed(2)}`, { align: 'right' });
  });
  
  doc.moveDown(0.5);
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  
  // Totales
  doc.moveDown(0.5);
  doc.fontSize(11).text(`Subtotal: ₡${data.subtotal.toFixed(2)}`, { align: 'right' });
  doc.text(`IVA: ₡${data.tax.toFixed(2)}`, { align: 'right' });
  doc.fontSize(14).text(`TOTAL: ₡${data.total.toFixed(2)}`, { align: 'right' });
  
  doc.moveDown(1);
  doc.fontSize(10).text(`Pago: ${data.paymentMethod}`, { align: 'center' });
  doc.moveDown(2);
  doc.fontSize(9).text('¡Gracias por su compra!', { align: 'center' });
  doc.text('Conserve este ticket para su garantía', { align: 'center' });
  
  doc.end();
  
  return Buffer.concat(buffers);
}

// Función alternativa para generar HTML imprimible (más compatible con Cloudflare)
export function generateTicketHTML(data: TicketData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: monospace; width: 300px; margin: 0 auto; padding: 20px; }
        .center { text-align: center; }
        .line { border-bottom: 1px dashed #000; margin: 10px 0; }
        .item { display: flex; justify-content: space-between; margin: 5px 0; }
        .total { font-weight: bold; font-size: 1.2em; }
      </style>
    </head>
    <body>
      <div class="center">
        <h3>${data.businessName}</h3>
        <p>RUC: ${data.taxId}<br>${data.address}<br>Tel: ${data.phone}</p>
      </div>
      <div class="center">
        <p><strong>TICKET #${data.receiptNumber}</strong></p>
        <p style="font-size: 0.8em">Clave: ${data.haciendaKey}</p>
        <p>${data.date.toLocaleString()}</p>
      </div>
      <div class="line"></div>
      ${data.items.map(item => `
        <div class="item">
          <span>${item.quantity} x ${item.description}</span>
          <span>₡${item.total.toFixed(2)}</span>
        </div>
      `).join('')}
      <div class="line"></div>
      <div class="item"><span>Subtotal:</span><span>₡${data.subtotal.toFixed(2)}</span></div>
      <div class="item"><span>IVA:</span><span>₡${data.tax.toFixed(2)}</span></div>
      <div class="item total"><span>TOTAL:</span><span>₡${data.total.toFixed(2)}</span></div>
      <div class="line"></div>
      <div class="center">
        <p>Pago: ${data.paymentMethod}</p>
        <p>¡Gracias por su compra!</p>
      </div>
    </body>
    </html>
  `;
}
