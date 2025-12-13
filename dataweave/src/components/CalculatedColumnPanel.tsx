'use client';

import React, { useState, useMemo } from 'react';
import { X, Calculator, Plus, Wand2, AlertCircle } from 'lucide-react';
import { ColumnInfo } from '@/lib/store';

interface CalculatedColumnPanelProps {
    columns: ColumnInfo[];
    onAddColumn: (name: string, formula: string, values: unknown[]) => void;
    data: Record<string, unknown>[];
    onClose: () => void;
}

// Simple formula parser and evaluator
function evaluateFormula(
    formula: string,
    row: Record<string, unknown>,
    columns: string[]
): number | null {
    try {
        // Replace column references with values
        let expression = formula;

        // Sort columns by length (longest first) to avoid partial replacements
        const sortedCols = [...columns].sort((a, b) => b.length - a.length);

        for (const col of sortedCols) {
            const regex = new RegExp(`\\[${col.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`, 'g');
            const value = row[col];
            if (typeof value === 'number') {
                expression = expression.replace(regex, String(value));
            } else if (value != null && !isNaN(Number(value))) {
                expression = expression.replace(regex, String(Number(value)));
            } else {
                expression = expression.replace(regex, '0');
            }
        }

        // Only allow safe math operations
        if (!/^[\d\s+\-*/().]+$/.test(expression)) {
            return null;
        }

        // Evaluate the expression
        const result = Function(`"use strict"; return (${expression})`)();
        return typeof result === 'number' && isFinite(result) ? Math.round(result * 100) / 100 : null;
    } catch {
        return null;
    }
}

const FORMULA_TEMPLATES = [
    { label: 'Sum', formula: '[col1] + [col2]', desc: 'Add two columns' },
    { label: 'Difference', formula: '[col1] - [col2]', desc: 'Subtract columns' },
    { label: 'Product', formula: '[col1] * [col2]', desc: 'Multiply columns' },
    { label: 'Ratio', formula: '[col1] / [col2]', desc: 'Divide columns' },
    { label: 'Percentage', formula: '([col1] / [col2]) * 100', desc: 'Calculate percentage' },
    { label: 'Average', formula: '([col1] + [col2]) / 2', desc: 'Average of two columns' },
];

export function CalculatedColumnPanel({
    columns,
    onAddColumn,
    data,
    onClose
}: CalculatedColumnPanelProps) {
    const [columnName, setColumnName] = useState('');
    const [formula, setFormula] = useState('');
    const [error, setError] = useState<string | null>(null);

    const numericColumns = columns.filter((c) => c.type === 'numeric');
    const columnNames = columns.map((c) => c.name);

    const previewValues = useMemo(() => {
        if (!formula.trim()) return [];

        return data.slice(0, 5).map((row) => {
            const result = evaluateFormula(formula, row, columnNames);
            return result;
        });
    }, [formula, data, columnNames]);

    const hasErrors = previewValues.some((v) => v === null) && formula.trim() !== '';

    const handleAddColumn = () => {
        if (!columnName.trim()) {
            setError('Please enter a column name');
            return;
        }
        if (!formula.trim()) {
            setError('Please enter a formula');
            return;
        }
        if (columnNames.includes(columnName.trim())) {
            setError('Column name already exists');
            return;
        }

        // Calculate all values
        const values = data.map((row) => evaluateFormula(formula, row, columnNames));

        if (values.every((v) => v === null)) {
            setError('Formula produced no valid results');
            return;
        }

        onAddColumn(columnName.trim(), formula, values);
        onClose();
    };

    const insertColumn = (colName: string) => {
        setFormula((prev) => prev + `[${colName}]`);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-2xl glass-strong rounded-2xl shadow-2xl animate-fade-in-up max-h-[85vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-[rgb(var(--text-primary))]/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                            <Calculator className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">Create Calculated Column</h2>
                            <p className="text-sm text-[rgb(var(--text-secondary))]">Build custom formulas using your data</p>
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
                <div className="flex-1 overflow-auto p-5 space-y-5">
                    {/* Column Name */}
                    <div>
                        <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
                            New Column Name
                        </label>
                        <input
                            type="text"
                            value={columnName}
                            onChange={(e) => {
                                setColumnName(e.target.value);
                                setError(null);
                            }}
                            placeholder="e.g., Total_Revenue"
                            className="w-full px-4 py-2.5 bg-[rgb(var(--text-primary))]/[0.03] border border-[rgb(var(--text-primary))]/10 rounded-xl text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-secondary))]/50 focus:outline-none focus:border-indigo-500/50 transition-all"
                        />
                    </div>

                    {/* Formula Input */}
                    <div>
                        <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
                            Formula
                        </label>
                        <textarea
                            value={formula}
                            onChange={(e) => {
                                setFormula(e.target.value);
                                setError(null);
                            }}
                            placeholder="e.g., [Price] * [Quantity]"
                            rows={3}
                            className="w-full px-4 py-2.5 bg-[rgb(var(--text-primary))]/[0.03] border border-[rgb(var(--text-primary))]/10 rounded-xl text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-secondary))]/50 focus:outline-none focus:border-indigo-500/50 transition-all font-mono text-sm resize-none"
                        />
                        <p className="mt-2 text-xs text-[rgb(var(--text-secondary))]">
                            Use [ColumnName] to reference columns. Supports: + - * / ( )
                        </p>
                    </div>

                    {/* Quick Insert Columns */}
                    <div>
                        <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
                            Insert Column Reference
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {numericColumns.map((col) => (
                                <button
                                    key={col.name}
                                    onClick={() => insertColumn(col.name)}
                                    className="px-3 py-1.5 text-sm rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors"
                                >
                                    [{col.name}]
                                </button>
                            ))}
                            {numericColumns.length === 0 && (
                                <p className="text-sm text-[rgb(var(--text-secondary))]/50">No numeric columns available</p>
                            )}
                        </div>
                    </div>

                    {/* Formula Templates */}
                    <div>
                        <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
                            <Wand2 className="w-4 h-4 inline mr-1" />
                            Quick Templates
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {FORMULA_TEMPLATES.map((template) => (
                                <button
                                    key={template.label}
                                    onClick={() => setFormula(template.formula)}
                                    className="p-3 text-left rounded-xl bg-[rgb(var(--text-primary))]/[0.02] border border-[rgb(var(--text-primary))]/5 hover:border-indigo-500/20 hover:bg-indigo-500/5 transition-all"
                                >
                                    <p className="font-medium text-sm text-[rgb(var(--text-primary))]">{template.label}</p>
                                    <p className="text-xs text-[rgb(var(--text-secondary))] mt-0.5">{template.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Preview */}
                    {formula.trim() && (
                        <div>
                            <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
                                Preview (first 5 rows)
                            </label>
                            <div className="p-3 rounded-xl bg-[rgb(var(--text-primary))]/[0.02] border border-[rgb(var(--text-primary))]/5">
                                <div className="flex gap-2 flex-wrap">
                                    {previewValues.map((val, i) => (
                                        <span
                                            key={i}
                                            className={`px-2 py-1 rounded text-sm font-mono ${val === null
                                                    ? 'bg-red-500/10 text-red-500'
                                                    : 'bg-emerald-500/10 text-emerald-500'
                                                }`}
                                        >
                                            {val === null ? 'Error' : val}
                                        </span>
                                    ))}
                                </div>
                                {hasErrors && (
                                    <p className="mt-2 text-xs text-amber-500 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        Some rows have invalid values or missing data
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-500">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm">{error}</span>
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
                        onClick={handleAddColumn}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium hover:shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add Column
                    </button>
                </div>
            </div>
        </div>
    );
}
