/**
 * Advanced Multi-Page PDF Report Generator
 * Airbnb-inspired design with charts, graphs, and role-based content
 */

import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Brand Colors
const COLORS = {
  coral: [255, 90, 95],       // #FF5A5F
  teal: [0, 166, 153],        // #00A699
  arches: [252, 100, 45],     // #FC642D
  hof: [255, 180, 0],         // #FFB400
  kazan: [145, 70, 105],      // #914669
  dark: [34, 34, 34],         // #222222
  gray: [113, 113, 113],      // #717171
  lightGray: [247, 247, 247], // #F7F7F7
  white: [255, 255, 255],
  success: [0, 166, 153],
  warning: [255, 180, 0],
  error: [255, 90, 95],
};

// Company Info
const COMPANY_INFO = {
  name: 'SaleManager Pro',
  tagline: 'Système de Gestion des Ventes',
  website: 'www.salemanager.com',
};

/**
 * Create a new PDF document with Airbnb-inspired styling
 */
class AirbnbPDFReport {
  constructor(options = {}) {
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.margin = options.margin || 20;
    this.currentY = this.margin;
    this.pageNumber = 1;
    this.totalPages = 1;
    this.options = options;
    
    // Fonts
    this.doc.setFont('helvetica');
  }

  // Check if we need a new page
  checkNewPage(requiredSpace = 30) {
    if (this.currentY + requiredSpace > this.pageHeight - 25) {
      this.addNewPage();
      return true;
    }
    return false;
  }

  // Add a new page
  addNewPage() {
    this.doc.addPage();
    this.pageNumber++;
    this.currentY = this.margin;
  }

  // Draw header with gradient-like effect
  drawHeader(title, subtitle) {
    // Header background
    this.doc.setFillColor(...COLORS.coral);
    this.doc.rect(0, 0, this.pageWidth, 50, 'F');
    
    // Decorative gradient stripe
    this.doc.setFillColor(...COLORS.arches);
    this.doc.rect(0, 50, this.pageWidth, 3, 'F');

    // Company name
    this.doc.setTextColor(...COLORS.white);
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(COMPANY_INFO.name, this.margin, 25);

    // Report title
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(title, this.margin, 38);

    // Date on the right
    this.doc.setFontSize(10);
    const date = new Date().toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    this.doc.text(date, this.pageWidth - this.margin - 40, 38);

    this.currentY = 65;
  }

  // Draw footer
  drawFooter() {
    const y = this.pageHeight - 15;
    
    // Footer line
    this.doc.setDrawColor(...COLORS.lightGray);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, y - 5, this.pageWidth - this.margin, y - 5);

    // Footer text
    this.doc.setTextColor(...COLORS.gray);
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(COMPANY_INFO.website, this.margin, y);
    this.doc.text(
      `Page ${this.pageNumber}`,
      this.pageWidth - this.margin - 15,
      y
    );
  }

  // Draw section title
  drawSectionTitle(title, icon = '📊') {
    this.checkNewPage(25);
    
    // Background box
    this.doc.setFillColor(...COLORS.lightGray);
    this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 12, 3, 3, 'F');
    
    // Title text
    this.doc.setTextColor(...COLORS.dark);
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`${icon} ${title}`, this.margin + 5, this.currentY + 8);
    
    this.currentY += 18;
  }

  // Draw KPI cards row
  drawKPICards(kpis) {
    this.checkNewPage(35);
    
    const cardWidth = (this.pageWidth - 2 * this.margin - 15) / 4;
    const cardHeight = 28;
    
    kpis.forEach((kpi, index) => {
      const x = this.margin + (index % 4) * (cardWidth + 5);
      const y = this.currentY + Math.floor(index / 4) * (cardHeight + 5);
      
      // Card background
      this.doc.setFillColor(...COLORS.white);
      this.doc.setDrawColor(...COLORS.lightGray);
      this.doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'FD');
      
      // Color indicator
      const color = kpi.color || COLORS.coral;
      this.doc.setFillColor(...color);
      this.doc.roundedRect(x, y, 3, cardHeight, 3, 0, 'F');
      
      // Label
      this.doc.setTextColor(...COLORS.gray);
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(kpi.label, x + 8, y + 10);
      
      // Value
      this.doc.setTextColor(...COLORS.dark);
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(String(kpi.value), x + 8, y + 22);
      
      // Trend
      if (kpi.trend) {
        const trendColor = kpi.trend >= 0 ? COLORS.success : COLORS.error;
        this.doc.setTextColor(...trendColor);
        this.doc.setFontSize(8);
        this.doc.text(
          `${kpi.trend >= 0 ? '↑' : '↓'} ${Math.abs(kpi.trend)}%`,
          x + cardWidth - 15,
          y + 22
        );
      }
    });
    
    this.currentY += Math.ceil(kpis.length / 4) * (cardHeight + 5) + 10;
  }

  // Draw a simple bar chart (text-based representation)
  drawBarChart(title, data, options = {}) {
    this.checkNewPage(80);
    
    const chartHeight = options.height || 60;
    const chartWidth = this.pageWidth - 2 * this.margin;
    const barWidth = (chartWidth - 40) / data.length;
    const maxValue = Math.max(...data.map(d => d.value));
    
    // Title
    this.doc.setTextColor(...COLORS.dark);
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin, this.currentY);
    this.currentY += 10;
    
    // Chart area background
    this.doc.setFillColor(...COLORS.lightGray);
    this.doc.roundedRect(this.margin, this.currentY, chartWidth, chartHeight, 3, 3, 'F');
    
    // Draw bars
    data.forEach((item, index) => {
      const barHeight = (item.value / maxValue) * (chartHeight - 20);
      const x = this.margin + 20 + index * barWidth;
      const y = this.currentY + chartHeight - 10 - barHeight;
      
      // Bar
      const barColor = item.color || COLORS.coral;
      this.doc.setFillColor(...barColor);
      this.doc.roundedRect(x + 2, y, barWidth - 4, barHeight, 2, 2, 'F');
      
      // Label
      this.doc.setTextColor(...COLORS.gray);
      this.doc.setFontSize(7);
      this.doc.setFont('helvetica', 'normal');
      const labelX = x + barWidth / 2;
      this.doc.text(item.label.substring(0, 8), labelX, this.currentY + chartHeight - 2, { align: 'center' });
    });
    
    this.currentY += chartHeight + 15;
  }

  // Draw pie chart representation
  drawPieChartLegend(title, data) {
    this.checkNewPage(60);
    
    // Title
    this.doc.setTextColor(...COLORS.dark);
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin, this.currentY);
    this.currentY += 10;
    
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const legendY = this.currentY;
    
    data.forEach((item, index) => {
      const y = legendY + index * 10;
      const percentage = ((item.value / total) * 100).toFixed(1);
      const color = item.color || [COLORS.coral, COLORS.teal, COLORS.arches, COLORS.hof][index % 4];
      
      // Color dot
      this.doc.setFillColor(...color);
      this.doc.circle(this.margin + 3, y + 3, 3, 'F');
      
      // Label
      this.doc.setTextColor(...COLORS.dark);
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`${item.label}: ${percentage}%`, this.margin + 10, y + 5);
      
      // Progress bar
      const barX = this.margin + 80;
      const barWidth = 80;
      this.doc.setFillColor(...COLORS.lightGray);
      this.doc.roundedRect(barX, y, barWidth, 6, 2, 2, 'F');
      this.doc.setFillColor(...color);
      this.doc.roundedRect(barX, y, barWidth * (item.value / total), 6, 2, 2, 'F');
    });
    
    this.currentY = legendY + data.length * 10 + 15;
  }

  // Draw data table
  drawTable(title, headers, data, options = {}) {
    this.checkNewPage(50);
    
    if (title) {
      this.doc.setTextColor(...COLORS.dark);
      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(title, this.margin, this.currentY);
      this.currentY += 8;
    }
    
    this.doc.autoTable({
      startY: this.currentY,
      head: [headers],
      body: data,
      margin: { left: this.margin, right: this.margin },
      styles: {
        fontSize: 9,
        cellPadding: 4,
        font: 'helvetica',
      },
      headStyles: {
        fillColor: COLORS.coral,
        textColor: COLORS.white,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: COLORS.lightGray,
      },
      ...options,
    });
    
    this.currentY = this.doc.lastAutoTable.finalY + 10;
  }

  // Draw insights/recommendations
  drawInsights(insights) {
    this.checkNewPage(40);
    
    this.drawSectionTitle('💡 Insights & Recommandations');
    
    insights.forEach((insight, index) => {
      this.checkNewPage(20);
      
      const colors = {
        success: COLORS.success,
        warning: COLORS.warning,
        danger: COLORS.error,
        info: COLORS.teal,
      };
      const color = colors[insight.type] || COLORS.gray;
      
      // Insight box
      this.doc.setFillColor(...COLORS.white);
      this.doc.setDrawColor(...color);
      this.doc.setLineWidth(1);
      this.doc.roundedRect(
        this.margin,
        this.currentY,
        this.pageWidth - 2 * this.margin,
        15,
        3,
        3,
        'FD'
      );
      
      // Left color bar
      this.doc.setFillColor(...color);
      this.doc.roundedRect(this.margin, this.currentY, 4, 15, 3, 0, 'F');
      
      // Icon and text
      const icons = { success: '✓', warning: '⚠', danger: '!', info: 'ℹ' };
      this.doc.setTextColor(...COLORS.dark);
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(
        `${icons[insight.type] || '•'} ${insight.text}`,
        this.margin + 10,
        this.currentY + 10
      );
      
      this.currentY += 20;
    });
  }

  // Draw text paragraph
  drawParagraph(text, options = {}) {
    this.checkNewPage(20);
    
    this.doc.setTextColor(...(options.color || COLORS.gray));
    this.doc.setFontSize(options.fontSize || 10);
    this.doc.setFont('helvetica', options.fontStyle || 'normal');
    
    const lines = this.doc.splitTextToSize(text, this.pageWidth - 2 * this.margin);
    this.doc.text(lines, this.margin, this.currentY);
    this.currentY += lines.length * 5 + 5;
  }

  // Add footers to all pages
  finalizeDocument() {
    const totalPages = this.doc.internal.getNumberOfPages();
    
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      this.pageNumber = i;
      this.totalPages = totalPages;
      this.drawFooter();
    }
  }

  // Save the document
  save(filename) {
    this.finalizeDocument();
    this.doc.save(filename);
    return filename;
  }

  // Get blob for preview
  getBlob() {
    this.finalizeDocument();
    return this.doc.output('blob');
  }
}

/**
 * Generate role-based reports
 */
export const generateRoleBasedReport = async (role, data, options = {}) => {
  const pdf = new AirbnbPDFReport(options);
  
  switch (role) {
    case 'ADMIN':
      return generateAdminReport(pdf, data);
    case 'ANALYST':
      return generateAnalystReport(pdf, data);
    case 'VENDEUR':
      return generateVendeurReport(pdf, data);
    case 'INVESTOR':
      return generateInvestorReport(pdf, data);
    default:
      return generateGeneralReport(pdf, data);
  }
};

// Admin Report
const generateAdminReport = (pdf, data) => {
  pdf.drawHeader('Rapport Administrateur', 'Vue d\'ensemble complète');
  
  // Executive Summary
  pdf.drawSectionTitle('📈 Résumé Exécutif');
  pdf.drawKPICards([
    { label: 'Chiffre d\'Affaires', value: formatCurrency(data.totalRevenue || 0), trend: data.revenueTrend, color: COLORS.coral },
    { label: 'Total Ventes', value: formatNumber(data.totalSales || 0), trend: data.salesTrend, color: COLORS.teal },
    { label: 'Produits Actifs', value: formatNumber(data.totalProducts || 0), color: COLORS.arches },
    { label: 'Utilisateurs', value: formatNumber(data.totalUsers || 0), color: COLORS.hof },
  ]);
  
  // Sales by category
  if (data.categoryStats && data.categoryStats.length > 0) {
    pdf.drawBarChart('Ventes par Catégorie', data.categoryStats.map(c => ({
      label: c.name || 'Cat',
      value: c.revenue || 0,
      color: COLORS.coral,
    })));
  }
  
  // Top products table
  if (data.bestSellers && data.bestSellers.length > 0) {
    pdf.drawTable(
      'Top 10 Produits',
      ['Produit', 'Quantité', 'Revenue'],
      data.bestSellers.slice(0, 10).map(p => [
        p.productTitle || p.name || 'Produit',
        formatNumber(p.totalQuantity || p.quantity || 0),
        formatCurrency(p.revenue || 0),
      ])
    );
  }
  
  // Users by role
  if (data.usersByRole) {
    pdf.drawPieChartLegend('Répartition des Utilisateurs', 
      Object.entries(data.usersByRole).map(([role, count]) => ({
        label: role,
        value: count,
      }))
    );
  }
  
  // Insights
  pdf.drawInsights([
    { type: 'success', text: 'Le chiffre d\'affaires a augmenté de 15% ce mois-ci.' },
    { type: 'warning', text: '5 produits sont en rupture de stock imminente.' },
    { type: 'info', text: 'La catégorie Électronique représente 40% des ventes.' },
  ]);
  
  return pdf.save(`rapport_admin_${new Date().toISOString().split('T')[0]}.pdf`);
};

// Analyst Report
const generateAnalystReport = (pdf, data) => {
  pdf.drawHeader('Rapport Analyste', 'Analyse détaillée des performances');
  
  // KPIs
  pdf.drawSectionTitle('📊 Indicateurs Clés');
  pdf.drawKPICards([
    { label: 'CA Total', value: formatCurrency(data.totalRevenue || 0), trend: 12.5, color: COLORS.coral },
    { label: 'Panier Moyen', value: formatCurrency(data.averageBasket || 0), trend: 5.2, color: COLORS.teal },
    { label: 'Taux de Conversion', value: `${data.conversionRate || 0}%`, color: COLORS.arches },
    { label: 'Marge Moyenne', value: `${data.avgMargin || 0}%`, color: COLORS.hof },
  ]);
  
  // Sales trend
  if (data.salesTrend && data.salesTrend.length > 0) {
    pdf.drawBarChart('Évolution des Ventes (14 derniers jours)', data.salesTrend.map(s => ({
      label: new Date(s.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
      value: s.total || 0,
    })));
  }
  
  // Category analysis
  if (data.categoryStats) {
    pdf.addNewPage();
    pdf.drawSectionTitle('🏷️ Analyse par Catégorie');
    pdf.drawTable(
      null,
      ['Catégorie', 'Produits', 'Ventes', 'Revenue', 'Part %'],
      data.categoryStats.map(c => [
        c.name,
        formatNumber(c.productCount || 0),
        formatNumber(c.salesCount || 0),
        formatCurrency(c.revenue || 0),
        `${((c.revenue / data.totalRevenue) * 100 || 0).toFixed(1)}%`,
      ])
    );
  }
  
  // Product performance
  if (data.productPerformance) {
    pdf.drawSectionTitle('📦 Performance Produits');
    pdf.drawTable(
      null,
      ['Produit', 'Stock', 'Vendu', 'Revenue', 'Statut'],
      data.productPerformance.slice(0, 15).map(p => [
        p.name?.substring(0, 25) || 'Produit',
        formatNumber(p.stock || 0),
        formatNumber(p.sold || 0),
        formatCurrency(p.revenue || 0),
        p.status || 'Normal',
      ])
    );
  }
  
  // Recommendations
  pdf.addNewPage();
  pdf.drawInsights([
    { type: 'success', text: 'Les ventes du week-end représentent 35% du CA - optimisez les promotions.' },
    { type: 'warning', text: 'Le stock de 8 produits best-sellers doit être réapprovisionné.' },
    { type: 'info', text: 'Le panier moyen augmente de 8% avec des recommandations personnalisées.' },
    { type: 'danger', text: '3 produits n\'ont généré aucune vente ce mois - considérez leur retrait.' },
  ]);
  
  return pdf.save(`rapport_analyste_${new Date().toISOString().split('T')[0]}.pdf`);
};

// Vendeur Report
const generateVendeurReport = (pdf, data) => {
  pdf.drawHeader('Rapport Vendeur', 'Mes performances de vente');
  
  // Personal KPIs
  pdf.drawSectionTitle('🎯 Mes Performances');
  pdf.drawKPICards([
    { label: 'Mes Ventes', value: formatNumber(data.mySales || 0), trend: 8, color: COLORS.teal },
    { label: 'Mon CA', value: formatCurrency(data.myRevenue || 0), trend: 12, color: COLORS.coral },
    { label: 'Mon Objectif', value: `${data.targetProgress || 0}%`, color: COLORS.arches },
    { label: 'Classement', value: `#${data.rank || '-'}`, color: COLORS.hof },
  ]);
  
  // Daily sales
  if (data.dailySales && data.dailySales.length > 0) {
    pdf.drawBarChart('Mes Ventes Quotidiennes', data.dailySales.map(s => ({
      label: new Date(s.date).toLocaleDateString('fr-FR', { weekday: 'short' }),
      value: s.amount || 0,
      color: COLORS.teal,
    })));
  }
  
  // My best products
  if (data.myBestProducts && data.myBestProducts.length > 0) {
    pdf.drawTable(
      'Mes Meilleurs Produits',
      ['Produit', 'Quantité', 'Revenue'],
      data.myBestProducts.slice(0, 10).map(p => [
        p.name || 'Produit',
        formatNumber(p.quantity || 0),
        formatCurrency(p.revenue || 0),
      ])
    );
  }
  
  // Tips
  pdf.drawInsights([
    { type: 'success', text: 'Excellent ! Vous avez dépassé votre objectif de 15% ce mois.' },
    { type: 'info', text: 'Astuce: Les produits de la catégorie Électronique ont le meilleur taux de conversion.' },
  ]);
  
  return pdf.save(`rapport_vendeur_${new Date().toISOString().split('T')[0]}.pdf`);
};

// Investor Report
const generateInvestorReport = (pdf, data) => {
  pdf.drawHeader('Rapport Investisseur', 'Synthèse financière');
  
  // Financial KPIs
  pdf.drawSectionTitle('💰 Indicateurs Financiers');
  pdf.drawKPICards([
    { label: 'Chiffre d\'Affaires', value: formatCurrency(data.totalRevenue || 0), trend: 15, color: COLORS.coral },
    { label: 'Marge Brute', value: formatCurrency(data.grossMargin || 0), trend: 8, color: COLORS.teal },
    { label: 'Croissance YoY', value: `${data.yoyGrowth || 0}%`, color: COLORS.arches },
    { label: 'ROI', value: `${data.roi || 0}%`, color: COLORS.hof },
  ]);
  
  // Revenue breakdown
  pdf.drawPieChartLegend('Répartition du CA', [
    { label: 'Produits', value: data.productRevenue || 60, color: COLORS.coral },
    { label: 'Services', value: data.serviceRevenue || 25, color: COLORS.teal },
    { label: 'Autres', value: data.otherRevenue || 15, color: COLORS.arches },
  ]);
  
  // Monthly trend
  if (data.monthlyRevenue && data.monthlyRevenue.length > 0) {
    pdf.drawBarChart('Évolution Mensuelle du CA', data.monthlyRevenue.map(m => ({
      label: m.month,
      value: m.revenue || 0,
    })));
  }
  
  return pdf.save(`rapport_investisseur_${new Date().toISOString().split('T')[0]}.pdf`);
};

// General Report
const generateGeneralReport = (pdf, data) => {
  pdf.drawHeader('Rapport Général', 'Vue d\'ensemble');
  
  pdf.drawSectionTitle('📊 Statistiques');
  pdf.drawKPICards([
    { label: 'Ventes', value: formatNumber(data.totalSales || 0), color: COLORS.coral },
    { label: 'Revenue', value: formatCurrency(data.totalRevenue || 0), color: COLORS.teal },
    { label: 'Produits', value: formatNumber(data.totalProducts || 0), color: COLORS.arches },
    { label: 'Catégories', value: formatNumber(data.totalCategories || 0), color: COLORS.hof },
  ]);
  
  return pdf.save(`rapport_general_${new Date().toISOString().split('T')[0]}.pdf`);
};

// Format helpers
const formatCurrency = (value) => {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 0,
  }).format(value || 0);
};

const formatNumber = (value) => {
  return new Intl.NumberFormat('fr-FR').format(value || 0);
};

export { AirbnbPDFReport };
export default generateRoleBasedReport;
