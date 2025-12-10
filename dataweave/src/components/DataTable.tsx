'use client';

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, Table2, Sparkles } from 'lucide-react';

interface DataTableProps {
    data: Record<string, unknown>[];
    columns: string[];
    addedColumns?: string[];
}

export function DataTable({ data, columns, addedColumns = [] }: DataTableProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const rowsPerPage = 15;

    const filteredData = useMemo(() => {
        let result = data;

        if (searchTerm) {
            result = data.filter((row) =>
                Object.values(row).some((value) =>
                    String(value).toLowerCase().includes(searchTerm.toLowerCase())
                )
            );
        }

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
    }, [data, searchTerm, sortColumn, sortDirection]);

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

    return (
        <div className="glass-strong rounded-2xl overflow-hidden card-hover">
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/5 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                            <Table2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white">Data Preview</h3>
                            <p className="text-sm text-white/50">{filteredData.length.toLocaleString()} rows</p>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                            type="text"
                            placeholder="Search all columns..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/30 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.07] transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-white/[0.02]">
                            {columns.map((column) => (
                                <th
                                    key={column}
                                    onClick={() => handleSort(column)}
                                    className={`
                    px-4 py-3.5 text-left text-sm font-medium cursor-pointer
                    hover:bg-white/[0.03] transition-colors group
                    ${sortColumn === column ? 'text-indigo-400' : 'text-white/60'}
                  `}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className={addedColumns.includes(column) ? 'text-emerald-400' : ''}>
                                            {column}
                                        </span>
                                        {addedColumns.includes(column) && (
                                            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-full text-emerald-400 border border-emerald-500/20">
                                                <Sparkles className="w-2.5 h-2.5" />
                                                NEW
                                            </span>
                                        )}
                                        {sortColumn === column && (
                                            <span className="text-indigo-400 text-xs font-bold">
                                                {sortDirection === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                        {paginatedData.map((row, idx) => (
                            <tr
                                key={idx}
                                className="hover:bg-white/[0.02] transition-colors group"
                            >
                                {columns.map((column) => (
                                    <td
                                        key={column}
                                        className={`
                      px-4 py-3 text-sm
                      ${addedColumns.includes(column)
                                                ? 'text-emerald-400/90'
                                                : 'text-white/70 group-hover:text-white/90'
                                            }
                      transition-colors
                    `}
                                    >
                                        {row[column] != null ? String(row[column]) :
                                            <span className="text-white/30">—</span>
                                        }
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="px-5 py-4 border-t border-white/5 flex items-center justify-between bg-white/[0.01]">
                <p className="text-sm text-white/40">
                    Showing <span className="text-white/70 font-medium">{(currentPage - 1) * rowsPerPage + 1}</span> to{' '}
                    <span className="text-white/70 font-medium">{Math.min(currentPage * rowsPerPage, filteredData.length)}</span> of{' '}
                    <span className="text-white/70 font-medium">{filteredData.length}</span>
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
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
                        >
                            <Icon className="w-4 h-4 text-white/70" />
                        </button>
                    ))}

                    <div className="px-4 py-2 text-sm text-white/50 font-medium">
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
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
                        >
                            <Icon className="w-4 h-4 text-white/70" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
