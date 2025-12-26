import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Filter,
  Download,
  MoreHorizontal,
} from "lucide-react";
import { TableSkeleton } from "../common/LoadingScreen";

export default function DataTable({
  columns,
  data,
  loading = false,
  emptyMessage = "Aucune donnée disponible",
  emptyIcon = "📭",
  searchable = false,
  searchPlaceholder = "Rechercher...",
  filterable = false,
  exportable = false,
  onExport,
  pagination = true,
  pageSize = 10,
  pageSizeOptions = [5, 10, 25, 50],
  onRowClick,
  selectedRow,
  stickyHeader = false,
  className = "",
}) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);

  // Handle sorting
  const handleSort = (key) => {
    if (!key) return;
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Filter and sort data
  const processedData = useMemo(() => {
    let result = [...(data || [])];

    // Search filter
    if (searchQuery && searchable) {
      const query = searchQuery.toLowerCase();
      result = result.filter((row) =>
        columns.some((col) => {
          const value = col.accessor ? row[col.accessor] : null;
          return value?.toString().toLowerCase().includes(query);
        })
      );
    }

    // Sort
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];

        if (aVal == null) return 1;
        if (bVal == null) return -1;

        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
        }

        const comparison = aVal.toString().localeCompare(bVal.toString());
        return sortConfig.direction === "asc" ? comparison : -comparison;
      });
    }

    return result;
  }, [data, searchQuery, sortConfig, columns, searchable]);

  // Pagination
  const totalPages = Math.ceil(processedData.length / currentPageSize);
  const paginatedData = pagination
    ? processedData.slice(
        currentPage * currentPageSize,
        (currentPage + 1) * currentPageSize
      )
    : processedData;

  // Reset to first page when data changes
  useMemo(() => {
    setCurrentPage(0);
  }, [searchQuery, currentPageSize]);

  if (loading) {
    return <TableSkeleton rows={pageSize} columns={columns.length} />;
  }

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden ${className}`}>
      {/* Toolbar */}
      {(searchable || filterable || exportable) && (
        <div className="flex items-center justify-between gap-4 p-4 border-b border-gray-100 dark:border-slate-700">
          {/* Search */}
          {searchable && (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400"
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            {filterable && (
              <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-slate-700 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors">
                <Filter className="w-4 h-4" />
                Filtres
              </button>
            )}

            {exportable && (
              <button
                onClick={onExport}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-slate-700 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
              >
                <Download className="w-4 h-4" />
                Exporter
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={`bg-gray-50 dark:bg-slate-700/50 ${stickyHeader ? "sticky top-0 z-10" : ""}`}>
            <tr>
              {columns.map((column, index) => (
                <th
                  key={column.accessor || index}
                  onClick={() => column.sortable !== false && handleSort(column.accessor)}
                  className={`
                    px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider
                    text-gray-500 dark:text-gray-400
                    ${column.sortable !== false ? "cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none" : ""}
                    ${column.width || ""}
                  `}
                >
                  <div className="flex items-center gap-2">
                    {column.header}
                    {column.sortable !== false && sortConfig.key === column.accessor && (
                      sortConfig.direction === "asc" ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-16 text-center">
                  <div className="text-4xl mb-3">{emptyIcon}</div>
                  <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <motion.tr
                  key={row.id || rowIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: rowIndex * 0.02 }}
                  onClick={() => onRowClick?.(row)}
                  className={`
                    ${onRowClick ? "cursor-pointer" : ""}
                    ${selectedRow?.id === row.id ? "bg-blue-50 dark:bg-blue-900/20" : "hover:bg-gray-50 dark:hover:bg-slate-700/50"}
                    transition-colors
                  `}
                >
                  {columns.map((column, colIndex) => (
                    <td
                      key={column.accessor || colIndex}
                      className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap"
                    >
                      {column.render
                        ? column.render(row[column.accessor], row)
                        : row[column.accessor] ?? "-"}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && processedData.length > 0 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-4">
            <select
              value={currentPageSize}
              onChange={(e) => setCurrentPageSize(Number(e.target.value))}
              className="text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size} par page
                </option>
              ))}
            </select>

            <span className="text-sm text-gray-500 dark:text-gray-400">
              {currentPage * currentPageSize + 1} -{" "}
              {Math.min((currentPage + 1) * currentPageSize, processedData.length)} sur{" "}
              {processedData.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(0)}
              disabled={currentPage === 0}
              className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => p - 1)}
              disabled={currentPage === 0}
              className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              {currentPage + 1} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={currentPage >= totalPages - 1}
              className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages - 1)}
              disabled={currentPage >= totalPages - 1}
              className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
