/**
 * API Endpoint: Generar Ticket/Comprobante PDF
 * GET /api/sales/[id]/ticket
 * 
 * Genera un PDF del comprobante de venta usando pdf-lib
 * Compatible con Cloudflare Workers
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sales, saleItems, products, organizations } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { createBillingOrchestrator } from '$lib/server/services/billing';

export const GET: RequestHandler = async ({ params, locals, db }) => {
  try {
    const saleId = params.id;

    if (!saleId) {
      throw error(400, 'ID de venta requerido');
    }

    // Obtener la venta
    const saleResult = await db
      .select()
      .from(sales)
      .where(eq(sales.id, saleId))
      .limit(1);

    if (!saleResult.length) {
      throw error(404, 'Venta no encontrada');
    }

    const sale = saleResult[0];

    // Obtener items de la venta
    const items = await db
      .select({
        saleItem: saleItems,
        product: products,
      })
      .from(saleItems)
      .leftJoin(products, eq(saleItems.productId, products.id))
      .where(eq(saleItems.saleId, saleId));

    // Obtener datos de la organización
    const orgResult = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, locals.user?.organizationId || ''))
      .limit(1);

    const org = orgResult.length ? orgResult[0] : null;

    // Generar PDF usando pdf-lib
    const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
    
    const pdfDoc = await PDFDocument.create();
    
    // Configurar página tamaño ticket (80mm x largo variable)
    // 80mm = 226.77 puntos, usamos altura estándar y ajustamos
    const pageWidth = 226.77;
    const pageHeight = 800; // Altura suficiente para el contenido
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    let y = pageHeight - 40; // Margen superior
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    
    // ============================================
    // ENCABEZADO
    // ============================================
    
    // Nombre de la organización
    const orgName = org?.legalName || org?.name || 'COMERCIO';
    const orgNameLines = wrapText(orgName, fontBold, 14, contentWidth);
    page.drawText(orgNameLines[0], { 
      x: margin, 
      y, 
      size: 14, 
      font: fontBold,
      align: 'center'
    });
    y -= 18;
    
    if (orgNameLines.length > 1) {
      for (let i = 1; i < orgNameLines.length; i++) {
        page.drawText(orgNameLines[i], { 
          x: margin + (contentWidth / 2), 
          y, 
          size: 12, 
          font: fontBold,
          align: 'center'
        });
        y -= 14;
      }
    }
    
    // Cédula y dirección
    if (org?.taxId) {
      page.drawText(`Cédula: ${org.taxId}`, { x: margin, y, size: 9, font });
      y -= 12;
    }
    
    if (org?.address) {
      const addressLines = wrapText(org.address, font, 9, contentWidth);
      for (const line of addressLines) {
        page.drawText(line, { x: margin, y, size: 9, font });
        y -= 11;
      }
    }
    
    if (org?.phone) {
      page.drawText(`Tel: ${org.phone}`, { x: margin, y, size: 9, font });
      y -= 12;
    }
    
    // Separador
    y -= 10;
    drawLine(page, margin, y, pageWidth - margin, font);
    y -= 15;
    
    // ============================================
    // DATOS DEL COMPROBANTE
    // ============================================
    
    page.drawText(`COMPROBANTE ELECTRÓNICO`, { 
      x: margin, 
      y, 
      size: 11, 
      font: fontBold 
    });
    y -= 14;
    
    page.drawText(`N°: ${sale.saleNumber}`, { x: margin, y, size: 9, font });
    y -= 12;
    
    const dateStr = new Date(sale.createdAt).toLocaleString('es-CR', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
    page.drawText(`Fecha: ${dateStr}`, { x: margin, y, size: 9, font });
    y -= 12;
    
    if (sale.haciendaKey) {
      page.drawText(`Clave: ${sale.haciendaKey}`, { x: margin, y, size: 8, font });
      y -= 11;
    }
    
    // Separador
    y -= 10;
    drawLine(page, margin, y, pageWidth - margin, font);
    y -= 15;
    
    // ============================================
    // ITEMS
    // ============================================
    
    page.drawText('CANT.', { x: margin, y, size: 9, font: fontBold });
    page.drawText('DESCRIPCIÓN', { x: margin + 40, y, size: 9, font: fontBold });
    page.drawText('TOTAL', { x: pageWidth - margin - 50, y, size: 9, font: fontBold, align: 'right' });
    y -= 12;
    
    drawLine(page, margin, y, pageWidth - margin, font, 0.5);
    y -= 8;
    
    for (const item of items) {
      const quantity = item.saleItem.quantity.toString();
      const description = item.product?.name || 'Producto';
      const total = (item.saleItem.totalAmount || 0).toFixed(2);
      
      // Cantidad
      page.drawText(quantity, { x: margin, y, size: 9, font });
      
      // Descripción (con wrap si es muy larga)
      const descLines = wrapText(description, font, 9, contentWidth - 60);
      page.drawText(descLines[0], { x: margin + 40, y, size: 9, font });
      y -= 11;
      
      if (descLines.length > 1) {
        for (let i = 1; i < descLines.length; i++) {
          page.drawText(descLines[i], { x: margin + 40, y, size: 8, font });
          y -= 10;
        }
      }
      
      // Total alineado a la derecha
      page.drawText(`₡${total}`, { 
        x: pageWidth - margin - 50, 
        y: y + 11, 
        size: 9, 
        font 
      });
      
      y -= 4; // Espacio extra entre items
    }
    
    // Separador
    y -= 10;
    drawLine(page, margin, y, pageWidth - margin, font);
    y -= 15;
    
    // ============================================
    // TOTALES
    // ============================================
    
    // Subtotal
    page.drawText('Subtotal:', { 
      x: pageWidth - margin - 100, 
      y, 
      size: 10, 
      font 
    });
    page.drawText(`₡${sale.subtotal.toFixed(2)}`, { 
      x: pageWidth - margin - 50, 
      y, 
      size: 10, 
      font 
    });
    y -= 14;
    
    // Descuento (si aplica)
    if (sale.discount && sale.discount > 0) {
      page.drawText('Descuento:', { 
        x: pageWidth - margin - 100, 
        y, 
        size: 10, 
        font 
      });
      page.drawText(`₡${sale.discount.toFixed(2)}`, { 
        x: pageWidth - margin - 50, 
        y, 
        size: 10, 
        font 
      });
      y -= 14;
    }
    
    // Impuestos
    if (sale.taxAmount && sale.taxAmount > 0) {
      page.drawText('IVA:', { 
        x: pageWidth - margin - 100, 
        y, 
        size: 10, 
        font 
      });
      page.drawText(`₡${sale.taxAmount.toFixed(2)}`, { 
        x: pageWidth - margin - 50, 
        y, 
        size: 10, 
        font 
      });
      y -= 14;
    }
    
    // Total
    y -= 5;
    page.drawText('TOTAL:', { 
      x: pageWidth - margin - 100, 
      y, 
      size: 13, 
      font: fontBold 
    });
    page.drawText(`₡${sale.totalAmount.toFixed(2)}`, { 
      x: pageWidth - margin - 50, 
      y, 
      size: 13, 
      font: fontBold 
    });
    y -= 20;
    
    // ============================================
    // MÉTODO DE PAGO
    // ============================================
    
    const paymentMethods: Record<string, string> = {
      cash: '💵 Efectivo',
      card: '💳 Tarjeta',
      transfer: '🏦 Transferencia',
      sinpe: '📱 SINPE Móvil',
      credit: '📝 Crédito',
      mixed: '💵 Mixto'
    };
    
    page.drawText(`Pago: ${paymentMethods[sale.paymentMethod] || sale.paymentMethod}`, { 
      x: margin, 
      y, 
      size: 10, 
      font 
    });
    y -= 14;
    
    if (sale.amountPaid && sale.amountPaid !== sale.totalAmount) {
      page.drawText(`Recibido: ₡${sale.amountPaid.toFixed(2)}`, { x: margin, y, size: 9, font });
      y -= 11;
      
      if (sale.changeAmount) {
        page.drawText(`Cambio: ₡${sale.changeAmount.toFixed(2)}`, { x: margin, y, size: 9, font });
        y -= 11;
      }
    }
    
    // Separador
    y -= 15;
    drawLine(page, margin, y, pageWidth - margin, font);
    y -= 15;
    
    // ============================================
    // PIE DE PÁGINA
    // ============================================
    
    // Mensaje de agradecimiento
    page.drawText('¡Gracias por su compra!', { 
      x: margin + (contentWidth / 2), 
      y, 
      size: 11, 
      font: fontBold,
      align: 'center'
    });
    y -= 15;
    
    // Notas (si existen)
    if (sale.notes) {
      const noteLines = wrapText(sale.notes, font, 9, contentWidth);
      for (const line of noteLines) {
        page.drawText(line, { x: margin, y, size: 8, font });
        y -= 10;
      }
      y -= 5;
    }
    
    // Información fiscal
    page.drawText('Este comprobante es la representación', { 
      x: margin + (contentWidth / 2), 
      y, 
      size: 8, 
      font,
      align: 'center'
    });
    y -= 10;
    
    page.drawText('gráfica de un documento electrónico.', { 
      x: margin + (contentWidth / 2), 
      y, 
      size: 8, 
      font,
      align: 'center'
    });
    y -= 10;
    
    if (sale.haciendaKey) {
      page.drawText('Consulte en: hacienda.go.cr', { 
        x: margin + (contentWidth / 2), 
        y, 
        size: 8, 
        font,
        align: 'center'
      });
      y -= 12;
      
      // QR Code placeholder (texto)
      page.drawText(`Clave: ${sale.haciendaKey.substring(0, 25)}...`, { 
        x: margin, 
        y, 
        size: 7, 
        font 
      });
    }
    
    // ============================================
    // GUARDAR PDF
    // ============================================
    
    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);
    
    // Retornar PDF como respuesta binaria
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="ticket-${sale.saleNumber}.pdf"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    console.error('[Ticket API] Error:', err);
    
    if (err instanceof Error) {
      throw error(500, `Error generando ticket: ${err.message}`);
    }
    
    throw error(500, 'Error interno del servidor');
  }
};

/**
 * Función auxiliar para dibujar una línea horizontal
 */
function drawLine(
  page: any, 
  x1: number, 
  y: number, 
  x2: number, 
  font: any, 
  thickness: number = 1
) {
  page.drawLine({
    start: { x: x1, y },
    end: { x: x2, y },
    thickness,
    color: rgb(0.5, 0.5, 0.5),
  });
}

/**
 * Función auxiliar para dividir texto en múltiples líneas
 */
function wrapText(text: string, font: any, fontSize: number, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);
    
    if (testWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}
