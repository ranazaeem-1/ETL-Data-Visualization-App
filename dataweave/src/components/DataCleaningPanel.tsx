'use client';

import React, { useState, useMemo } from 'react';
import { X, Trash2, RefreshCw, Type, Search, Replace } from 'lucide-react';
import { ColumnInfo } from '@/lib/store';

interface DataCleaningPanelProps {
    data: Record<string, unknown>[];
    columns: ColumnInfo[];
    onApply: (newData: Record<string, unknown>[]) => void;
    onClose: () => void;
}

type CleaningAction = 'duplicates' | 'type' | 'replace' | 'outliers';

export function DataCleaningPanel({ data, columns, onApply, onClose }: DataCleaningPanelProps) {
    const [activeAction, setActiveAction] = useState<CleaningAction>('duplicates');
    const [selectedColumn, setSelectedColumn] = useState('');
    const [targetType, setTargetType] = useState<'number' | 'string' | 'date'>('number');
    const [findValue, setFindValue] = useState('');
    const [replaceValue, setReplaceValue] = useState('');
    const [duplicateColumns, setDuplicateColumns] = useState<string[]>([]);

    // Find duplicates
    const duplicateInfo = useMemo(() => {
        if (duplicateColumns.length === 0) {
            // Check all columns
            const seen = new Set<string>();
            let count = 0;
            data.forEach((row) => {
                const key = JSON.stringify(row);
                if (seen.has(key)) count++;
                seen.add(key);
            });
            return { count, total: data.length };
        } else {
            const seen = new Set<string>();
            let count = 0;
            data.forEach((row) => {
                const key = duplicateColumns.map((col) => String(row[col] ?? '')).join('|');
                if (seen.has(key)) count++;
                seen.add(key);
            });
            return { count, total: data.length };
        }
    }, [data, duplicateColumns]);

    // Remove duplicates
    const handleRemoveDuplicates = () => {
        const seen = new Set<string>();
        const newData = data.filter((row) => {
            const key = duplicateColumns.length === 0
                ? JSON.stringify(row)
                : duplicateColumns.map((col) => String(row[col] ?? '')).join('|');
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
        onApply(newData);
        onClose();
    };

    // Convert data type
    const handleConvertType = () => {
        if (!selectedColumn) return;

        const newData = data.map((row) => {
            const value = row[selectedColumn];
            let converted: unknown = value;

            if (targetType === 'number') {
                const num = Number(value);
                converted = isNaN(num) ? null : num;
            } else if (targetType === 'string') {
                converted = value != null ? String(value) : '';
            } else if (targetType === 'date') {
                const date = new Date(String(value));
                converted = isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
            }

            return { ...row, [selectedColumn]: converted };
        });

        onApply(newData);
        onClose();
    };

    // Find and replace
    const handleFindReplace = () => {
        if (!selectedColumn || !findValue) return;

        const newData = data.map((row) => {
            const value = row[selectedColumn];
            const strValue = String(value ?? '');

            if (strValue === findValue || strValue.includes(findValue)) {
                return { ...row, [selectedColumn]: strValue.replace(new RegExp(findValue, 'g'), replaceValue) };
            }
            return row;
        });

        onApply(newData);
        onClose();
    };

    // Find matches count
    const matchCount = useMemo(() => {
        if (!selectedColumn || !findValue) return 0;
        return data.filter((row) => {
            const value = String(row[selectedColumn] ?? '');
            return value.includes(findValue);
        }).length;
    }, [data, selectedColumn, findValue]);

    // Handle outliers (remove based on IQR)
    const handleRemoveOutliers = () => {
        if (!selectedColumn) return;

        const values = data
            .map((row) => row[selectedColumn])
            .filter((v): v is number => typeof v === 'number' && !isNaN(v));

        if (values.length < 4) {
            onClose();
            return;
        }

        const sorted = [...values].sort((a, b) => a - b);
        const q1 = sorted[Math.floor(sorted.length * 0.25)];
        const q3 = sorted[Math.floor(sorted.length * 0.75)];
        const iqr = q3 - q1;
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;

        const newData = data.filter((row) => {
            const value = row[selectedColumn];
            if (typeof value !== 'number') return true;
            return value >= lowerBound && value <= upperBound;
        });

        onApply(newData);
        onClose();
    };

    // Count outliers
    const outlierCount = useMemo(() => {
        if (!selectedColumn) return 0;

        const col = columns.find((c) => c.name === selectedColumn);
        if (!col || col.type !== 'numeric') return 0;

        const values = data
            .map((row) => row[selectedColumn])
            .filter((v): v is number => typeof v === 'number' && !isNaN(v));

        if (values.length < 4) return 0;

        const sorted = [...values].sort((a, b) => a - b);
        const q1 = sorted[Math.floor(sorted.length * 0.25)];
        const q3 = sorted[Math.floor(sorted.length * 0.75)];
        const iqr = q3 - q1;
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;

        return values.filter((v) => v < lowerBound || v > upperBound).length;
    }, [data, selectedColumn, columns]);

    const numericColumns = columns.filter((c) => c.type === 'numeric');

    const actions = [
        { id: 'duplicates', label: 'Remove Duplicates', icon: Trash2 },
        { id: 'type', label: 'Convert Type', icon: Type },
        { id: 'replace', label: 'Find & Replace', icon: Replace },
        { id: 'outliers', label: 'Remove Outliers', icon: RefreshCw },
    ] as const;

    return (
        <div className="modal-overlay animate-fade-in" onClick={onClose}>
            <div className="modal-content w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[rgb(var(--border-color))]">
                    <h3 className="font-semibold text-[rgb(var(--text-primary))]">Data Cleaning</h3>
                    <button onClick={onClose} className="btn-icon">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Actions */}
                <div className="flex border-b border-[rgb(var(--border-color))]">
                    {actions.map((action) => {
                        const Icon = action.icon;
                        return (
                            <button
                                key={action.id}
                                onClick={() => setActiveAction(action.id)}
                                className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 text-sm transition-colors ${activeAction === action.id
                                        ? 'text-[rgb(var(--accent))] border-b-2 border-[rgb(var(--accent))]'
                                        : 'text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span className="hidden sm:inline">{action.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                <div className="p-4">
                    {activeAction === 'duplicates' && (
                        <div className="space-y-4">
                            <p className="text-sm text-[rgb(var(--text-secondary))]">
                                Remove duplicate rows from your data.
                            </p>

                            <div>
                                <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
                                    Check duplicates based on (leave empty for all columns):
                                </label>
                                <div className="max-h-40 overflow-auto border border-[rgb(var(--border-color))] rounded-lg p-2">
                                    {columns.map((col) => (
                                        <label key={col.name} className="flex items-center gap-2 py-1 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={duplicateColumns.includes(col.name)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setDuplicateColumns([...duplicateColumns, col.name]);
                                                    } else {
                                                        setDuplicateColumns(duplicateColumns.filter((c) => c !== col.name));
                                                    }
                                                }}
                                                className="rounded"
                                            />
                                            <span className="text-sm text-[rgb(var(--text-primary))]">{col.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="p-3 rounded-lg bg-[rgb(var(--bg-secondary))]">
                                <p className="text-sm">
                                    Found <strong className="text-[rgb(var(--accent))]">{duplicateInfo.count}</strong> duplicate rows
                                    out of {duplicateInfo.total} total rows.
                                </p>
                            </div>

                            <button
                                onClick={handleRemoveDuplicates}
                                disabled={duplicateInfo.count === 0}
                                className="btn btn-primary w-full"
                            >
                                Remove {duplicateInfo.count} Duplicates
                            </button>
                        </div>
                    )}

                    {activeAction === 'type' && (
                        <div className="space-y-4">
                            <p className="text-sm text-[rgb(var(--text-secondary))]">
                                Convert column data to a different type.
                            </p>

                            <div>
                                <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
                                    Select Column
                                </label>
                                <select
                                    value={selectedColumn}
                                    onChange={(e) => setSelectedColumn(e.target.value)}
                                >
                                    <option value="">Choose column...</option>
                                    {columns.map((col) => (
                                        <option key={col.name} value={col.name}>
                                            {col.name} ({col.type})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
                                    Convert To
                                </label>
                                <div className="flex gap-2">
                                    {(['number', 'string', 'date'] as const).map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => setTargetType(type)}
                                            className={`flex-1 px-3 py-2 rounded-lg text-sm border transition-colors ${targetType === type
                                                    ? 'border-[rgb(var(--accent))] bg-[rgba(var(--accent),0.1)] text-[rgb(var(--accent))]'
                                                    : 'border-[rgb(var(--border-color))] text-[rgb(var(--text-secondary))]'
                                                }`}
                                        >
                                            {type.charAt(0).toUpperCase() + type.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleConvertType}
                                disabled={!selectedColumn}
                                className="btn btn-primary w-full"
                            >
                                Convert Type
                            </button>
                        </div>
                    )}

                    {activeAction === 'replace' && (
                        <div className="space-y-4">
                            <p className="text-sm text-[rgb(var(--text-secondary))]">
                                Find and replace values in a column.
                            </p>

                            <div>
                                <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
                                    Select Column
                                </label>
                                <select
                                    value={selectedColumn}
                                    onChange={(e) => setSelectedColumn(e.target.value)}
                                >
                                    <option value="">Choose column...</option>
                                    {columns.map((col) => (
                                        <option key={col.name} value={col.name}>{col.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
                                    Find
                                </label>
                                <input
                                    type="text"
                                    value={findValue}
                                    onChange={(e) => setFindValue(e.target.value)}
                                    placeholder="Value to find..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
                                    Replace With
                                </label>
                                <input
                                    type="text"
                                    value={replaceValue}
                                    onChange={(e) => setReplaceValue(e.target.value)}
                                    placeholder="Replacement value..."
                                />
                            </div>

                            {findValue && selectedColumn && (
                                <p className="text-sm text-[rgb(var(--text-secondary))]">
                                    Found <strong>{matchCount}</strong> matching rows
                                </p>
                            )}

                            <button
                                onClick={handleFindReplace}
                                disabled={!selectedColumn || !findValue || matchCount === 0}
                                className="btn btn-primary w-full"
                            >
                                Replace {matchCount} Occurrences
                            </button>
                        </div>
                    )}

                    {activeAction === 'outliers' && (
                        <div className="space-y-4">
                            <p className="text-sm text-[rgb(var(--text-secondary))]">
                                Remove outliers using the IQR (Interquartile Range) method.
                            </p>

                            <div>
                                <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
                                    Select Numeric Column
                                </label>
                                <select
                                    value={selectedColumn}
                                    onChange={(e) => setSelectedColumn(e.target.value)}
                                >
                                    <option value="">Choose column...</option>
                                    {numericColumns.map((col) => (
                                        <option key={col.name} value={col.name}>{col.name}</option>
                                    ))}
                                </select>
                            </div>

                            {selectedColumn && (
                                <div className="p-3 rounded-lg bg-[rgb(var(--bg-secondary))]">
                                    <p className="text-sm">
                                        Found <strong className="text-[rgb(var(--warning))]">{outlierCount}</strong> outliers
                                        (values outside 1.5×IQR from Q1/Q3).
                                    </p>
                                </div>
                            )}

                            <button
                                onClick={handleRemoveOutliers}
                                disabled={!selectedColumn || outlierCount === 0}
                                className="btn btn-primary w-full"
                            >
                                Remove {outlierCount} Outliers
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
