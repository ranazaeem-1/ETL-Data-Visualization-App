'use client';

import React, { useState, useMemo } from 'react';
import { X, Calculator, Type, Binary, BarChart3, Wand2, ChevronRight } from 'lucide-react';
import { ColumnInfo } from '@/lib/store';

interface TransformationPanelProps {
    columns: ColumnInfo[];
    data: Record<string, unknown>[];
    onApplyTransformation: (newData: Record<string, unknown>[], newColumns: string[]) => void;
    onClose: () => void;
}

type TransformationType = 'math' | 'string' | 'encoding' | 'aggregate';

// Math transformation functions
function applyMathTransform(
    data: Record<string, unknown>[],
    column: string,
    operation: string
): { data: Record<string, unknown>[]; newColumn: string } {
    const newColumn = `${column}_${operation}`;

    const newData = data.map((row) => {
        const value = row[column];
        let result: number | null = null;

        if (typeof value === 'number' && !isNaN(value)) {
            switch (operation) {
                case 'log':
                    result = value > 0 ? Math.round(Math.log(value) * 1000) / 1000 : null;
                    break;
                case 'log10':
                    result = value > 0 ? Math.round(Math.log10(value) * 1000) / 1000 : null;
                    break;
                case 'sqrt':
                    result = value >= 0 ? Math.round(Math.sqrt(value) * 1000) / 1000 : null;
                    break;
                case 'square':
                    result = Math.round(value * value * 1000) / 1000;
                    break;
                case 'abs':
                    result = Math.abs(value);
                    break;
                case 'round':
                    result = Math.round(value);
                    break;
                case 'floor':
                    result = Math.floor(value);
                    break;
                case 'ceil':
                    result = Math.ceil(value);
                    break;
            }
        }

        return { ...row, [newColumn]: result };
    });

    return { data: newData, newColumn };
}

// Normalize/Standardize functions
function normalizeColumn(
    data: Record<string, unknown>[],
    column: string,
    method: 'minmax' | 'zscore'
): { data: Record<string, unknown>[]; newColumn: string } {
    const newColumn = `${column}_${method === 'minmax' ? 'normalized' : 'standardized'}`;
    const values = data
        .map((row) => row[column])
        .filter((v): v is number => typeof v === 'number' && !isNaN(v));

    if (values.length === 0) {
        return { data, newColumn };
    }

    let normalizedData: Record<string, unknown>[];

    if (method === 'minmax') {
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min;

        normalizedData = data.map((row) => {
            const value = row[column];
            if (typeof value === 'number' && !isNaN(value)) {
                return { ...row, [newColumn]: range === 0 ? 0 : Math.round(((value - min) / range) * 1000) / 1000 };
            }
            return { ...row, [newColumn]: null };
        });
    } else {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
        const std = Math.sqrt(variance);

        normalizedData = data.map((row) => {
            const value = row[column];
            if (typeof value === 'number' && !isNaN(value)) {
                return { ...row, [newColumn]: std === 0 ? 0 : Math.round(((value - mean) / std) * 1000) / 1000 };
            }
            return { ...row, [newColumn]: null };
        });
    }

    return { data: normalizedData, newColumn };
}

// String transformation functions
function applyStringTransform(
    data: Record<string, unknown>[],
    column: string,
    operation: string,
    pattern?: string
): { data: Record<string, unknown>[]; newColumn: string } {
    const newColumn = `${column}_${operation}`;

    const newData = data.map((row) => {
        const value = row[column];
        let result: string | null = null;

        if (value != null) {
            const strValue = String(value);
            switch (operation) {
                case 'lowercase':
                    result = strValue.toLowerCase();
                    break;
                case 'uppercase':
                    result = strValue.toUpperCase();
                    break;
                case 'trim':
                    result = strValue.trim();
                    break;
                case 'length':
                    return { ...row, [newColumn]: strValue.length };
                case 'extract':
                    if (pattern) {
                        try {
                            const regex = new RegExp(pattern);
                            const match = strValue.match(regex);
                            result = match ? match[0] : null;
                        } catch {
                            result = null;
                        }
                    }
                    break;
                case 'replace':
                    // Simple replacement - replace digits with empty
                    result = strValue.replace(/\d+/g, '');
                    break;
                case 'first_word':
                    result = strValue.split(/\s+/)[0] || null;
                    break;
                case 'word_count':
                    return { ...row, [newColumn]: strValue.trim().split(/\s+/).filter(Boolean).length };
            }
        }

        return { ...row, [newColumn]: result };
    });

    return { data: newData, newColumn };
}

// One-hot encoding
function oneHotEncode(
    data: Record<string, unknown>[],
    column: string
): { data: Record<string, unknown>[]; newColumns: string[] } {
    const uniqueValues = [...new Set(data.map((row) => row[column]).filter((v) => v != null))];
    const newColumns = uniqueValues.map((v) => `${column}_${String(v).replace(/\s+/g, '_')}`);

    const newData = data.map((row) => {
        const newRow = { ...row };
        const value = row[column];

        uniqueValues.forEach((uv, i) => {
            newRow[newColumns[i]] = value === uv ? 1 : 0;
        });

        return newRow;
    });

    return { data: newData, newColumns };
}

// Aggregation functions
function aggregateData(
    data: Record<string, unknown>[],
    groupByColumn: string,
    valueColumn: string,
    operation: 'sum' | 'mean' | 'count' | 'min' | 'max'
): Record<string, unknown>[] {
    const groups: Record<string, number[]> = {};

    data.forEach((row) => {
        const key = String(row[groupByColumn] ?? 'null');
        const value = row[valueColumn];

        if (!groups[key]) {
            groups[key] = [];
        }

        if (typeof value === 'number' && !isNaN(value)) {
            groups[key].push(value);
        }
    });

    return Object.entries(groups).map(([key, values]) => {
        let result: number;

        switch (operation) {
            case 'sum':
                result = values.reduce((a, b) => a + b, 0);
                break;
            case 'mean':
                result = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
                break;
            case 'count':
                result = values.length;
                break;
            case 'min':
                result = values.length > 0 ? Math.min(...values) : 0;
                break;
            case 'max':
                result = values.length > 0 ? Math.max(...values) : 0;
                break;
        }

        return {
            [groupByColumn]: key,
            [`${valueColumn}_${operation}`]: Math.round(result * 100) / 100,
        };
    });
}

export function TransformationPanel({
    columns,
    data,
    onApplyTransformation,
    onClose
}: TransformationPanelProps) {
    const [activeTab, setActiveTab] = useState<TransformationType>('math');
    const [selectedColumn, setSelectedColumn] = useState('');
    const [selectedOperation, setSelectedOperation] = useState('');
    const [regexPattern, setRegexPattern] = useState('');
    const [groupByColumn, setGroupByColumn] = useState('');
    const [valueColumn, setValueColumn] = useState('');
    const [aggregateOp, setAggregateOp] = useState<'sum' | 'mean' | 'count' | 'min' | 'max'>('sum');

    const numericColumns = columns.filter((c) => c.type === 'numeric');
    const categoricalColumns = columns.filter((c) => c.type === 'categorical' || c.type === 'text');

    const tabs = [
        { id: 'math', label: 'Math', icon: Calculator, desc: 'Log, sqrt, normalize' },
        { id: 'string', label: 'String', icon: Type, desc: 'Trim, lowercase, extract' },
        { id: 'encoding', label: 'Encoding', icon: Binary, desc: 'One-hot encoding' },
        { id: 'aggregate', label: 'Aggregate', icon: BarChart3, desc: 'Group by operations' },
    ] as const;

    const mathOperations = [
        { id: 'log', label: 'Natural Log', desc: 'ln(x)' },
        { id: 'log10', label: 'Log Base 10', desc: 'log₁₀(x)' },
        { id: 'sqrt', label: 'Square Root', desc: '√x' },
        { id: 'square', label: 'Square', desc: 'x²' },
        { id: 'abs', label: 'Absolute', desc: '|x|' },
        { id: 'round', label: 'Round', desc: 'Round to nearest' },
        { id: 'minmax', label: 'Normalize (0-1)', desc: 'Min-max scaling' },
        { id: 'zscore', label: 'Standardize (Z-score)', desc: 'Mean=0, Std=1' },
    ];

    const stringOperations = [
        { id: 'lowercase', label: 'Lowercase', desc: 'Convert to lowercase' },
        { id: 'uppercase', label: 'Uppercase', desc: 'Convert to uppercase' },
        { id: 'trim', label: 'Trim', desc: 'Remove whitespace' },
        { id: 'length', label: 'Length', desc: 'Character count' },
        { id: 'first_word', label: 'First Word', desc: 'Extract first word' },
        { id: 'word_count', label: 'Word Count', desc: 'Count words' },
        { id: 'extract', label: 'Regex Extract', desc: 'Extract pattern' },
    ];

    const handleApply = () => {
        if (activeTab === 'math' && selectedColumn && selectedOperation) {
            if (selectedOperation === 'minmax' || selectedOperation === 'zscore') {
                const { data: newData, newColumn } = normalizeColumn(data, selectedColumn, selectedOperation);
                onApplyTransformation(newData, [newColumn]);
            } else {
                const { data: newData, newColumn } = applyMathTransform(data, selectedColumn, selectedOperation);
                onApplyTransformation(newData, [newColumn]);
            }
        } else if (activeTab === 'string' && selectedColumn && selectedOperation) {
            const { data: newData, newColumn } = applyStringTransform(data, selectedColumn, selectedOperation, regexPattern);
            onApplyTransformation(newData, [newColumn]);
        } else if (activeTab === 'encoding' && selectedColumn) {
            const { data: newData, newColumns } = oneHotEncode(data, selectedColumn);
            onApplyTransformation(newData, newColumns);
        } else if (activeTab === 'aggregate' && groupByColumn && valueColumn) {
            const aggregatedData = aggregateData(data, groupByColumn, valueColumn, aggregateOp);
            onApplyTransformation(aggregatedData, Object.keys(aggregatedData[0] || {}));
        }

        onClose();
    };

    const canApply = () => {
        if (activeTab === 'math') return selectedColumn && selectedOperation;
        if (activeTab === 'string') return selectedColumn && selectedOperation;
        if (activeTab === 'encoding') return selectedColumn;
        if (activeTab === 'aggregate') return groupByColumn && valueColumn;
        return false;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-3xl glass-strong rounded-2xl shadow-2xl animate-fade-in-up max-h-[85vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-[rgb(var(--text-primary))]/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <Wand2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">Data Transformations</h2>
                            <p className="text-sm text-[rgb(var(--text-secondary))]">Apply advanced transformations to your data</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-[rgb(var(--text-primary))]/5 transition-colors"
                    >
                        <X className="w-5 h-5 text-[rgb(var(--text-secondary))]" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-[rgb(var(--text-primary))]/5">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    setSelectedColumn('');
                                    setSelectedOperation('');
                                }}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 transition-all ${activeTab === tab.id
                                        ? 'bg-indigo-500/10 text-indigo-500 border-b-2 border-indigo-500'
                                        : 'text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--text-primary))]/[0.03]'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span className="font-medium text-sm">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-5">
                    {/* Math Transformations */}
                    {activeTab === 'math' && (
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">Select Numeric Column</label>
                                <select
                                    value={selectedColumn}
                                    onChange={(e) => setSelectedColumn(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-[rgb(var(--text-primary))]/[0.03] border border-[rgb(var(--text-primary))]/10 rounded-xl text-[rgb(var(--text-primary))] focus:outline-none focus:border-indigo-500/50"
                                >
                                    <option value="">Select column...</option>
                                    {numericColumns.map((col) => (
                                        <option key={col.name} value={col.name}>{col.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">Select Operation</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {mathOperations.map((op) => (
                                        <button
                                            key={op.id}
                                            onClick={() => setSelectedOperation(op.id)}
                                            className={`p-3 text-left rounded-xl border transition-all ${selectedOperation === op.id
                                                    ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-500'
                                                    : 'bg-[rgb(var(--text-primary))]/[0.02] border-[rgb(var(--text-primary))]/5 hover:border-indigo-500/20'
                                                }`}
                                        >
                                            <p className="font-medium text-sm">{op.label}</p>
                                            <p className="text-xs text-[rgb(var(--text-secondary))]">{op.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* String Transformations */}
                    {activeTab === 'string' && (
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">Select Column</label>
                                <select
                                    value={selectedColumn}
                                    onChange={(e) => setSelectedColumn(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-[rgb(var(--text-primary))]/[0.03] border border-[rgb(var(--text-primary))]/10 rounded-xl text-[rgb(var(--text-primary))] focus:outline-none focus:border-indigo-500/50"
                                >
                                    <option value="">Select column...</option>
                                    {columns.map((col) => (
                                        <option key={col.name} value={col.name}>{col.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">Select Operation</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {stringOperations.map((op) => (
                                        <button
                                            key={op.id}
                                            onClick={() => setSelectedOperation(op.id)}
                                            className={`p-3 text-left rounded-xl border transition-all ${selectedOperation === op.id
                                                    ? 'bg-purple-500/10 border-purple-500/30 text-purple-500'
                                                    : 'bg-[rgb(var(--text-primary))]/[0.02] border-[rgb(var(--text-primary))]/5 hover:border-purple-500/20'
                                                }`}
                                        >
                                            <p className="font-medium text-sm">{op.label}</p>
                                            <p className="text-xs text-[rgb(var(--text-secondary))]">{op.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {selectedOperation === 'extract' && (
                                <div>
                                    <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">Regex Pattern</label>
                                    <input
                                        type="text"
                                        value={regexPattern}
                                        onChange={(e) => setRegexPattern(e.target.value)}
                                        placeholder="e.g., \d+ for numbers"
                                        className="w-full px-4 py-2.5 bg-[rgb(var(--text-primary))]/[0.03] border border-[rgb(var(--text-primary))]/10 rounded-xl text-[rgb(var(--text-primary))] font-mono text-sm focus:outline-none focus:border-purple-500/50"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* One-Hot Encoding */}
                    {activeTab === 'encoding' && (
                        <div className="space-y-5">
                            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                <p className="text-sm text-amber-600 dark:text-amber-400">
                                    <strong>One-Hot Encoding</strong> converts categorical values into binary columns.
                                    Each unique value becomes a new column with 1 or 0.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">Select Categorical Column</label>
                                <select
                                    value={selectedColumn}
                                    onChange={(e) => setSelectedColumn(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-[rgb(var(--text-primary))]/[0.03] border border-[rgb(var(--text-primary))]/10 rounded-xl text-[rgb(var(--text-primary))] focus:outline-none focus:border-indigo-500/50"
                                >
                                    <option value="">Select column...</option>
                                    {categoricalColumns.map((col) => (
                                        <option key={col.name} value={col.name}>{col.name} ({col.unique} unique values)</option>
                                    ))}
                                </select>
                            </div>

                            {selectedColumn && (
                                <div className="p-3 rounded-xl bg-[rgb(var(--text-primary))]/[0.02] border border-[rgb(var(--text-primary))]/5">
                                    <p className="text-sm text-[rgb(var(--text-secondary))]">
                                        This will create <strong className="text-[rgb(var(--text-primary))]">
                                            {columns.find((c) => c.name === selectedColumn)?.unique || 0}
                                        </strong> new binary columns.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Aggregation */}
                    {activeTab === 'aggregate' && (
                        <div className="space-y-5">
                            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                <p className="text-sm text-blue-600 dark:text-blue-400">
                                    <strong>⚠️ Warning:</strong> Aggregation will replace your current data with the grouped result.
                                    This cannot be undone.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">Group By Column</label>
                                <select
                                    value={groupByColumn}
                                    onChange={(e) => setGroupByColumn(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-[rgb(var(--text-primary))]/[0.03] border border-[rgb(var(--text-primary))]/10 rounded-xl text-[rgb(var(--text-primary))] focus:outline-none focus:border-indigo-500/50"
                                >
                                    <option value="">Select column...</option>
                                    {categoricalColumns.map((col) => (
                                        <option key={col.name} value={col.name}>{col.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">Value Column</label>
                                <select
                                    value={valueColumn}
                                    onChange={(e) => setValueColumn(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-[rgb(var(--text-primary))]/[0.03] border border-[rgb(var(--text-primary))]/10 rounded-xl text-[rgb(var(--text-primary))] focus:outline-none focus:border-indigo-500/50"
                                >
                                    <option value="">Select column...</option>
                                    {numericColumns.map((col) => (
                                        <option key={col.name} value={col.name}>{col.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">Aggregation</label>
                                <div className="flex gap-2">
                                    {(['sum', 'mean', 'count', 'min', 'max'] as const).map((op) => (
                                        <button
                                            key={op}
                                            onClick={() => setAggregateOp(op)}
                                            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${aggregateOp === op
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-[rgb(var(--text-primary))]/[0.03] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--text-primary))]/[0.06]'
                                                }`}
                                        >
                                            {op.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-5 border-t border-[rgb(var(--text-primary))]/5">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-[rgb(var(--text-primary))]/[0.03] border border-[rgb(var(--text-primary))]/10 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] transition-all font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleApply}
                        disabled={!canApply()}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium disabled:opacity-40 hover:shadow-lg hover:shadow-purple-500/25 transition-all flex items-center justify-center gap-2"
                    >
                        Apply Transformation
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
