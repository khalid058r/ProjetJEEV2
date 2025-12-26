import React, { useState, useMemo } from 'react';
import { 
  ChevronUp, ChevronDown, Search, Filter, Download, 
  ChevronLeft, ChevronRight, MoreHorizontal, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { formatCurrency, formatNumber, formatPercentage } from '../../utils/chartHelpers';

/**
 * Advanced Data Table Component
 */
const DataTable = ({
  data,
  columns,
  title = '',
  searchable = true,
  sortable = true,
  pagination = true,
  pageSize = 10,
  onRowClick = null,
  className = '',
  emptyMessage = 'Aucune donnée disponible'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);

  // Format cell value based on column configuration
  const formatCell = (value, column) => {
    if (value === null || value === undefined) return '-';
    
    if (column.format === 'currency') return formatCurrency(value);
    if (column.format === 'percentage') return formatPercentage(value);
    if (column.format === 'number') return formatNumber(value);
    if (column.render) return column.render(value);
    
    return value;
  };

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter(row => 
      columns.some(col => {
        const value = row[col.key];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
      })
    );
  }, [data, columns, searchTerm]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const comparison = String(aVal).localeCompare(String(bVal));
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortConfig]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize, pagination]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  // Handle sort
  const handleSort = (key) => {
    if (!sortable) return;
    
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Get trend indicator for numeric values with change
  const getTrendIndicator = (value, changeValue) => {
    if (changeValue === undefined || changeValue === null) return null;
    
    const isPositive = changeValue >= 0;
    return (
      <span className={`inline-flex items-center gap-0.5 text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        {formatPercentage(Math.abs(changeValue))}
      </span>
    );
  };

  return (
    <div className={`bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
          
          <div className="flex items-center gap-3">
            {searchable && (
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-48"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/50">
              {columns.map((column) => (
                <th
                  key={column.key}
                  onClick={() => sortable && column.sortable !== false && handleSort(column.key)}
                  className={`
                    px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider
                    ${sortable && column.sortable !== false ? 'cursor-pointer hover:bg-gray-100 select-none' : ''}
                    ${column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : ''}
                  `}
                  style={{ width: column.width }}
                >
                  <div className={`flex items-center gap-1 ${column.align === 'right' ? 'justify-end' : ''}`}>
                    {column.label}
                    {sortable && column.sortable !== false && sortConfig.key === column.key && (
                      <span className="text-blue-600">
                        {sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <tr 
                  key={rowIndex}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`
                    hover:bg-blue-50/30 transition-colors
                    ${onRowClick ? 'cursor-pointer' : ''}
                  `}
                >
                  {columns.map((column) => (
                    <td 
                      key={column.key}
                      className={`
                        px-6 py-4 text-sm text-gray-700
                        ${column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : ''}
                      `}
                    >
                      <div className="flex items-center gap-2">
                        {column.icon && row[column.iconKey || column.key] && (
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                            {column.icon}
                          </div>
                        )}
                        <div>
                          <span className={column.bold ? 'font-medium text-gray-900' : ''}>
                            {formatCell(row[column.key], column)}
                          </span>
                          {column.changeKey && getTrendIndicator(row[column.key], row[column.changeKey])}
                          {column.subtitle && row[column.subtitle] && (
                            <p className="text-xs text-gray-400 mt-0.5">{row[column.subtitle]}</p>
                          )}
                        </div>
                      </div>
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Affichage de {((currentPage - 1) * pageSize) + 1} à {Math.min(currentPage * pageSize, sortedData.length)} sur {sortedData.length} résultats
          </p>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`
                      w-8 h-8 rounded-lg text-sm font-medium transition-colors
                      ${currentPage === pageNum 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-600 hover:bg-gray-100'
                      }
                    `}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
