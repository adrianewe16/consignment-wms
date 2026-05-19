import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import type { InventoryRow, MovementWithProduct, Dealer } from './supabase'

const BRAND = '#1a1a2e'
const GREEN = '#16a34a'
const RED = '#dc2626'
const GREY = '#6b7280'

function addHeader(doc: jsPDF, dealer: Dealer, title: string, subtitle?: string) {
  doc.setFillColor(BRAND)
  doc.rect(0, 0, 210, 22, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('CONSIGNMENT WMS', 14, 9)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(`Dealer: ${dealer.name}  |  ID: ${dealer.id}`, 14, 15)
  doc.setFontSize(9)
  doc.text(format(new Date(), 'dd MMM yyyy HH:mm'), 196, 9, { align: 'right' })
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(title, 14, 32)
  if (subtitle) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(GREY)
    doc.text(subtitle, 14, 39)
    doc.setTextColor(0, 0, 0)
  }
}

export function generateStockTakePDF(
  dealer: Dealer,
  stockRows: InventoryRow[],
  showRows: InventoryRow[]
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  // PAGE 1 — STOCK UNITS
  addHeader(doc, dealer, 'STOCK TAKE — STOCK UNITS', `Generated: ${format(new Date(), 'dd MMM yyyy')}`)

  autoTable(doc, {
    startY: 44,
    head: [['SKU', 'Product', 'Category', 'Remaining\n(Should Be)', 'Actual', 'Variance']],
    body: stockRows.map(r => [
      r.sku,
      r.name,
      r.category || '—',
      r.remaining,
      '',
      ''
    ]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: BRAND, textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 60 },
      2: { cellWidth: 28 },
      3: { cellWidth: 28, halign: 'center' },
      4: { cellWidth: 22, halign: 'center' },
      5: { cellWidth: 22, halign: 'center' }
    },
    alternateRowStyles: { fillColor: [248, 248, 252] }
  })

  // Signature rows
  const finalY1 = (doc as any).lastAutoTable.finalY + 12
  doc.setDrawColor(GREY)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('Counted by: ___________________________', 14, finalY1)
  doc.text('Verified by: ___________________________', 110, finalY1)
  doc.text('Signature: ___________________', 14, finalY1 + 12)
  doc.text('Date: ___________________', 110, finalY1 + 12)

  // PAGE 2 — SHOW UNITS
  doc.addPage()
  addHeader(doc, dealer, 'STOCK TAKE — SHOW UNITS', `Generated: ${format(new Date(), 'dd MMM yyyy')}`)

  autoTable(doc, {
    startY: 44,
    head: [['SKU', 'Product', 'Category', 'Remaining\n(Should Be)', 'Actual', 'Variance']],
    body: showRows.length > 0 ? showRows.map(r => [
      r.sku,
      r.name,
      r.category || '—',
      r.remaining,
      '',
      ''
    ]) : [['—', 'No show units on record', '', '', '', '']],
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 60 },
      2: { cellWidth: 28 },
      3: { cellWidth: 28, halign: 'center' },
      4: { cellWidth: 22, halign: 'center' },
      5: { cellWidth: 22, halign: 'center' }
    },
    alternateRowStyles: { fillColor: [248, 248, 252] }
  })

  const finalY2 = (doc as any).lastAutoTable.finalY + 12
  doc.setFontSize(8)
  doc.text('Counted by: ___________________________', 14, finalY2)
  doc.text('Verified by: ___________________________', 110, finalY2)
  doc.text('Signature: ___________________', 14, finalY2 + 12)
  doc.text('Date: ___________________', 110, finalY2 + 12)

  doc.save(`stock-take_${dealer.id}_${format(new Date(), 'yyyyMMdd')}.pdf`)
}

export function generateMovementPDF(
  dealer: Dealer,
  movements: MovementWithProduct[],
  dateFrom: string,
  dateTo: string
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const subtitle = dateFrom && dateTo
    ? `Period: ${format(new Date(dateFrom), 'dd MMM yyyy')} — ${format(new Date(dateTo), 'dd MMM yyyy')}`
    : 'All dates'

  addHeader(doc, dealer, 'MOVEMENT REPORT', subtitle)

  autoTable(doc, {
    startY: 44,
    head: [['Date', 'Type', 'SKU', 'Product', 'Unit', 'Ref', 'Customer', 'Qty']],
    body: movements.map(m => [
      format(new Date(m.date), 'dd MMM yy'),
      m.type.toUpperCase(),
      m.sku,
      m.products?.name || m.sku,
      m.unit_type,
      m.ref || '—',
      m.customer || '—',
      m.type === 'in' ? `+${m.qty}` : `-${m.qty}`
    ]),
    styles: { fontSize: 7.5, cellPadding: 2.5 },
    headStyles: { fillColor: BRAND, textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 14, halign: 'center' },
      2: { cellWidth: 22 },
      3: { cellWidth: 48 },
      4: { cellWidth: 14, halign: 'center' },
      5: { cellWidth: 22 },
      6: { cellWidth: 28 },
      7: { cellWidth: 16, halign: 'right' }
    },
    didParseCell: (data) => {
      if (data.column.index === 1 && data.section === 'body') {
        const val = data.cell.raw as string
        data.cell.styles.textColor = val === 'IN' ? GREEN : RED
        data.cell.styles.fontStyle = 'bold'
      }
      if (data.column.index === 7 && data.section === 'body') {
        const val = data.cell.raw as string
        data.cell.styles.textColor = val.startsWith('+') ? GREEN : RED
        data.cell.styles.fontStyle = 'bold'
      }
    },
    alternateRowStyles: { fillColor: [248, 248, 252] }
  })

  // Summary totals
  const finalY = (doc as any).lastAutoTable.finalY + 8
  const totalIn = movements.filter(m => m.type === 'in').reduce((s, m) => s + m.qty, 0)
  const totalOut = movements.filter(m => m.type === 'out').reduce((s, m) => s + m.qty, 0)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(GREEN)
  doc.text(`Total IN: ${totalIn}`, 14, finalY)
  doc.setTextColor(RED)
  doc.text(`Total OUT: ${totalOut}`, 60, finalY)
  doc.setTextColor(0, 0, 0)
  doc.text(`Net: ${totalIn - totalOut}`, 106, finalY)

  doc.save(`movements_${dealer.id}_${format(new Date(), 'yyyyMMdd')}.pdf`)
}
