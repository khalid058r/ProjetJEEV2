import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, FileDown } from 'lucide-react';
import { exportToPDF, exportToExcel, exportToCSV } from '../../utils/exportHelpers';
import toast from 'react-hot-toast';

/**
 * Export Button Component
 * Provides dropdown menu for exporting data in multiple formats
 */
const ExportButton = ({ 
  data, 
  filename = 'analytics_export', 
  title = 'Analytics Report',
  pdfSections = null,
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleExport = (format) => {
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const fullFilename = `${filename}_${timestamp}`;

      switch (format) {
        case 'pdf':
          if (pdfSections) {
            exportToPDF(title, pdfSections, `${fullFilename}.pdf`);
          } else {
            toast.error('PDF export not configured for this view');
            return;
          }
          break;
        case 'excel':
          exportToExcel(data, `${fullFilename}.xlsx`, 'Analytics Data');
          break;
        case 'csv':
          exportToCSV(data, `${fullFilename}.csv`);
          break;
        default:
          toast.error('Unknown export format');
          return;
      }

      toast.success(`Exported successfully as ${format.toUpperCase()}`);
      setIsOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium text-sm shadow-sm"
      >
        <Download size={18} />
        <span>Export</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          ></div>
          
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
            <button
              onClick={() => handleExport('pdf')}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
            >
              <FileText size={16} className="text-red-500" />
              <span>Export as PDF</span>
            </button>
            
            <button
              onClick={() => handleExport('excel')}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
            >
              <FileSpreadsheet size={16} className="text-green-500" />
              <span>Export as Excel</span>
            </button>
            
            <button
              onClick={() => handleExport('csv')}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
            >
              <FileDown size={16} className="text-blue-500" />
              <span>Export as CSV</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ExportButton;
