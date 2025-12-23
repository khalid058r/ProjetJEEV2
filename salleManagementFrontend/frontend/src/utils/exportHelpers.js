/**
 * Export Helper Utilities
 * Functions for exporting data to various formats (PDF, Excel, CSV)
 */

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * Export data to CSV
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Output filename
 * @param {Array} columns - Column definitions
 */
export function exportToCSV(data, filename = 'export.csv', columns = null) {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Determine columns
  const cols = columns || Object.keys(data[0]);
  
  // Create CSV content
  const headers = cols.join(',');
  const rows = data.map(row => 
    cols.map(col => {
      const value = row[col];
      // Escape values with commas or quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  );
  
  const csv = [headers, ...rows].join('\n');
  
  // Create and download file
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

/**
 * Export data to Excel
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Output filename
 * @param {string} sheetName - Sheet name
 */
export function exportToExcel(data, filename = 'export.xlsx', sheetName = 'Data') {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  // Generate and download file
  XLSX.writeFile(workbook, filename);
}

/**
 * Export chart to PDF
 * @param {string} title - Document title
 * @param {Array} sections - Array of sections with content
 * @param {string} filename - Output filename
 */
export function exportToPDF(title, sections = [], filename = 'report.pdf') {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.text(title, 14, 20);
  
  // Add date
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
  
  let yPosition = 40;
  
  sections.forEach(section => {
    // Check if we need a new page
    if (yPosition > 270) {
      doc.addPage();
      yPosition = 20;
    }
    
    // Section title
    doc.setFontSize(14);
    doc.text(section.title, 14, yPosition);
    yPosition += 10;
    
    // Section content
    if (section.type === 'text') {
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(section.content, 180);
      doc.text(lines, 14, yPosition);
      yPosition += lines.length * 6 + 10;
    }
    
    // Table content
    if (section.type === 'table' && section.data) {
      doc.autoTable({
        startY: yPosition,
        head: [section.columns || Object.keys(section.data[0])],
        body: section.data.map(row => 
          (section.columns || Object.keys(row)).map(col => row[col])
        ),
        theme: 'striped',
        headStyles: { fillColor: [66, 133, 244] }
      });
      yPosition = doc.lastAutoTable.finalY + 10;
    }
    
    // KPI summary
    if (section.type === 'kpi' && section.data) {
      doc.setFontSize(10);
      section.data.forEach(kpi => {
        doc.text(`${kpi.label}: ${kpi.value}`, 14, yPosition);
        yPosition += 8;
      });
      yPosition += 5;
    }
  });
  
  // Save PDF
  doc.save(filename);
}

/**
 * Export multiple tables to Excel with multiple sheets
 * @param {Array} sheets - Array of {name, data} objects
 * @param {string} filename - Output filename
 */
export function exportMultiSheetExcel(sheets, filename = 'report.xlsx') {
  const workbook = XLSX.utils.book_new();
  
  sheets.forEach(sheet => {
    if (sheet.data && sheet.data.length > 0) {
      const worksheet = XLSX.utils.json_to_sheet(sheet.data);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
    }
  });
  
  XLSX.writeFile(workbook, filename);
}

/**
 * Prepare analytics data for export
 * @param {Object} analyticsData - Analytics data object
 * @returns {Object} Formatted data for export
 */
export function prepareAnalyticsExport(analyticsData) {
  const { kpi, daily, products, categories, sales } = analyticsData;
  
  const sheets = [];
  
  // KPI Summary
  if (kpi) {
    sheets.push({
      name: 'KPI Summary',
      data: [
        { Metric: 'Total Revenue', Value: kpi.totalRevenue },
        { Metric: 'Total Sales', Value: kpi.totalSales },
        { Metric: 'Average Basket', Value: kpi.averageBasket },
        { Metric: 'Low Stock Count', Value: kpi.lowStockCount }
      ]
    });
  }
  
  // Daily Sales
  if (daily && daily.length > 0) {
    sheets.push({
      name: 'Daily Sales',
      data: daily
    });
  }
  
  // Products
  if (products && products.length > 0) {
    sheets.push({
      name: 'Products',
      data: products
    });
  }
  
  // Categories
  if (categories && categories.length > 0) {
    sheets.push({
      name: 'Categories',
      data: categories
    });
  }
  
  // Sales
  if (sales && sales.length > 0) {
    sheets.push({
      name: 'Sales Details',
      data: sales
    });
  }
  
  return sheets;
}
