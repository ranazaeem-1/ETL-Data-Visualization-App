'use client';

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, Table2, Sparkles, Filter, X } from 'lucide-react';
import { FilterConfig } from '@/lib/store';

interface DataTableProps {
    data: Record<string, unknown>[];
    columns: string[];
    addedColumns?: string[];
    filters?: Record<string, FilterConfig>;
    onFilterChange?: (column: string, filter: FilterConfig | null) => void;
}

export function DataTable({
    data,
    columns,
    addedColumns = [],
    filters = {},
    onFilterChange
}: DataTableProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [filterColumn, setFilterColumn] = useState<string | null>(null);

    const rowsPerPage = 15;

    // Get unique values for categorical filter
    const getUniqueValues = (column: string) => {
        const values = data.map((row) => row[column]);
        const unique = [...new Set(values.map((v) => String(v ?? '')))];
        return unique.sort();
    };

    // Get min/max for numeric filter
    const getNumericRange = (column: string) => {
        const values = data
            .map((row) => row[column])
            .filter((v) => typeof v === 'number') as number[];
        return {
            min: Math.min(...values),
            max: Math.max(...values),
        };
    };

    // Apply filters
    const filteredData = useMemo(() => {
        let result = data;

        // Apply column filters
        for (const [column, filter] of Object.entries(filters)) {
            if (filter.type === 'categorical' && filter.values && filter.values.length > 0) {
                result = result.filter((row) => filter.values!.includes(String(row[column] ?? '')));
            } else if (filter.type === 'numeric') {
                result = result.filter((row) => {
                    const val = row[column];
                    if (typeof val !== 'number') return true;
                    const minOk = filter.min === undefined || val >= filter.min;
                    const maxOk = filter.max === undefined || val <= filter.max;
                    return minOk && maxOk;
                });
            } else if (filter.type === 'text' && filter.search) {
                result = result.filter((row) =>
                    String(row[column] ?? '').toLowerCase().includes(filter.search!.toLowerCase())
                );
            }
        }

        // Apply search
        if (searchTerm) {
            result = result.filter((row) =>
                Object.values(row).some((value) =>
                    String(value).toLowerCase().includes(searchTerm.toLowerCase())
                )
            );
        }

        // Apply sort
        if (sortColumn) {
            result = [...result].sort((a, b) => {
                const aVal = a[sortColumn];
                const bVal = b[sortColumn];

                if (typeof aVal === 'number' && typeof bVal === 'number') {
                    return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
                }

                const aStr = String(aVal ?? '');
                const bStr = String(bVal ?? '');
                return sortDirection === 'asc'
                    ? aStr.localeCompare(bStr)
                    : bStr.localeCompare(aStr);
            });
        }

        return result;
    }, [data, searchTerm, sortColumn, sortDirection, filters]);

    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const paginatedData = filteredData.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    const handleSort = (column: string) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    const activeFilterCount = Object.keys(filters).length;

    return (
        <div className="glass-strong rounded-2xl overflow-hidden card-hover">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-200/10 dark:border-white/5 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                            <Table2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white">Data Preview</h3>
                            <p className="text-sm text-slate-500 dark:text-white/50">{filteredData.length.toLocaleString()} rows</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Filter indicator */}
                        {activeFilterCount > 0 && (
                            <button
                                onClick={() => onFilterChange && Object.keys(filters).forEach((col) => onFilterChange(col, null))}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-colors"
                            >
                                <Filter className="w-3 h-3" />
                                {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
                                <X className="w-3 h-3" />
                            </button>
                        )}

                        {/* Search */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-white/30" />
                            <input
                                type="text"
                                placeholder="Search all columns..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full pl-10 pr-4 py-2.5 bg-white/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-white/30 focus:outline-none focus:border-indigo-500/50 focus:bg-white dark:focus:bg-white/[0.07] transition-all"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-slate-50/50 dark:bg-white/[0.02]">
                            {columns.map((column) => {
                                const hasFilter = !!filters[column];
                                return (
                                    <th
                                        key={column}
                                        className={`
                      px-4 py-3.5 text-left text-sm font-medium cursor-pointer
                      hover:bg-slate-100/50 dark:hover:bg-white/[0.03] transition-colors group relative
                      ${sortColumn === column ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-white/60'}
                      ${hasFilter ? 'bg-indigo-50/50 dark:bg-indigo-500/10' : ''}
                    `}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span
                                                onClick={() => handleSort(column)}
                                                className={addedColumns.includes(column) ? 'text-emerald-600 dark:text-emerald-400' : ''}
                                            >
                                                {column}
                                            </span>
                                            {addedColumns.includes(column) && (
                                                <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-full text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                                    <Sparkles className="w-2.5 h-2.5" />
                                                    NEW
                                                </span>
                                            )}
                                            {sortColumn === column && (
                                                <span className="text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                                                    {sortDirection === 'asc' ? '↑' : '↓'}
                                                </span>
                                            )}

                                            {/* Filter button */}
                                            {onFilterChange && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setFilterColumn(filterColumn === column ? null : column);
                                                    }}
                                                    className={`
                            p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity
                            ${hasFilter ? 'opacity-100 text-indigo-500' : 'text-slate-400 dark:text-white/40'}
                            hover:bg-slate-200/50 dark:hover:bg-white/10
                          `}
                                                >
                                                    <Filter className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Filter dropdown */}
                                        {filterColumn === column && onFilterChange && (
                                            <div
                                                className="absolute top-full left-0 mt-1 z-50 w-64 p-3 rounded-xl glass-strong shadow-xl border border-slate-200/50 dark:border-white/10"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-medium text-slate-500 dark:text-white/50">Filter: {column}</span>
                                                    <button
                                                        onClick={() => {
                                                            onFilterChange(column, null);
                                                            setFilterColumn(null);
                                                        }}
                                                        className="text-xs text-red-500 hover:text-red-600"
                                                    >
                                                        Clear
                                                    </button>
                                                </div>

                                                {/* Categorical filter */}
                                                {typeof data[0]?.[column] === 'string' || getUniqueValues(column).length <= 20 ? (
                                                    <div className="max-h-48 overflow-y-auto space-y-1">
                                                        {getUniqueValues(column).slice(0, 20).map((value) => (
                                                            <label key={value} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-100/50 dark:hover:bg-white/5 p-1 rounded">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={filters[column]?.values?.includes(value) ?? false}
                                                                    onChange={(e) => {
                                                                        const currentValues = filters[column]?.values ?? [];
                                                                        const newValues = e.target.checked
                                                                            ? [...currentValues, value]
                                                                            : currentValues.filter((v) => v !== value);
                                                                        onFilterChange(column, newValues.length > 0 ? { type: 'categorical', values: newValues } : null);
                                                                    }}
                                                                    className="rounded border-slate-300 dark:border-white/20 text-indigo-500 focus:ring-indigo-500"
                                                                />
                                                                <span className="text-slate-700 dark:text-white/80 truncate">{value || '(empty)'}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    // Numeric range filter
                                                    <div className="space-y-2">
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="number"
                                                                placeholder="Min"
                                                                value={filters[column]?.min ?? ''}
                                                                onChange={(e) => {
                                                                    const min = e.target.value ? Number(e.target.value) : undefined;
                                                                    const currentMax = filters[column]?.max;
                                                                    if (min === undefined && currentMax === undefined) {
                                                                        onFilterChange(column, null);
                                                                    } else {
                                                                        onFilterChange(column, { type: 'numeric', min, max: currentMax });
                                                                    }
                                                                }}
                                                                className="flex-1 px-2 py-1.5 text-sm bg-white/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 rounded text-slate-900 dark:text-white"
                                                            />
                                                            <input
                                                                type="number"
                                                                placeholder="Max"
                                                                value={filters[column]?.max ?? ''}
                                                                onChange={(e) => {
                                                                    const max = e.target.value ? Number(e.target.value) : undefined;
                                                                    const currentMin = filters[column]?.min;
                                                                    if (max === undefined && currentMin === undefined) {
                                                                        onFilterChange(column, null);
                                                                    } else {
                                                                        onFilterChange(column, { type: 'numeric', min: currentMin, max });
                                                                    }
                                                                }}
                                                                className="flex-1 px-2 py-1.5 text-sm bg-white/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 rounded text-slate-900 dark:text-white"
                                                            />
                                                        </div>
                                                        <p className="text-xs text-slate-400 dark:text-white/30">
                                                            Range: {getNumericRange(column).min} - {getNumericRange(column).max}
                                                        </p>
                                                    </div>
                                                )}

                                                <button
                                                    onClick={() => setFilterColumn(null)}
                                                    className="mt-2 w-full py-1.5 text-xs rounded-lg bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                                                >
                                                    Done
                                                </button>
                                            </div>
                                        )}
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/50 dark:divide-white/[0.03]">
                        {paginatedData.map((row, idx) => (
                            <tr
                                key={idx}
                                className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors group"
                            >
                                {columns.map((column) => (
                                    <td
                                        key={column}
                                        className={`
                      px-4 py-3 text-sm
                      ${addedColumns.includes(column)
                                                ? 'text-emerald-600/90 dark:text-emerald-400/90'
                                                : 'text-slate-600 dark:text-white/70 group-hover:text-slate-900 dark:group-hover:text-white/90'
                                            }
                      transition-colors
                    `}
                                    >
                                        {row[column] != null ? String(row[column]) :
                                            <span className="text-slate-300 dark:text-white/30">—</span>
                                        }
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="px-5 py-4 border-t border-slate-200/10 dark:border-white/5 flex items-center justify-between bg-slate-50/30 dark:bg-white/[0.01]">
                <p className="text-sm text-slate-500 dark:text-white/40">
                    Showing <span className="text-slate-700 dark:text-white/70 font-medium">{(currentPage - 1) * rowsPerPage + 1}</span> to{' '}
                    <span className="text-slate-700 dark:text-white/70 font-medium">{Math.min(currentPage * rowsPerPage, filteredData.length)}</span> of{' '}
                    <span className="text-slate-700 dark:text-white/70 font-medium">{filteredData.length}</span>
                </p>

                <div className="flex items-center gap-1">
                    {[
                        { icon: ChevronsLeft, action: () => setCurrentPage(1), disabled: currentPage === 1 },
                        { icon: ChevronLeft, action: () => setCurrentPage(currentPage - 1), disabled: currentPage === 1 },
                    ].map(({ icon: Icon, action, disabled }, i) => (
                        <button
                            key={i}
                            onClick={action}
                            disabled={disabled}
                            className="p-2 rounded-lg bg-slate-100/50 dark:bg-white/5 hover:bg-slate-200/50 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
                        >
                            <Icon className="w-4 h-4 text-slate-600 dark:text-white/70" />
                        </button>
                    ))}

                    <div className="px-4 py-2 text-sm text-slate-500 dark:text-white/50 font-medium">
                        {currentPage} / {totalPages || 1}
                    </div>

                    {[
                        { icon: ChevronRight, action: () => setCurrentPage(currentPage + 1), disabled: currentPage >= totalPages },
                        { icon: ChevronsRight, action: () => setCurrentPage(totalPages), disabled: currentPage >= totalPages },
                    ].map(({ icon: Icon, action, disabled }, i) => (
                        <button
                            key={i}
                            onClick={action}
                            disabled={disabled}
                            className="p-2 rounded-lg bg-slate-100/50 dark:bg-white/5 hover:bg-slate-200/50 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
                        >
                            <Icon className="w-4 h-4 text-slate-600 dark:text-white/70" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
