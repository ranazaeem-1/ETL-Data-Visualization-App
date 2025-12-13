'use client';

import React, { useState, useMemo } from 'react';
import { AlertCircle, Trash2, Calculator, Hash, X, Sparkles } from 'lucide-react';
import { ColumnInfo } from '@/lib/store';
import { FillStrategy } from '@/lib/data-engine';

interface MissingValuePanelProps {
    data: Record<string, unknown>[];
    columns: ColumnInfo[];
    onFillMissing: (column: string, strategy: FillStrategy, customValue?: unknown) => void;
    onDropRows: (column?: string) => void;
    onClose: () => void;
}

export function MissingValuePanel({
    data,
    columns,
    onFillMissing,
    onDropRows,
    onClose
}: MissingValuePanelProps) {
    const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
    const [customValue, setCustomValue] = useState('');

    const missingSummary = useMemo(() => {
        return columns
            .map((col) => {
                const missing = data.filter((row) => row[col.name] == null || row[col.name] === '').length;
                const percent = ((missing / data.length) * 100).toFixed(1);
                return { ...col, missing, percent };
            })
            .filter((col) => col.missing > 0)
            .sort((a, b) => b.missing - a.missing);
    }, [data, columns]);

    const totalMissing = missingSummary.reduce((acc, col) => acc + col.missing, 0);

    const selectedColumnInfo = missingSummary.find((col) => col.name === selectedColumn);

    const handleFill = (strategy: FillStrategy) => {
        if (!selectedColumn) return;
        const value = strategy === 'custom' ? customValue : undefined;
        onFillMissing(selectedColumn, strategy, value);
        setSelectedColumn(null);
        setCustomValue('');
    };

    if (missingSummary.length === 0) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
                <div className="relative glass-strong rounded-2xl p-8 max-w-md text-center animate-fade-in-up">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-[rgb(var(--text-primary))] mb-2">
                        No Missing Values!
                    </h3>
                    <p className="text-[rgb(var(--text-secondary))] mb-6">
                        Your dataset is complete with no missing values.
                    </p>
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium hover:shadow-lg transition-all"
                    >
                        Great!
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-2xl glass-strong rounded-2xl shadow-2xl animate-fade-in-up max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-[rgb(var(--text-primary))]/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                            <AlertCircle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">Handle Missing Values</h2>
                            <p className="text-sm text-[rgb(var(--text-secondary))]">
                                {totalMissing.toLocaleString()} missing across {missingSummary.length} column{missingSummary.length > 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-[rgb(var(--text-primary))]/5 transition-colors"
                    >
                        <X className="w-5 h-5 text-[rgb(var(--text-secondary))]" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-5">
                    {/* Quick Actions */}
                    <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-red-500">Drop All Rows with Missing Values</p>
                                <p className="text-sm text-[rgb(var(--text-secondary))]">
                                    This will remove rows that have any missing value
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    onDropRows();
                                    onClose();
                                }}
                                className="px-4 py-2 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                Drop Rows
                            </button>
                        </div>
                    </div>

                    {/* Column List */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-[rgb(var(--text-secondary))] mb-3">
                            Or handle by column:
                        </h3>

                        {missingSummary.map((col) => (
                            <div key={col.name} className="group">
                                <div
                                    className={`
                    p-4 rounded-xl border transition-all cursor-pointer
                    ${selectedColumn === col.name
                                            ? 'bg-indigo-500/10 border-indigo-500/30'
                                            : 'bg-[rgb(var(--text-primary))]/[0.02] border-[rgb(var(--text-primary))]/5 hover:border-indigo-500/20'
                                        }
                  `}
                                    onClick={() => setSelectedColumn(selectedColumn === col.name ? null : col.name)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`
                        w-8 h-8 rounded-lg flex items-center justify-center
                        ${col.type === 'numeric' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'}
                      `}>
                                                <Hash className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-[rgb(var(--text-primary))]">{col.name}</p>
                                                <p className="text-sm text-[rgb(var(--text-secondary))]">{col.type}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-amber-500">{col.missing.toLocaleString()} missing</p>
                                            <p className="text-sm text-[rgb(var(--text-secondary))]">{col.percent}%</p>
                                        </div>
                                    </div>

                                    {/* Fill Options (expanded) */}
                                    {selectedColumn === col.name && (
                                        <div className="mt-4 pt-4 border-t border-[rgb(var(--text-primary))]/5 space-y-3" onClick={(e) => e.stopPropagation()}>
                                            <p className="text-sm font-medium text-[rgb(var(--text-secondary))]">Fill missing values with:</p>

                                            <div className="grid grid-cols-3 gap-2">
                                                {col.type === 'numeric' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleFill('mean')}
                                                            className="px-3 py-2 rounded-lg bg-blue-500/10 text-blue-500 text-sm font-medium hover:bg-blue-500/20 transition-colors flex items-center justify-center gap-1"
                                                        >
                                                            <Calculator className="w-3.5 h-3.5" />
                                                            Mean
                                                            <span className="text-xs opacity-60">({col.stats?.mean})</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleFill('median')}
                                                            className="px-3 py-2 rounded-lg bg-purple-500/10 text-purple-500 text-sm font-medium hover:bg-purple-500/20 transition-colors"
                                                        >
                                                            Median
                                                            <span className="text-xs opacity-60 ml-1">({col.stats?.median})</span>
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => handleFill('mode')}
                                                    className="px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-500 text-sm font-medium hover:bg-emerald-500/20 transition-colors"
                                                >
                                                    Mode
                                                </button>
                                            </div>

                                            <div className="flex gap-2">
                                                <input
                                                    type={col.type === 'numeric' ? 'number' : 'text'}
                                                    value={customValue}
                                                    onChange={(e) => setCustomValue(e.target.value)}
                                                    placeholder="Custom value..."
                                                    className="flex-1 px-3 py-2 rounded-lg bg-[rgb(var(--text-primary))]/[0.03] border border-[rgb(var(--text-primary))]/10 text-[rgb(var(--text-primary))] text-sm focus:outline-none focus:border-indigo-500/50"
                                                />
                                                <button
                                                    onClick={() => handleFill('custom')}
                                                    disabled={!customValue}
                                                    className="px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm font-medium disabled:opacity-40 hover:bg-indigo-600 transition-colors"
                                                >
                                                    Fill
                                                </button>
                                            </div>

                                            <button
                                                onClick={() => {
                                                    onDropRows(col.name);
                                                    setSelectedColumn(null);
                                                }}
                                                className="w-full px-3 py-2 rounded-lg bg-red-500/10 text-red-500 text-sm font-medium hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                Drop rows with missing {col.name}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
