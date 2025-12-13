'use client';

import React, { useMemo } from 'react';
import { X, Grid3X3, TrendingUp, TrendingDown } from 'lucide-react';
import { ColumnInfo } from '@/lib/store';

interface CorrelationHeatmapProps {
    data: Record<string, unknown>[];
    columns: ColumnInfo[];
    onClose: () => void;
}

// Calculate Pearson correlation coefficient
function calculateCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    if (n === 0 || n !== y.length) return 0;

    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denomX = 0;
    let denomY = 0;

    for (let i = 0; i < n; i++) {
        const dx = x[i] - meanX;
        const dy = y[i] - meanY;
        numerator += dx * dy;
        denomX += dx * dx;
        denomY += dy * dy;
    }

    const denom = Math.sqrt(denomX * denomY);
    return denom === 0 ? 0 : numerator / denom;
}

// Get color for correlation value
function getCorrelationColor(value: number): string {
    const intensity = Math.abs(value);
    if (value > 0) {
        // Positive: Blue
        const r = Math.round(99 - intensity * 60);
        const g = Math.round(102 - intensity * 40);
        const b = Math.round(241);
        return `rgb(${r}, ${g}, ${b})`;
    } else if (value < 0) {
        // Negative: Red
        const r = Math.round(239);
        const g = Math.round(68 - intensity * 30);
        const b = Math.round(68 - intensity * 30);
        return `rgb(${r}, ${g}, ${b})`;
    }
    // Zero: Gray
    return 'rgb(100, 100, 100)';
}

export function CorrelationHeatmap({ data, columns, onClose }: CorrelationHeatmapProps) {
    const numericColumns = useMemo(() => {
        return columns.filter((c) => c.type === 'numeric');
    }, [columns]);

    const correlationMatrix = useMemo(() => {
        const matrix: { x: string; y: string; value: number }[] = [];

        // Extract numeric values for each column
        const columnValues: Record<string, number[]> = {};

        for (const col of numericColumns) {
            columnValues[col.name] = data
                .map((row) => row[col.name])
                .filter((v): v is number => typeof v === 'number' && !isNaN(v));
        }

        // Calculate correlations
        for (const colX of numericColumns) {
            for (const colY of numericColumns) {
                const xVals = columnValues[colX.name];
                const yVals = columnValues[colY.name];

                // Need to align values (only use rows where both have valid values)
                const pairs: { x: number; y: number }[] = [];
                data.forEach((row) => {
                    const x = row[colX.name];
                    const y = row[colY.name];
                    if (typeof x === 'number' && !isNaN(x) && typeof y === 'number' && !isNaN(y)) {
                        pairs.push({ x, y });
                    }
                });

                const correlation = colX.name === colY.name
                    ? 1
                    : calculateCorrelation(
                        pairs.map((p) => p.x),
                        pairs.map((p) => p.y)
                    );

                matrix.push({
                    x: colX.name,
                    y: colY.name,
                    value: Math.round(correlation * 100) / 100,
                });
            }
        }

        return matrix;
    }, [data, numericColumns]);

    // Find strongest correlations (excluding self-correlation)
    const strongCorrelations = useMemo(() => {
        return correlationMatrix
            .filter((c) => c.x !== c.y)
            .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
            .slice(0, 5);
    }, [correlationMatrix]);

    if (numericColumns.length < 2) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
                <div className="relative glass-strong rounded-2xl p-8 max-w-md text-center animate-fade-in-up">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                        <Grid3X3 className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-[rgb(var(--text-primary))] mb-2">
                        Need More Numeric Columns
                    </h3>
                    <p className="text-[rgb(var(--text-secondary))] mb-6">
                        Correlation analysis requires at least 2 numeric columns. You currently have {numericColumns.length}.
                    </p>
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium hover:shadow-lg transition-all"
                    >
                        Got it
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-4xl glass-strong rounded-2xl shadow-2xl animate-fade-in-up max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-[rgb(var(--text-primary))]/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <Grid3X3 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">Correlation Heatmap</h2>
                            <p className="text-sm text-[rgb(var(--text-secondary))]">
                                Analyzing {numericColumns.length} numeric columns
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
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Heatmap */}
                        <div className="lg:col-span-2">
                            <div className="overflow-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr>
                                            <th className="p-2 text-xs text-[rgb(var(--text-secondary))]"></th>
                                            {numericColumns.map((col) => (
                                                <th
                                                    key={col.name}
                                                    className="p-2 text-xs text-[rgb(var(--text-secondary))] font-medium"
                                                    style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                                                >
                                                    <span className="truncate max-w-[80px] block">{col.name}</span>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {numericColumns.map((rowCol) => (
                                            <tr key={rowCol.name}>
                                                <td className="p-2 text-xs text-[rgb(var(--text-secondary))] font-medium truncate max-w-[100px]">
                                                    {rowCol.name}
                                                </td>
                                                {numericColumns.map((cellCol) => {
                                                    const cell = correlationMatrix.find(
                                                        (c) => c.x === rowCol.name && c.y === cellCol.name
                                                    );
                                                    const value = cell?.value ?? 0;
                                                    return (
                                                        <td key={cellCol.name} className="p-1">
                                                            <div
                                                                className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-medium transition-transform hover:scale-110 cursor-default"
                                                                style={{
                                                                    backgroundColor: getCorrelationColor(value),
                                                                    color: Math.abs(value) > 0.3 ? 'white' : 'rgba(255,255,255,0.7)',
                                                                }}
                                                                title={`${rowCol.name} × ${cellCol.name}: ${value}`}
                                                            >
                                                                {value.toFixed(2)}
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Legend */}
                            <div className="mt-4 flex items-center justify-center gap-4">
                                <span className="text-xs text-[rgb(var(--text-secondary))]">Strong Negative</span>
                                <div className="flex gap-0.5">
                                    {[-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1].map((v) => (
                                        <div
                                            key={v}
                                            className="w-6 h-4 rounded-sm"
                                            style={{ backgroundColor: getCorrelationColor(v) }}
                                        />
                                    ))}
                                </div>
                                <span className="text-xs text-[rgb(var(--text-secondary))]">Strong Positive</span>
                            </div>
                        </div>

                        {/* Insights */}
                        <div className="space-y-4">
                            <h3 className="font-medium text-[rgb(var(--text-primary))]">Top Correlations</h3>

                            {strongCorrelations.map((corr, i) => (
                                <div
                                    key={`${corr.x}-${corr.y}`}
                                    className="p-3 rounded-xl bg-[rgb(var(--text-primary))]/[0.02] border border-[rgb(var(--text-primary))]/5"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`text-sm font-medium ${corr.value > 0 ? 'text-blue-500' : 'text-red-500'
                                            }`}>
                                            {corr.value > 0 ? (
                                                <TrendingUp className="w-4 h-4 inline mr-1" />
                                            ) : (
                                                <TrendingDown className="w-4 h-4 inline mr-1" />
                                            )}
                                            {corr.value.toFixed(2)}
                                        </span>
                                        <span className="text-xs text-[rgb(var(--text-secondary))]">
                                            {Math.abs(corr.value) > 0.7 ? 'Strong' : Math.abs(corr.value) > 0.4 ? 'Moderate' : 'Weak'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[rgb(var(--text-secondary))]">
                                        <span className="text-[rgb(var(--text-primary))]">{corr.x}</span>
                                        {' '}×{' '}
                                        <span className="text-[rgb(var(--text-primary))]">{corr.y}</span>
                                    </p>
                                </div>
                            ))}

                            {strongCorrelations.length === 0 && (
                                <p className="text-sm text-[rgb(var(--text-secondary))]">
                                    No significant correlations found.
                                </p>
                            )}

                            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                                <p className="text-xs text-[rgb(var(--text-secondary))]">
                                    <strong className="text-indigo-500">Correlation ranges from -1 to 1.</strong>
                                    <br /><br />
                                    Values close to 1 indicate strong positive correlation (when one increases, the other increases).
                                    <br /><br />
                                    Values close to -1 indicate strong negative correlation (when one increases, the other decreases).
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
