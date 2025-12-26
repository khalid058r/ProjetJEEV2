// src/utils/invoicePdf.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";

export async function generateInvoicePDF(sale) {
  const doc = new jsPDF("p", "mm", "a4");

  const lignes = sale.lignes || [];
  const clientName = sale.clientName || "Walk-in Customer";
  const invoiceNumber = `INV-${sale.id}`;
  const date = sale.saleDate;

  /* ===== HEADER ===== */
  doc.setFontSize(18);
  doc.text("SALES INVOICE", 105, 20, { align: "center" });

  doc.setFontSize(10);
  doc.text("SaleManager", 14, 30);
  doc.text("Casablanca, Morocco", 14, 35);
  doc.text("+212 6XX XX XX XX", 14, 40);

  doc.text(`Invoice #: ${invoiceNumber}`, 150, 30);
  doc.text(`Date: ${date}`, 150, 35);
  doc.text(`Client: ${clientName}`, 150, 40);

  /* ===== TABLE ===== */
  const tableBody = lignes.map(l => [
    l.productTitle,
    l.quantity,
    `${l.unitPrice.toFixed(2)} MAD`,
    `${l.lineTotal.toFixed(2)} MAD`,
  ]);

  autoTable(doc, {
    startY: 50,
    head: [["Product", "Qty", "Unit Price", "Total"]],
    body: tableBody,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [59, 130, 246] },
  });

  /* ===== TOTALS ===== */
  const finalY = doc.lastAutoTable.finalY + 10;
  const subTotal = lignes.reduce((s, l) => s + l.lineTotal, 0);
  const tva = subTotal * 0.2;
  const total = subTotal + tva;

  doc.setFontSize(11);
  doc.text(`Subtotal: ${subTotal.toFixed(2)} MAD`, 140, finalY);
  doc.text(`TVA (20%): ${tva.toFixed(2)} MAD`, 140, finalY + 6);

  doc.setFontSize(13);
  doc.text(`TOTAL: ${total.toFixed(2)} MAD`, 140, finalY + 14);

  /* ===== QR CODE ===== */
  const qrData = `Invoice ${invoiceNumber} | Total ${total} MAD`;
  const qrImage = await QRCode.toDataURL(qrData);
  doc.addImage(qrImage, "PNG", 14, finalY, 30, 30);

  /* ===== SAVE ===== */
  doc.save(`${invoiceNumber}.pdf`);
}
