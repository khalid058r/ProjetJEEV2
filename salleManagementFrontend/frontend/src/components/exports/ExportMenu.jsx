import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  FileText,
  FileSpreadsheet,
  File,
  ChevronDown,
  Loader2,
} from "lucide-react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

const EXPORT_FORMATS = [
  { id: "csv", label: "CSV", icon: FileText, extension: ".csv" },
  { id: "excel", label: "Excel", icon: FileSpreadsheet, extension: ".xlsx" },
  { id: "pdf", label: "PDF", icon: File, extension: ".pdf" },
];

export default function ExportMenu({
  data,
  columns,
  filename = "export",
  title = "Export",
  formats = ["csv", "excel", "pdf"],
  onExport,
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState(null);

  const availableFormats = EXPORT_FORMATS.filter((f) => formats.includes(f.id));

  const handleExport = async (formatId) => {
    setExporting(formatId);

    try {
      const timestamp = format(new Date(), "yyyy-MM-dd_HH-mm");
      const fullFilename = `${filename}_${timestamp}`;

      switch (formatId) {
        case "csv":
          await exportToCSV(data, columns, fullFilename);
          break;
        case "excel":
          await exportToExcel(data, columns, fullFilename, title);
          break;
        case "pdf":
          await exportToPDF(data, columns, fullFilename, title);
          break;
      }

      onExport?.(formatId);
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setExporting(null);
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
      >
        <Download className="w-4 h-4" />
        Exporter
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden z-50"
            >
              <div className="p-2">
                {availableFormats.map((format) => {
                  const Icon = format.icon;
                  const isExporting = exporting === format.id;

                  return (
                    <button
                      key={format.id}
                      onClick={() => handleExport(format.id)}
                      disabled={isExporting}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isExporting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                      {format.label}
                      <span className="ml-auto text-xs text-gray-400">
                        {format.extension}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Export to CSV
async function exportToCSV(data, columns, filename) {
  const headers = columns.map((col) => col.header);
  const rows = data.map((row) =>
    columns.map((col) => {
      const value = row[col.accessor];
      // Escape quotes and wrap in quotes if contains comma
      if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value ?? "";
    })
  );

  const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

  // Add BOM for UTF-8
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });

  downloadBlob(blob, `${filename}.csv`);
}

// Export to Excel
async function exportToExcel(data, columns, filename, title) {
  const headers = columns.map((col) => col.header);
  const rows = data.map((row) =>
    columns.map((col) => row[col.accessor] ?? "")
  );

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // Style header row
  const range = XLSX.utils.decode_range(worksheet["!ref"]);
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_cell({ r: 0, c: C });
    if (!worksheet[address]) continue;
    worksheet[address].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: "4F46E5" } },
    };
  }

  // Auto column width
  worksheet["!cols"] = columns.map(() => ({ wch: 15 }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, title || "Data");

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

// Export to PDF
async function exportToPDF(data, columns, filename, title) {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(title || "Rapport", 14, 20);

  // Subtitle with date
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`Généré le ${format(new Date(), "dd/MM/yyyy à HH:mm")}`, 14, 28);

  // Table
  const headers = columns.map((col) => col.header);
  const rows = data.map((row) =>
    columns.map((col) => {
      const value = row[col.accessor];
      return value?.toString() ?? "";
    })
  );

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 35,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
  });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Page ${i} / ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  doc.save(`${filename}.pdf`);
}

// Helper to download blob
function downloadBlob(blob, filename) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

// Simple export button (single format)
export function ExportButton({ onClick, loading = false, label = "Exporter", className = "" }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors text-sm font-medium disabled:opacity-50 ${className}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      {label}
    </button>
  );
}
