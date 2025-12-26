import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  ChevronDown,
  X,
  Filter,
  RotateCcw,
  Check,
} from "lucide-react";
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfYear } from "date-fns";
import { fr } from "date-fns/locale";

// Preset date ranges
const DATE_PRESETS = [
  { label: "Aujourd'hui", getValue: () => ({ start: new Date(), end: new Date() }) },
  { label: "7 derniers jours", getValue: () => ({ start: subDays(new Date(), 7), end: new Date() }) },
  { label: "30 derniers jours", getValue: () => ({ start: subDays(new Date(), 30), end: new Date() }) },
  { label: "Ce mois", getValue: () => ({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) }) },
  { label: "Mois dernier", getValue: () => ({ start: startOfMonth(subMonths(new Date(), 1)), end: endOfMonth(subMonths(new Date(), 1)) }) },
  { label: "Cette année", getValue: () => ({ start: startOfYear(new Date()), end: new Date() }) },
];

export default function FilterPanel({
  filters = [],
  values = {},
  onChange,
  onReset,
  onApply,
  showApplyButton = false,
  className = "",
}) {
  const [localValues, setLocalValues] = useState(values);
  const [expandedFilter, setExpandedFilter] = useState(null);

  // Sync with external values
  useEffect(() => {
    setLocalValues(values);
  }, [values]);

  const handleChange = (key, value) => {
    const newValues = { ...localValues, [key]: value };
    setLocalValues(newValues);
    if (!showApplyButton) {
      onChange?.(newValues);
    }
  };

  const handleReset = () => {
    const resetValues = {};
    filters.forEach((f) => {
      resetValues[f.key] = f.defaultValue ?? null;
    });
    setLocalValues(resetValues);
    onReset?.();
    if (!showApplyButton) {
      onChange?.(resetValues);
    }
  };

  const handleApply = () => {
    onChange?.(localValues);
    onApply?.(localValues);
  };

  const activeFiltersCount = useMemo(() => {
    return Object.entries(localValues).filter(([key, value]) => {
      const filter = filters.find((f) => f.key === key);
      if (!filter) return false;
      if (value === null || value === undefined || value === "") return false;
      if (Array.isArray(value) && value.length === 0) return false;
      if (filter.defaultValue !== undefined && value === filter.defaultValue) return false;
      return true;
    }).length;
  }, [localValues, filters]);

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Filtres</h3>
          {activeFiltersCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
              {activeFiltersCount} actif{activeFiltersCount > 1 ? "s" : ""}
            </span>
          )}
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Réinitialiser
        </button>
      </div>

      {/* Filter Controls */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filters.map((filter) => (
          <FilterControl
            key={filter.key}
            filter={filter}
            value={localValues[filter.key]}
            onChange={(value) => handleChange(filter.key, value)}
            expanded={expandedFilter === filter.key}
            onToggleExpand={() =>
              setExpandedFilter(expandedFilter === filter.key ? null : filter.key)
            }
          />
        ))}
      </div>

      {/* Apply Button */}
      {showApplyButton && (
        <div className="flex justify-end px-6 py-4 border-t border-gray-100 dark:border-slate-700">
          <button
            onClick={handleApply}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Appliquer les filtres
          </button>
        </div>
      )}
    </div>
  );
}

// Individual filter control renderer
function FilterControl({ filter, value, onChange, expanded, onToggleExpand }) {
  switch (filter.type) {
    case "select":
      return (
        <SelectFilter
          label={filter.label}
          options={filter.options}
          value={value}
          onChange={onChange}
          placeholder={filter.placeholder}
          multiple={filter.multiple}
        />
      );

    case "dateRange":
      return (
        <DateRangeFilter
          label={filter.label}
          value={value}
          onChange={onChange}
          expanded={expanded}
          onToggle={onToggleExpand}
        />
      );

    case "range":
      return (
        <RangeFilter
          label={filter.label}
          value={value}
          onChange={onChange}
          min={filter.min}
          max={filter.max}
          step={filter.step}
          prefix={filter.prefix}
          suffix={filter.suffix}
        />
      );

    case "search":
      return (
        <SearchFilter
          label={filter.label}
          value={value}
          onChange={onChange}
          placeholder={filter.placeholder}
        />
      );

    case "checkbox":
      return (
        <CheckboxFilter
          label={filter.label}
          options={filter.options}
          value={value || []}
          onChange={onChange}
        />
      );

    default:
      return null;
  }
}

// Select Filter
function SelectFilter({ label, options = [], value, onChange, placeholder = "Sélectionner...", multiple = false }) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedLabels = useMemo(() => {
    if (!value) return placeholder;
    if (multiple && Array.isArray(value)) {
      if (value.length === 0) return placeholder;
      if (value.length === 1) {
        return options.find((o) => o.value === value[0])?.label || value[0];
      }
      return `${value.length} sélectionnés`;
    }
    return options.find((o) => o.value === value)?.label || value;
  }, [value, options, placeholder, multiple]);

  const handleSelect = (optionValue) => {
    if (multiple) {
      const currentValue = Array.isArray(value) ? value : [];
      const newValue = currentValue.includes(optionValue)
        ? currentValue.filter((v) => v !== optionValue)
        : [...currentValue, optionValue];
      onChange(newValue);
    } else {
      onChange(optionValue);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        {label}
      </label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
      >
        <span className={value ? "" : "text-gray-400 dark:text-gray-500"}>
          {selectedLabels}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg max-h-60 overflow-auto"
          >
            {options.map((option) => {
              const isSelected = multiple
                ? Array.isArray(value) && value.includes(option.value)
                : value === option.value;

              return (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors ${
                    isSelected ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20" : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {option.label}
                  {isSelected && <Check className="w-4 h-4" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Date Range Filter
function DateRangeFilter({ label, value, onChange, expanded, onToggle }) {
  const formatDateRange = () => {
    if (!value?.start && !value?.end) return "Sélectionner une période";
    const start = value.start ? format(new Date(value.start), "dd MMM yyyy", { locale: fr }) : "";
    const end = value.end ? format(new Date(value.end), "dd MMM yyyy", { locale: fr }) : "";
    return `${start} - ${end}`;
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        {label}
      </label>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className={value?.start ? "" : "text-gray-400 dark:text-gray-500"}>
            {formatDateRange()}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-72 mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg p-4"
          >
            {/* Presets */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {DATE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => {
                    const range = preset.getValue();
                    onChange({
                      start: format(range.start, "yyyy-MM-dd"),
                      end: format(range.end, "yyyy-MM-dd"),
                    });
                  }}
                  className="px-3 py-2 text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom dates */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Début</label>
                <input
                  type="date"
                  value={value?.start || ""}
                  onChange={(e) => onChange({ ...value, start: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Fin</label>
                <input
                  type="date"
                  value={value?.end || ""}
                  onChange={(e) => onChange({ ...value, end: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Range Filter (min/max)
function RangeFilter({ label, value, onChange, min = 0, max = 100, step = 1, prefix = "", suffix = "" }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          {prefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              {prefix}
            </span>
          )}
          <input
            type="number"
            placeholder="Min"
            value={value?.min || ""}
            onChange={(e) => onChange({ ...value, min: e.target.value })}
            min={min}
            max={max}
            step={step}
            className={`w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 ${prefix ? "pl-7" : ""}`}
          />
        </div>
        <span className="text-gray-400">-</span>
        <div className="flex-1 relative">
          <input
            type="number"
            placeholder="Max"
            value={value?.max || ""}
            onChange={(e) => onChange({ ...value, max: e.target.value })}
            min={min}
            max={max}
            step={step}
            className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300"
          />
          {suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              {suffix}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Search Filter
function SearchFilter({ label, value, onChange, placeholder = "Rechercher..." }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        {label}
      </label>
      <input
        type="text"
        placeholder={placeholder}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  );
}

// Checkbox Filter
function CheckboxFilter({ label, options = [], value = [], onChange }) {
  const handleToggle = (optionValue) => {
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      <div className="space-y-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex items-center gap-2 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={value.includes(option.value)}
              onChange={() => handleToggle(option.value)}
              className="w-4 h-4 text-blue-600 bg-gray-50 dark:bg-slate-700 border-gray-300 dark:border-slate-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
