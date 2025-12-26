import React, { useState } from 'react';
import { AlertTriangle, Maximize2, Minimize2, Download, RefreshCw, Info, MoreHorizontal } from 'lucide-react';

/**
 * Enhanced Chart Wrapper Component
 * Modern container with loading states, fullscreen, and actions
 */
const ChartWrapper = ({ 
  title, 
  subtitle = null,
  children, 
  loading = false, 
  error = null,
  actions = null,
  className = '',
  height = 'auto',
  icon: Icon = null,
  onRefresh = null,
  onExport = null,
  tooltip = null,
  gradient = false,
  noPadding = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleFullscreen = () => {
    setIsExpanded(!isExpanded);
  };

  if (loading) {
    return (
      <div className={`bg-white border border-gray-100 rounded-2xl p-6 shadow-sm ${className}`}>
        <div className="flex justify-between items-start mb-6">
          <div className="animate-pulse">
            <div className="h-5 bg-gray-200 rounded-lg w-40 mb-2"></div>
            <div className="h-3 bg-gray-100 rounded-lg w-56"></div>
          </div>
        </div>
        <div className="flex items-center justify-center" style={{ height: height === 'auto' ? '300px' : height }}>
          <div className="text-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping"></div>
              <div className="relative inline-block rounded-full h-14 w-14 bg-gradient-to-tr from-blue-500 to-blue-600 animate-spin">
                <div className="absolute inset-2 bg-white rounded-full"></div>
              </div>
            </div>
            <p className="text-gray-500 mt-4 font-medium">Chargement des données...</p>
            <p className="text-gray-400 text-sm">Veuillez patienter</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white border border-gray-100 rounded-2xl p-6 shadow-sm ${className}`}>
        <h2 className="text-lg font-semibold mb-2 text-gray-900">{title}</h2>
        <div className="flex items-center justify-center" style={{ height: height === 'auto' ? '300px' : height }}>
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
              <AlertTriangle className="text-red-500" size={32} />
            </div>
            <p className="text-gray-800 font-semibold text-lg">Erreur de chargement</p>
            <p className="text-gray-500 text-sm mt-2">{error}</p>
            {onRefresh && (
              <button 
                onClick={onRefresh}
                className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2"
              >
                <RefreshCw size={14} />
                Réessayer
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const wrapperContent = (
    <div className={`
      ${isExpanded 
        ? 'fixed inset-4 z-50 bg-white rounded-2xl shadow-2xl overflow-auto' 
        : `bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 ${className}`
      }
      ${gradient ? 'bg-gradient-to-br from-white to-gray-50/50' : ''}
      ${noPadding ? '' : 'p-6'}
    `}>
      {/* Header */}
      <div className={`flex justify-between items-start ${noPadding ? 'px-6 pt-6' : ''} mb-4`}>
        <div className="flex items-start gap-3">
          {Icon && (
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Icon size={20} />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
              {tooltip && (
                <div className="group relative">
                  <Info size={14} className="text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-10">
                    {tooltip}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              )}
            </div>
            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2">
          {actions}
          
          {/* Quick actions menu */}
          <div className="flex items-center gap-1">
            {onRefresh && (
              <button 
                onClick={onRefresh}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Actualiser"
              >
                <RefreshCw size={16} />
              </button>
            )}
            {onExport && (
              <button 
                onClick={onExport}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Exporter"
              >
                <Download size={16} />
              </button>
            )}
            <button 
              onClick={handleFullscreen}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title={isExpanded ? "Réduire" : "Agrandir"}
            >
              {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div 
        className={noPadding ? '' : ''}
        style={{ height: isExpanded ? 'calc(100% - 80px)' : (height === 'auto' ? 'auto' : height) }}
      >
        {children}
      </div>
    </div>
  );

  return (
    <>
      {wrapperContent}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" 
          onClick={() => setIsExpanded(false)}
        />
      )}
    </>
  );
};

export default ChartWrapper;
