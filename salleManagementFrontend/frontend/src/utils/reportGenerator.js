/**
 * Advanced Report Generator
 * Generates PDF, Excel and CSV reports with professional formatting
 */

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Company info for reports
const COMPANY_INFO = {
    name: 'Sales Management System',
    tagline: 'Rapport Analytique',
    address: 'Votre Entreprise',
    phone: '+212 5XX XXX XXX',
    email: 'contact@entreprise.com'
};

// Colors for PDF
const COLORS = {
    primary: [59, 130, 246], // Blue
    secondary: [16, 185, 129], // Green
    accent: [139, 92, 246], // Purple
    danger: [239, 68, 68], // Red
    warning: [245, 158, 11], // Orange
    dark: [31, 41, 55],
    gray: [107, 114, 128],
    light: [243, 244, 246]
};

/**
 * Format currency value
 */
const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-MA', {
        style: 'currency',
        currency: 'MAD',
        minimumFractionDigits: 2
    }).format(value || 0);
};

/**
 * Format number
 */
const formatNumber = (value) => {
    return new Intl.NumberFormat('fr-FR').format(value || 0);
};

/**
 * Format date
 */
const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

/**
 * Generate PDF Report
 */
export function generatePDFReport(reportType, data, options = {}) {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPos = margin;

    // Header with gradient effect simulation
    const drawHeader = () => {
        doc.setFillColor(...COLORS.primary);
        doc.rect(0, 0, pageWidth, 45, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text(COMPANY_INFO.name, margin, 20);

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(getReportTitle(reportType), margin, 32);

        doc.setFontSize(10);
        doc.text(`Généré le: ${formatDate(new Date())}`, pageWidth - margin - 50, 32);

        yPos = 55;
    };

    // Footer
    const drawFooter = (pageNum, totalPages) => {
        doc.setFillColor(...COLORS.light);
        doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');

        doc.setTextColor(...COLORS.gray);
        doc.setFontSize(8);
        doc.text(COMPANY_INFO.email, margin, pageHeight - 6);
        doc.text(`Page ${pageNum} / ${totalPages}`, pageWidth - margin - 20, pageHeight - 6);
    };

    // Get report title
    const getReportTitle = (type) => {
        const titles = {
            sales: 'Rapport des Ventes',
            products: 'Rapport des Produits',
            categories: 'Rapport des Catégories',
            monthly: 'Rapport Mensuel Complet',
            trends: 'Analyse des Tendances',
            custom: 'Rapport Personnalisé'
        };
        return titles[type] || 'Rapport Analytique';
    };

    // Add section title
    const addSectionTitle = (title, icon = '📊') => {
        if (yPos > pageHeight - 40) {
            doc.addPage();
            yPos = margin;
        }

        doc.setFillColor(...COLORS.light);
        doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 12, 2, 2, 'F');

        doc.setTextColor(...COLORS.dark);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`${icon} ${title}`, margin + 5, yPos + 8);

        yPos += 18;
    };

    // Add KPI card
    const addKPICard = (label, value, change = null) => {
        const cardWidth = (pageWidth - 2 * margin - 15) / 4;
        const cardX = margin + (kpiIndex % 4) * (cardWidth + 5);

        if (kpiIndex % 4 === 0 && kpiIndex > 0) {
            yPos += 25;
        }

        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(...COLORS.light);
        doc.roundedRect(cardX, yPos, cardWidth, 22, 2, 2, 'FD');

        doc.setTextColor(...COLORS.gray);
        doc.setFontSize(8);
        doc.text(label, cardX + 3, yPos + 7);

        doc.setTextColor(...COLORS.dark);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(String(value), cardX + 3, yPos + 16);

        if (change !== null) {
            const changeColor = change >= 0 ? COLORS.secondary : COLORS.danger;
            doc.setTextColor(...changeColor);
            doc.setFontSize(8);
            doc.text(`${change >= 0 ? '+' : ''}${change}%`, cardX + cardWidth - 15, yPos + 16);
        }

        kpiIndex++;
    };

    let kpiIndex = 0;

    // Draw header
    drawHeader();

    // Generate content based on report type
    switch (reportType) {
        case 'sales':
            generateSalesReport(doc, data, margin, yPos, pageWidth, addSectionTitle);
            break;
        case 'products':
            generateProductsReport(doc, data, margin, yPos, pageWidth, addSectionTitle);
            break;
        case 'categories':
            generateCategoriesReport(doc, data, margin, yPos, pageWidth, addSectionTitle);
            break;
        case 'monthly':
        case 'trends':
            generateMonthlyReport(doc, data, margin, yPos, pageWidth, addSectionTitle);
            break;
        default:
            generateGenericReport(doc, data, margin, yPos, pageWidth, addSectionTitle);
    }

    // Add page numbers
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        drawFooter(i, totalPages);
    }

    // Save
    const filename = options.filename || `rapport_${reportType}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);

    return filename;
}

function generateSalesReport(doc, data, margin, startY, pageWidth, addSectionTitle) {
    let yPos = startY;
    const sales = data.sales || [];
    const kpi = data.kpi || {};

    // KPIs Section
    doc.setFillColor(...COLORS.light);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 35, 3, 3, 'F');

    doc.setTextColor(...COLORS.dark);
    doc.setFontSize(10);

    const kpis = [
        { label: 'Revenu Total', value: formatCurrency(data.totalRevenue || kpi.totalRevenue || sales.reduce((s, v) => s + (v.totalAmount || 0), 0)) },
        { label: 'Nombre de Ventes', value: formatNumber(data.totalSales || sales.length) },
        { label: 'Panier Moyen', value: formatCurrency(kpi.averageBasket || (sales.length > 0 ? sales.reduce((s, v) => s + (v.totalAmount || 0), 0) / sales.length : 0)) },
        { label: 'Taux de Croissance', value: `${kpi.growthRate || 0}%` }
    ];

    const kpiWidth = (pageWidth - 2 * margin) / 4;
    kpis.forEach((kpi, i) => {
        const x = margin + i * kpiWidth + 5;
        doc.setTextColor(...COLORS.gray);
        doc.setFontSize(9);
        doc.text(kpi.label, x, yPos + 12);
        doc.setTextColor(...COLORS.primary);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(kpi.value, x, yPos + 25);
        doc.setFont('helvetica', 'normal');
    });

    yPos += 45;

    // Sales Table
    if (sales.length > 0) {
        doc.setTextColor(...COLORS.dark);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('📋 Détail des Ventes', margin, yPos);
        yPos += 8;

        doc.autoTable({
            startY: yPos,
            head: [['ID', 'Date', 'Client', 'Montant', 'Statut']],
            body: sales.slice(0, 50).map(sale => [
                sale.id,
                formatDate(sale.saleDate || sale.createdAt),
                sale.username || `Client #${sale.userId}`,
                formatCurrency(sale.totalAmount),
                sale.status || 'CONFIRMED'
            ]),
            theme: 'striped',
            headStyles: {
                fillColor: COLORS.primary,
                textColor: [255, 255, 255],
                fontSize: 10,
                fontStyle: 'bold'
            },
            bodyStyles: { fontSize: 9 },
            alternateRowStyles: { fillColor: [249, 250, 251] },
            margin: { left: margin, right: margin }
        });
    }
}

function generateProductsReport(doc, data, margin, startY, pageWidth, addSectionTitle) {
    let yPos = startY;
    const products = data.products || [];
    const bestSellers = data.bestSellers || [];

    // Summary
    doc.setFillColor(...COLORS.secondary);
    doc.roundedRect(margin, yPos, (pageWidth - 2 * margin) / 2 - 5, 25, 3, 3, 'F');
    doc.setFillColor(...COLORS.accent);
    doc.roundedRect(margin + (pageWidth - 2 * margin) / 2 + 5, yPos, (pageWidth - 2 * margin) / 2 - 5, 25, 3, 3, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('Total Produits', margin + 10, yPos + 10);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(String(products.length), margin + 10, yPos + 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Stock Faible', margin + (pageWidth - 2 * margin) / 2 + 15, yPos + 10);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    const lowStock = products.filter(p => (p.stock || p.quantity || 0) < 10).length;
    doc.text(String(lowStock), margin + (pageWidth - 2 * margin) / 2 + 15, yPos + 20);

    yPos += 35;

    // Products Table
    if (products.length > 0) {
        doc.setTextColor(...COLORS.dark);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('📦 Liste des Produits', margin, yPos);
        yPos += 8;

        doc.autoTable({
            startY: yPos,
            head: [['ID', 'Produit', 'Prix', 'Stock', 'Catégorie']],
            body: products.slice(0, 50).map(product => [
                product.id,
                product.title || product.name || 'N/A',
                formatCurrency(product.price),
                product.stock || product.quantity || 0,
                product.categoryName || product.category?.name || 'N/A'
            ]),
            theme: 'striped',
            headStyles: {
                fillColor: COLORS.secondary,
                textColor: [255, 255, 255],
                fontSize: 10
            },
            bodyStyles: { fontSize: 9 },
            margin: { left: margin, right: margin }
        });
    }

    // Best Sellers
    if (bestSellers.length > 0) {
        yPos = doc.lastAutoTable.finalY + 15;

        doc.setTextColor(...COLORS.dark);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('🏆 Meilleurs Vendeurs', margin, yPos);
        yPos += 8;

        doc.autoTable({
            startY: yPos,
            head: [['Rang', 'Produit', 'Quantité Vendue', 'Revenu']],
            body: bestSellers.slice(0, 10).map((p, i) => [
                `#${i + 1}`,
                p.productTitle || p.title || p.name || 'N/A',
                formatNumber(p.totalQuantity || p.quantitySold || 0),
                formatCurrency(p.revenue || p.totalRevenue || 0)
            ]),
            theme: 'striped',
            headStyles: {
                fillColor: COLORS.warning,
                textColor: [255, 255, 255],
                fontSize: 10
            },
            bodyStyles: { fontSize: 9 },
            margin: { left: margin, right: margin }
        });
    }
}

function generateCategoriesReport(doc, data, margin, startY, pageWidth, addSectionTitle) {
    let yPos = startY;
    const categories = data.categories || [];
    const stats = data.stats || [];

    // Summary
    doc.setFillColor(...COLORS.accent);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 25, 3, 3, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('Total Catégories', margin + 10, yPos + 10);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(String(categories.length), margin + 10, yPos + 20);

    yPos += 35;

    // Categories Table
    if (categories.length > 0) {
        doc.setTextColor(...COLORS.dark);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('📁 Liste des Catégories', margin, yPos);
        yPos += 8;

        doc.autoTable({
            startY: yPos,
            head: [['ID', 'Catégorie', 'Description', 'Produits']],
            body: categories.map(cat => [
                cat.id,
                cat.name || 'N/A',
                (cat.description || '').substring(0, 50) + (cat.description?.length > 50 ? '...' : ''),
                cat.productCount || 0
            ]),
            theme: 'striped',
            headStyles: {
                fillColor: COLORS.accent,
                textColor: [255, 255, 255],
                fontSize: 10
            },
            bodyStyles: { fontSize: 9 },
            margin: { left: margin, right: margin }
        });
    }
}

function generateMonthlyReport(doc, data, margin, startY, pageWidth, addSectionTitle) {
    let yPos = startY;

    const sales = data.sales || [];
    const products = data.products || [];
    const categories = data.categories || [];
    const kpi = data.kpi || {};

    // Executive Summary
    doc.setFillColor(...COLORS.primary);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 40, 3, 3, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Résumé Exécutif', margin + 10, yPos + 15);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const summary = `Ce rapport couvre ${sales.length} ventes, ${products.length} produits et ${categories.length} catégories.`;
    doc.text(summary, margin + 10, yPos + 28);

    yPos += 50;

    // Key Metrics Grid
    const metrics = [
        { label: 'Revenu Total', value: formatCurrency(kpi.totalRevenue || sales.reduce((s, v) => s + (v.totalAmount || 0), 0)), color: COLORS.secondary },
        { label: 'Ventes', value: formatNumber(sales.length), color: COLORS.primary },
        { label: 'Produits', value: formatNumber(products.length), color: COLORS.accent },
        { label: 'Catégories', value: formatNumber(categories.length), color: COLORS.warning }
    ];

    const metricWidth = (pageWidth - 2 * margin - 15) / 4;
    metrics.forEach((metric, i) => {
        const x = margin + i * (metricWidth + 5);
        doc.setFillColor(...metric.color);
        doc.roundedRect(x, yPos, metricWidth, 28, 2, 2, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.text(metric.label, x + 5, yPos + 10);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(metric.value, x + 5, yPos + 22);
        doc.setFont('helvetica', 'normal');
    });

    yPos += 40;

    // Recent Sales
    if (sales.length > 0) {
        doc.setTextColor(...COLORS.dark);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('📈 Ventes Récentes', margin, yPos);
        yPos += 8;

        doc.autoTable({
            startY: yPos,
            head: [['Date', 'Montant', 'Client']],
            body: sales.slice(0, 15).map(sale => [
                formatDate(sale.saleDate || sale.createdAt),
                formatCurrency(sale.totalAmount),
                sale.username || `Client #${sale.userId}`
            ]),
            theme: 'striped',
            headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255] },
            margin: { left: margin, right: margin }
        });
    }
}

function generateGenericReport(doc, data, margin, startY, pageWidth, addSectionTitle) {
    let yPos = startY;

    doc.setTextColor(...COLORS.dark);
    doc.setFontSize(12);
    doc.text('Données du Rapport', margin, yPos);
    yPos += 10;

    doc.setFontSize(10);
    const jsonStr = JSON.stringify(data, null, 2);
    const lines = doc.splitTextToSize(jsonStr.substring(0, 2000), pageWidth - 2 * margin);
    doc.text(lines, margin, yPos);
}

/**
 * Generate Excel Report
 */
export function generateExcelReport(reportType, data, options = {}) {
    const workbook = XLSX.utils.book_new();

    // Add metadata
    workbook.Props = {
        Title: getReportTitle(reportType),
        Author: COMPANY_INFO.name,
        CreatedDate: new Date()
    };

    switch (reportType) {
        case 'sales':
            addSalesSheets(workbook, data);
            break;
        case 'products':
            addProductsSheets(workbook, data);
            break;
        case 'categories':
            addCategoriesSheets(workbook, data);
            break;
        default:
            addGenericSheets(workbook, data);
    }

    const filename = options.filename || `rapport_${reportType}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);

    return filename;
}

function getReportTitle(type) {
    const titles = {
        sales: 'Rapport des Ventes',
        products: 'Rapport des Produits',
        categories: 'Rapport des Catégories',
        monthly: 'Rapport Mensuel',
        trends: 'Analyse des Tendances'
    };
    return titles[type] || 'Rapport';
}

function addSalesSheets(workbook, data) {
    const sales = data.sales || [];

    // Summary sheet
    const summary = [
        ['Rapport des Ventes'],
        ['Généré le:', formatDate(new Date())],
        [''],
        ['Métriques Clés'],
        ['Total Ventes:', sales.length],
        ['Revenu Total:', data.totalRevenue || sales.reduce((s, v) => s + (v.totalAmount || 0), 0)],
        ['Panier Moyen:', sales.length > 0 ? sales.reduce((s, v) => s + (v.totalAmount || 0), 0) / sales.length : 0]
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summary);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Résumé');

    // Details sheet
    if (sales.length > 0) {
        const salesData = sales.map(sale => ({
            'ID': sale.id,
            'Date': sale.saleDate || sale.createdAt,
            'Client': sale.username || `Client #${sale.userId}`,
            'Montant': sale.totalAmount,
            'Statut': sale.status || 'CONFIRMED',
            'Articles': sale.lignes?.length || 0
        }));
        const salesSheet = XLSX.utils.json_to_sheet(salesData);
        XLSX.utils.book_append_sheet(workbook, salesSheet, 'Ventes');
    }
}

function addProductsSheets(workbook, data) {
    const products = data.products || [];
    const bestSellers = data.bestSellers || [];

    // Products sheet
    if (products.length > 0) {
        const productsData = products.map(p => ({
            'ID': p.id,
            'Titre': p.title || p.name,
            'Prix': p.price,
            'Stock': p.stock || p.quantity || 0,
            'Catégorie': p.categoryName || p.category?.name || 'N/A'
        }));
        const productsSheet = XLSX.utils.json_to_sheet(productsData);
        XLSX.utils.book_append_sheet(workbook, productsSheet, 'Produits');
    }

    // Best sellers sheet
    if (bestSellers.length > 0) {
        const bestData = bestSellers.map((p, i) => ({
            'Rang': i + 1,
            'Produit': p.productTitle || p.title || p.name,
            'Quantité Vendue': p.totalQuantity || p.quantitySold || 0,
            'Revenu': p.revenue || p.totalRevenue || 0
        }));
        const bestSheet = XLSX.utils.json_to_sheet(bestData);
        XLSX.utils.book_append_sheet(workbook, bestSheet, 'Meilleurs Vendeurs');
    }
}

function addCategoriesSheets(workbook, data) {
    const categories = data.categories || [];

    if (categories.length > 0) {
        const catData = categories.map(c => ({
            'ID': c.id,
            'Nom': c.name,
            'Description': c.description || '',
            'Nombre de Produits': c.productCount || 0
        }));
        const catSheet = XLSX.utils.json_to_sheet(catData);
        XLSX.utils.book_append_sheet(workbook, catSheet, 'Catégories');
    }
}

function addGenericSheets(workbook, data) {
    Object.entries(data).forEach(([key, value]) => {
        if (Array.isArray(value) && value.length > 0) {
            const sheet = XLSX.utils.json_to_sheet(value);
            XLSX.utils.book_append_sheet(workbook, sheet, key.substring(0, 31));
        }
    });
}

/**
 * Generate CSV Report
 */
export function generateCSVReport(reportType, data, options = {}) {
    let csvContent = '';

    // Add header
    csvContent += `# Rapport ${getReportTitle(reportType)}\n`;
    csvContent += `# Généré le: ${formatDate(new Date())}\n`;
    csvContent += `\n`;

    switch (reportType) {
        case 'sales':
            csvContent += generateSalesCSV(data);
            break;
        case 'products':
            csvContent += generateProductsCSV(data);
            break;
        case 'categories':
            csvContent += generateCategoriesCSV(data);
            break;
        default:
            csvContent += generateGenericCSV(data);
    }

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    const filename = options.filename || `rapport_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return filename;
}

function generateSalesCSV(data) {
    const sales = data.sales || [];
    let csv = 'ID,Date,Client,Montant,Statut\n';

    sales.forEach(sale => {
        csv += `${sale.id},"${sale.saleDate || sale.createdAt}","${sale.username || 'Client #' + sale.userId}",${sale.totalAmount},"${sale.status || 'CONFIRMED'}"\n`;
    });

    return csv;
}

function generateProductsCSV(data) {
    const products = data.products || [];
    let csv = 'ID,Titre,Prix,Stock,Catégorie\n';

    products.forEach(p => {
        csv += `${p.id},"${(p.title || p.name || '').replace(/"/g, '""')}",${p.price},${p.stock || p.quantity || 0},"${p.categoryName || p.category?.name || 'N/A'}"\n`;
    });

    return csv;
}

function generateCategoriesCSV(data) {
    const categories = data.categories || [];
    let csv = 'ID,Nom,Description,Nombre de Produits\n';

    categories.forEach(c => {
        csv += `${c.id},"${(c.name || '').replace(/"/g, '""')}","${(c.description || '').replace(/"/g, '""')}",${c.productCount || 0}\n`;
    });

    return csv;
}

function generateGenericCSV(data) {
    let csv = '';

    Object.entries(data).forEach(([key, value]) => {
        if (Array.isArray(value) && value.length > 0) {
            csv += `\n# ${key}\n`;
            const headers = Object.keys(value[0]);
            csv += headers.join(',') + '\n';
            value.forEach(row => {
                csv += headers.map(h => {
                    const val = row[h];
                    if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
                        return `"${val.replace(/"/g, '""')}"`;
                    }
                    return val;
                }).join(',') + '\n';
            });
        }
    });

    return csv;
}

export default {
    generatePDFReport,
    generateExcelReport,
    generateCSVReport
};
