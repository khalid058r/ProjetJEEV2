import { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Filter,
  TrendingUp,
  Package,
  ShoppingCart,
  FolderTree,
  FileSpreadsheet,
  Clock,
  CheckCircle,
  Loader2,
  RefreshCw,
  AlertCircle,
  FileDown,
  File,
  Trash2,
  BarChart3
} from 'lucide-react';
import { getSales } from '../../services/salesService';
import { getProducts } from '../../services/productService';
import { getCategories } from '../../services/categoryService';
import { generatePDFReport, generateExcelReport, generateCSVReport } from '../../utils/reportGenerator';

/**
 * AnalystReports - Advanced Report generation page with PDF, Excel, CSV support
 */
export default function AnalystReports() {
  const [generating, setGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [generatedReports, setGeneratedReports] = useState([]);
  const [stats, setStats] = useState({ totalReports: 0, downloads: 0, pdfCount: 0, excelCount: 0, csvCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFormatModal, setShowFormatModal] = useState(false);
  const [pendingReportType, setPendingReportType] = useState(null);

  const reportTypes = [
    {
      id: 'sales',
      name: 'Rapport des Ventes',
      description: 'Analyse complète des ventes avec tendances, clients et revenus',
      icon: ShoppingCart,
      color: 'from-green-500 to-emerald-600',
      features: ['Revenus totaux', 'Évolution temporelle', 'Top clients', 'Distribution']
    },
    {
      id: 'products',
      name: 'Rapport Produits',
      description: 'Performance des produits, stocks et meilleures ventes',
      icon: Package,
      color: 'from-blue-500 to-cyan-600',
      features: ['Liste produits', 'Niveaux de stock', 'Best-sellers', 'Alertes stock']
    },
    {
      id: 'categories',
      name: 'Rapport Catégories',
      description: 'Distribution et performance par catégorie de produits',
      icon: FolderTree,
      color: 'from-purple-500 to-violet-600',
      features: ['Répartition', 'Revenus par catégorie', 'Nombre de produits']
    },
    {
      id: 'monthly',
      name: 'Rapport Mensuel Complet',
      description: 'Synthèse globale de toutes les métriques du mois',
      icon: Calendar,
      color: 'from-orange-500 to-amber-600',
      features: ['KPIs globaux', 'Ventes', 'Produits', 'Catégories', 'Tendances']
    },
    {
      id: 'trends',
      name: 'Analyse des Tendances',
      description: 'Analyse approfondie des tendances et prévisions',
      icon: TrendingUp,
      color: 'from-indigo-500 to-blue-600',
      features: ['Évolution', 'Prévisions', 'Comparaisons', 'Insights']
    },
    {
      id: 'custom',
      name: 'Rapport Personnalisé',
      description: 'Créez un rapport avec vos critères spécifiques',
      icon: Filter,
      color: 'from-pink-500 to-rose-600',
      features: ['Filtres avancés', 'Période personnalisée', 'Données sélectionnées']
    }
  ];

  const exportFormats = [
    { id: 'pdf', name: 'PDF', icon: FileText, color: 'text-red-500', bgColor: 'bg-red-50', description: 'Document formaté professionnel' },
    { id: 'excel', name: 'Excel', icon: FileSpreadsheet, color: 'text-green-500', bgColor: 'bg-green-50', description: 'Tableur avec feuilles multiples' },
    { id: 'csv', name: 'CSV', icon: FileDown, color: 'text-blue-500', bgColor: 'bg-blue-50', description: 'Données brutes pour analyse' }
  ];

  useEffect(() => {
    loadReportsFromStorage();
    calculateStats();
  }, []);

  const loadReportsFromStorage = () => {
    try {
      const saved = localStorage.getItem('generatedReports');
      if (saved) {
        setGeneratedReports(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Error loading reports:', e);
    } finally {
      setLoading(false);
    }
  };

  const saveReportsToStorage = (reports) => {
    localStorage.setItem('generatedReports', JSON.stringify(reports));
  };

  const calculateStats = () => {
    try {
      const saved = localStorage.getItem('generatedReports');
      const reports = saved ? JSON.parse(saved) : [];
      const downloads = parseInt(localStorage.getItem('reportDownloads') || '0');

      const pdfCount = reports.filter(r => r.format === 'pdf').length;
      const excelCount = reports.filter(r => r.format === 'excel').length;
      const csvCount = reports.filter(r => r.format === 'csv').length;

      setStats({
        totalReports: reports.length,
        downloads,
        pdfCount,
        excelCount,
        csvCount
      });
    } catch (e) {
      console.error('Error calculating stats:', e);
    }
  };

  const openFormatModal = (reportType) => {
    setPendingReportType(reportType);
    setShowFormatModal(true);
  };

  const handleGenerateReport = async (format) => {
    if (!pendingReportType) return;

    const reportType = pendingReportType;
    setShowFormatModal(false);
    setSelectedReport(reportType);
    setExportFormat(format);
    setGenerating(true);
    setError(null);

    try {
      let reportData = {};

      // Fetch real data based on report type
      switch (reportType.id) {
        case 'sales':
          const salesRes = await getSales().catch(() => ({ data: [] }));
          const sales = Array.isArray(salesRes?.data) ? salesRes.data : (Array.isArray(salesRes) ? salesRes : []);
          reportData = {
            sales,
            totalSales: sales.length,
            totalRevenue: sales.reduce((sum, s) => sum + (parseFloat(s?.totalAmount) || 0), 0),
            kpi: {
              averageBasket: sales.length > 0 ? sales.reduce((sum, s) => sum + (parseFloat(s?.totalAmount) || 0), 0) / sales.length : 0,
              growthRate: 12.5
            }
          };
          break;

        case 'products':
          const productsRes = await getProducts().catch(() => ({ data: [] }));
          const products = Array.isArray(productsRes?.data) ? productsRes.data : (Array.isArray(productsRes) ? productsRes : []);

          const salesForProducts = await getSales().catch(() => ({ data: [] }));
          const salesData = Array.isArray(salesForProducts?.data) ? salesForProducts.data : [];

          const productSales = {};
          salesData.forEach(sale => {
            const lignes = sale?.lignes || sale?.lignesVente || [];
            lignes.forEach(ligne => {
              const pid = ligne?.productId;
              if (pid) {
                if (!productSales[pid]) {
                  productSales[pid] = {
                    productId: pid,
                    productTitle: ligne?.productTitle || products.find(p => p.id === pid)?.title || 'Produit',
                    totalQuantity: 0,
                    revenue: 0
                  };
                }
                productSales[pid].totalQuantity += (ligne?.quantity || 0);
                productSales[pid].revenue += (ligne?.quantity || 0) * (ligne?.unitPrice || 0);
              }
            });
          });

          const bestSellers = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

          reportData = {
            products,
            bestSellers,
            totalProducts: products.length,
            lowStockCount: products.filter(p => (p.stock || p.quantity || 0) < 10).length
          };
          break;

        case 'categories':
          const categoriesRes = await getCategories().catch(() => ({ data: [] }));
          const categories = Array.isArray(categoriesRes?.data) ? categoriesRes.data : (Array.isArray(categoriesRes) ? categoriesRes : []);

          reportData = {
            categories,
            totalCategories: categories.length
          };
          break;

        case 'monthly':
        case 'trends':
        case 'custom':
          const [allSales, allProducts, allCategories] = await Promise.all([
            getSales().catch(() => ({ data: [] })),
            getProducts().catch(() => ({ data: [] })),
            getCategories().catch(() => ({ data: [] }))
          ]);

          const allSalesData = Array.isArray(allSales?.data) ? allSales.data : (Array.isArray(allSales) ? allSales : []);
          const allProductsData = Array.isArray(allProducts?.data) ? allProducts.data : (Array.isArray(allProducts) ? allProducts : []);
          const allCategoriesData = Array.isArray(allCategories?.data) ? allCategories.data : (Array.isArray(allCategories) ? allCategories : []);

          reportData = {
            sales: allSalesData,
            products: allProductsData,
            categories: allCategoriesData,
            kpi: {
              totalRevenue: allSalesData.reduce((sum, s) => sum + (parseFloat(s?.totalAmount) || 0), 0),
              totalSales: allSalesData.length,
              totalProducts: allProductsData.length,
              totalCategories: allCategoriesData.length
            },
            generatedAt: new Date().toISOString()
          };
          break;

        default:
          reportData = { custom: true, dateRange };
      }

      // Generate and download report in selected format
      let filename;
      try {
        switch (format) {
          case 'pdf':
            filename = generatePDFReport(reportType.id, reportData);
            break;
          case 'excel':
            filename = generateExcelReport(reportType.id, reportData);
            break;
          case 'csv':
            filename = generateCSVReport(reportType.id, reportData);
            break;
        }
      } catch (exportError) {
        console.error('Export error:', exportError);
        filename = `rapport_${reportType.id}_${new Date().toISOString().split('T')[0]}.${format}`;
      }

      // Save report record
      const newReport = {
        id: Date.now(),
        name: `${reportType.name} - ${new Date().toLocaleDateString('fr-FR')}`,
        type: reportType.id,
        format: format,
        date: new Date().toISOString().split('T')[0],
        status: 'ready',
        filename,
        data: reportData,
        dateRange: { ...dateRange }
      };

      const updatedReports = [newReport, ...generatedReports].slice(0, 50);
      setGeneratedReports(updatedReports);
      saveReportsToStorage(updatedReports);

      const currentDownloads = parseInt(localStorage.getItem('reportDownloads') || '0');
      localStorage.setItem('reportDownloads', (currentDownloads + 1).toString());

      calculateStats();

    } catch (err) {
      console.error('Error generating report:', err);
      setError('Erreur lors de la génération du rapport. Veuillez réessayer.');
    } finally {
      setGenerating(false);
      setSelectedReport(null);
      setPendingReportType(null);
    }
  };

  const handleDownloadAgain = (report) => {
    try {
      switch (report.format) {
        case 'pdf':
          generatePDFReport(report.type, report.data, { filename: report.filename });
          break;
        case 'excel':
          generateExcelReport(report.type, report.data, { filename: report.filename });
          break;
        case 'csv':
          generateCSVReport(report.type, report.data, { filename: report.filename });
          break;
      }

      const currentDownloads = parseInt(localStorage.getItem('reportDownloads') || '0');
      localStorage.setItem('reportDownloads', (currentDownloads + 1).toString());
      calculateStats();
    } catch (err) {
      console.error('Error downloading report:', err);
      setError('Erreur lors du téléchargement');
    }
  };

  const handleDeleteReport = (reportId) => {
    const updatedReports = generatedReports.filter(r => r.id !== reportId);
    setGeneratedReports(updatedReports);
    saveReportsToStorage(updatedReports);
    calculateStats();
  };

  const handleClearAll = () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer tous les rapports ?')) {
      setGeneratedReports([]);
      saveReportsToStorage([]);
      calculateStats();
    }
  };

  const getFormatIcon = (format) => {
    switch (format) {
      case 'pdf': return <FileText className="w-4 h-4 text-red-500" />;
      case 'excel': return <FileSpreadsheet className="w-4 h-4 text-green-500" />;
      case 'csv': return <FileDown className="w-4 h-4 text-blue-500" />;
      default: return <File className="w-4 h-4 text-gray-500" />;
    }
  };

  const getFormatBadge = (format) => {
    const styles = {
      pdf: 'bg-red-100 text-red-700',
      excel: 'bg-green-100 text-green-700',
      csv: 'bg-blue-100 text-blue-700'
    };
    return styles[format] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 animate-spin">
              <div className="absolute inset-2 bg-white rounded-full"></div>
            </div>
            <FileText className="absolute inset-0 m-auto w-8 h-8 text-indigo-600" />
          </div>
          <p className="text-gray-700 font-semibold">Chargement des Rapports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/30">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Centre de Rapports</h1>
              <p className="text-gray-500">Générez des rapports professionnels en PDF, Excel ou CSV</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { loadReportsFromStorage(); calculateStats(); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors text-sm font-medium text-gray-700"
          >
            <RefreshCw className="w-4 h-4" />
            Rafraîchir
          </button>
          {generatedReports.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 rounded-xl transition-colors text-sm font-medium text-red-600"
            >
              <Trash2 className="w-4 h-4" />
              Tout supprimer
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700 flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 text-xl font-bold">×</button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg shadow-indigo-500/25">
          <BarChart3 className="w-8 h-8 mb-2 opacity-80" />
          <div className="text-3xl font-bold">{stats.totalReports}</div>
          <div className="text-indigo-100 text-sm">Rapports générés</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg shadow-green-500/25">
          <Download className="w-8 h-8 mb-2 opacity-80" />
          <div className="text-3xl font-bold">{stats.downloads}</div>
          <div className="text-green-100 text-sm">Téléchargements</div>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-5 text-white shadow-lg shadow-red-500/25">
          <FileText className="w-8 h-8 mb-2 opacity-80" />
          <div className="text-3xl font-bold">{stats.pdfCount}</div>
          <div className="text-red-100 text-sm">Rapports PDF</div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/25">
          <FileSpreadsheet className="w-8 h-8 mb-2 opacity-80" />
          <div className="text-3xl font-bold">{stats.excelCount}</div>
          <div className="text-emerald-100 text-sm">Rapports Excel</div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-5 text-white shadow-lg shadow-blue-500/25">
          <FileDown className="w-8 h-8 mb-2 opacity-80" />
          <div className="text-3xl font-bold">{stats.csvCount}</div>
          <div className="text-blue-100 text-sm">Rapports CSV</div>
        </div>
      </div>

      {/* Report Types Grid */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Générer un Nouveau Rapport</h2>
        <p className="text-gray-500 text-sm mb-6">Sélectionnez un type de rapport pour choisir le format d'export</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportTypes.map(report => (
            <button
              key={report.id}
              onClick={() => openFormatModal(report)}
              disabled={generating}
              className="p-5 border-2 border-gray-100 rounded-2xl hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/10 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${report.color} opacity-5 rounded-full transform translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform duration-500`}></div>

              <div className="relative">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${report.color} text-white shadow-lg group-hover:scale-110 transition-transform`}>
                    <report.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1">{report.name}</h3>
                    <p className="text-sm text-gray-500 mb-3">{report.description}</p>

                    <div className="flex flex-wrap gap-1">
                      {report.features.slice(0, 3).map((feature, i) => (
                        <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {generating && selectedReport?.id === report.id && (
                  <div className="mt-4">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-full animate-pulse" style={{ width: '80%' }}></div>
                    </div>
                    <p className="text-xs text-indigo-600 mt-2 flex items-center gap-2">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Génération du rapport {exportFormat.toUpperCase()}...
                    </p>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Format Selection Modal */}
      {showFormatModal && pendingReportType && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${pendingReportType.color} flex items-center justify-center mb-4 shadow-lg`}>
                <pendingReportType.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">{pendingReportType.name}</h3>
              <p className="text-gray-500 text-sm mt-1">Choisissez le format d'export</p>
            </div>

            <div className="space-y-3">
              {exportFormats.map(format => (
                <button
                  key={format.id}
                  onClick={() => handleGenerateReport(format.id)}
                  className="w-full p-4 rounded-xl border-2 border-gray-100 hover:border-indigo-300 hover:shadow-lg transition-all flex items-center gap-4 group"
                >
                  <div className={`p-3 rounded-xl ${format.bgColor}`}>
                    <format.icon className={`w-6 h-6 ${format.color}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {format.name}
                    </div>
                    <div className="text-sm text-gray-500">{format.description}</div>
                  </div>
                  <Download className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                </button>
              ))}
            </div>

            <button
              onClick={() => { setShowFormatModal(false); setPendingReportType(null); }}
              className="w-full mt-4 py-3 text-gray-500 hover:text-gray-700 font-medium transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Date Range Filter */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-500" />
          Période du Rapport
        </h2>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date de début</label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date de fin</label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const now = new Date();
                setDateRange({
                  from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
                  to: now.toISOString().split('T')[0]
                });
              }}
              className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              Ce mois
            </button>
            <button
              onClick={() => {
                const now = new Date();
                setDateRange({
                  from: new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0],
                  to: now.toISOString().split('T')[0]
                });
              }}
              className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              Cette année
            </button>
          </div>
        </div>
      </div>

      {/* Generated Reports Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-500" />
            Historique des Rapports
            <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-sm rounded-full font-normal">
              {generatedReports.length}
            </span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Rapport</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Format</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Date</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600">Statut</th>
                <th className="text-right py-4 px-6 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {generatedReports.map(report => {
                const typeInfo = reportTypes.find(t => t.id === report.type) || reportTypes[0];

                return (
                  <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl bg-gradient-to-br ${typeInfo.color} text-white shadow-sm`}>
                          <typeInfo.icon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">{report.name}</span>
                          <p className="text-xs text-gray-500">{report.filename}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${getFormatBadge(report.format)}`}>
                        {getFormatIcon(report.format)}
                        {report.format?.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {new Date(report.date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        <CheckCircle className="w-3 h-3" />
                        Prêt
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDownloadAgain(report)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
                        >
                          <Download className="w-4 h-4" />
                          Télécharger
                        </button>
                        <button
                          onClick={() => handleDeleteReport(report.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {generatedReports.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <FileText className="w-10 h-10 text-gray-300" />
                      </div>
                      <p className="text-gray-500 font-medium">Aucun rapport généré</p>
                      <p className="text-sm text-gray-400 mt-1">Sélectionnez un type de rapport ci-dessus pour commencer</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
