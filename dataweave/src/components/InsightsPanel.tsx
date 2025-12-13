'use client';

import React, { useMemo } from 'react';
import { X, Lightbulb, TrendingUp, TrendingDown, AlertTriangle, Sparkles, BarChart3, PieChart } from 'lucide-react';
import { ColumnInfo } from '@/lib/store';

interface InsightsPanelProps {
    data: Record<string, unknown>[];
    columns: ColumnInfo[];
    onClose: () => void;
}

interface Insight {
    type: 'trend' | 'anomaly' | 'distribution' | 'correlation' | 'summary';
    icon: React.ReactNode;
    title: string;
    description: string;
    value?: string;
    change?: number;
    severity?: 'info' | 'warning' | 'critical';
}

// Detect outliers using IQR method
function detectOutliers(values: number[]): { outliers: number[]; count: number } {
    if (values.length < 4) return { outliers: [], count: 0 };

    const sorted = [...values].sort((a, b) => a - b);
    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);
    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    const outliers = values.filter((v) => v < lowerBound || v > upperBound);
    return { outliers, count: outliers.length };
}

// Calculate percentage change
function calculateChange(values: number[]): number | null {
    if (values.length < 2) return null;
    const first = values[0];
    const last = values[values.length - 1];
    if (first === 0) return null;
    return ((last - first) / Math.abs(first)) * 100;
}

// Calculate skewness
function calculateSkewness(values: number[]): number {
    if (values.length < 3) return 0;
    const n = values.length;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
    const std = Math.sqrt(variance);
    if (std === 0) return 0;
    const skew = values.reduce((sum, v) => sum + Math.pow((v - mean) / std, 3), 0) / n;
    return skew;
}

export function InsightsPanel({ data, columns, onClose }: InsightsPanelProps) {
    const insights = useMemo(() => {
        const result: Insight[] = [];

        // Dataset summary
        result.push({
            type: 'summary',
            icon: <BarChart3 className="w-5 h-5 text-blue-500" />,
            title: 'Dataset Overview',
            description: `Your dataset contains ${data.length.toLocaleString()} rows and ${columns.length} columns.`,
            value: `${data.length.toLocaleString()} records`,
        });

        // Analyze numeric columns
        const numericColumns = columns.filter((c) => c.type === 'numeric');

        numericColumns.forEach((col) => {
            const values = data
                .map((row) => row[col.name])
                .filter((v): v is number => typeof v === 'number' && !isNaN(v));

            if (values.length === 0) return;

            // Outlier detection
            const { count: outlierCount } = detectOutliers(values);
            if (outlierCount > 0) {
                const percentage = ((outlierCount / values.length) * 100).toFixed(1);
                result.push({
                    type: 'anomaly',
                    icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
                    title: `Outliers in ${col.name}`,
                    description: `Found ${outlierCount} potential outlier${outlierCount > 1 ? 's' : ''} (${percentage}% of data) using IQR method.`,
                    value: `${outlierCount} outliers`,
                    severity: outlierCount > values.length * 0.1 ? 'critical' : 'warning',
                });
            }

            // Trend analysis (if data seems sequential)
            if (values.length >= 10) {
                const change = calculateChange(values);
                if (change !== null && Math.abs(change) > 5) {
                    result.push({
                        type: 'trend',
                        icon: change > 0
                            ? <TrendingUp className="w-5 h-5 text-emerald-500" />
                            : <TrendingDown className="w-5 h-5 text-red-500" />,
                        title: `${col.name} Trend`,
                        description: change > 0
                            ? `${col.name} shows an overall increase of ${Math.abs(change).toFixed(1)}% from start to end.`
                            : `${col.name} shows an overall decrease of ${Math.abs(change).toFixed(1)}% from start to end.`,
                        value: `${change > 0 ? '+' : ''}${change.toFixed(1)}%`,
                        change,
                    });
                }
            }

            // Distribution insight
            const skewness = calculateSkewness(values);
            if (Math.abs(skewness) > 1) {
                result.push({
                    type: 'distribution',
                    icon: <PieChart className="w-5 h-5 text-purple-500" />,
                    title: `${col.name} Distribution`,
                    description: skewness > 0
                        ? `${col.name} has a right-skewed distribution. Most values are lower than the mean.`
                        : `${col.name} has a left-skewed distribution. Most values are higher than the mean.`,
                    value: skewness > 0 ? 'Right-skewed' : 'Left-skewed',
                });
            }

            // High variability
            if (col.stats?.stdDev && col.stats?.mean && col.stats.mean !== 0) {
                const cv = (col.stats.stdDev / Math.abs(col.stats.mean)) * 100;
                if (cv > 100) {
                    result.push({
                        type: 'distribution',
                        icon: <Sparkles className="w-5 h-5 text-cyan-500" />,
                        title: `High Variability in ${col.name}`,
                        description: `${col.name} has a coefficient of variation of ${cv.toFixed(0)}%, indicating high variability in the data.`,
                        value: `CV: ${cv.toFixed(0)}%`,
                        severity: 'warning',
                    });
                }
            }
        });

        // Categorical insights
        const categoricalColumns = columns.filter((c) => c.type === 'categorical');

        categoricalColumns.forEach((col) => {
            // Low cardinality check
            if (col.unique === 2) {
                result.push({
                    type: 'summary',
                    icon: <Lightbulb className="w-5 h-5 text-yellow-500" />,
                    title: `Binary Column: ${col.name}`,
                    description: `${col.name} has only 2 unique values - this could be a good target for binary classification.`,
                    value: '2 values',
                });
            }

            // High cardinality check
            if (col.unique > data.length * 0.9) {
                result.push({
                    type: 'anomaly',
                    icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
                    title: `High Cardinality: ${col.name}`,
                    description: `${col.name} has ${col.unique} unique values (${((col.unique / data.length) * 100).toFixed(0)}% of rows). This might be an ID column.`,
                    value: `${col.unique} unique`,
                    severity: 'warning',
                });
            }
        });

        // Missing values insight
        const columnsWithMissing = columns.filter((c) => c.missing > 0);
        if (columnsWithMissing.length > 0) {
            const totalMissing = columnsWithMissing.reduce((sum, c) => sum + c.missing, 0);
            result.push({
                type: 'anomaly',
                icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
                title: 'Missing Values Detected',
                description: `${columnsWithMissing.length} column${columnsWithMissing.length > 1 ? 's have' : ' has'} missing values. Total: ${totalMissing.toLocaleString()} missing cells.`,
                value: `${totalMissing.toLocaleString()} missing`,
                severity: totalMissing > data.length * 0.1 ? 'critical' : 'warning',
            });
        }

        // Correlation hints (simplified)
        if (numericColumns.length >= 2) {
            result.push({
                type: 'correlation',
                icon: <Sparkles className="w-5 h-5 text-indigo-500" />,
                title: 'Correlation Analysis Available',
                description: `With ${numericColumns.length} numeric columns, you can explore correlations using the Correlation Heatmap tool.`,
                value: `${numericColumns.length} numeric columns`,
            });
        }

        return result;
    }, [data, columns]);

    const groupedInsights = {
        summary: insights.filter((i) => i.type === 'summary'),
        trend: insights.filter((i) => i.type === 'trend'),
        anomaly: insights.filter((i) => i.type === 'anomaly'),
        distribution: insights.filter((i) => i.type === 'distribution'),
        correlation: insights.filter((i) => i.type === 'correlation'),
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-3xl glass-strong rounded-2xl shadow-2xl animate-fade-in-up max-h-[85vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-[rgb(var(--text-primary))]/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                            <Lightbulb className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">Auto Insights</h2>
                            <p className="text-sm text-[rgb(var(--text-secondary))]">
                                {insights.length} insights discovered
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
                <div className="flex-1 overflow-auto p-5 space-y-6">
                    {/* Anomalies & Warnings */}
                    {groupedInsights.anomaly.length > 0 && (
                        <div>
                            <h3 className="text-sm font-medium text-amber-500 mb-3 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                Anomalies & Warnings ({groupedInsights.anomaly.length})
                            </h3>
                            <div className="space-y-2">
                                {groupedInsights.anomaly.map((insight, i) => (
                                    <InsightCard key={i} insight={insight} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Trends */}
                    {groupedInsights.trend.length > 0 && (
                        <div>
                            <h3 className="text-sm font-medium text-emerald-500 mb-3 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" />
                                Trends ({groupedInsights.trend.length})
                            </h3>
                            <div className="space-y-2">
                                {groupedInsights.trend.map((insight, i) => (
                                    <InsightCard key={i} insight={insight} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Distribution */}
                    {groupedInsights.distribution.length > 0 && (
                        <div>
                            <h3 className="text-sm font-medium text-purple-500 mb-3 flex items-center gap-2">
                                <PieChart className="w-4 h-4" />
                                Distribution Insights ({groupedInsights.distribution.length})
                            </h3>
                            <div className="space-y-2">
                                {groupedInsights.distribution.map((insight, i) => (
                                    <InsightCard key={i} insight={insight} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Summary */}
                    {groupedInsights.summary.length > 0 && (
                        <div>
                            <h3 className="text-sm font-medium text-blue-500 mb-3 flex items-center gap-2">
                                <BarChart3 className="w-4 h-4" />
                                Summary ({groupedInsights.summary.length})
                            </h3>
                            <div className="space-y-2">
                                {groupedInsights.summary.map((insight, i) => (
                                    <InsightCard key={i} insight={insight} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Correlation hints */}
                    {groupedInsights.correlation.length > 0 && (
                        <div>
                            <h3 className="text-sm font-medium text-indigo-500 mb-3 flex items-center gap-2">
                                <Sparkles className="w-4 h-4" />
                                Analysis Suggestions
                            </h3>
                            <div className="space-y-2">
                                {groupedInsights.correlation.map((insight, i) => (
                                    <InsightCard key={i} insight={insight} />
                                ))}
                            </div>
                        </div>
                    )}

                    {insights.length === 0 && (
                        <div className="text-center py-12">
                            <Lightbulb className="w-12 h-12 mx-auto mb-4 text-[rgb(var(--text-secondary))]/30" />
                            <p className="text-[rgb(var(--text-secondary))]">No insights found for this dataset.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function InsightCard({ insight }: { insight: Insight }) {
    return (
        <div className={`
      p-4 rounded-xl border transition-all
      ${insight.severity === 'critical'
                ? 'bg-red-500/10 border-red-500/20'
                : insight.severity === 'warning'
                    ? 'bg-amber-500/10 border-amber-500/20'
                    : 'bg-[rgb(var(--text-primary))]/[0.02] border-[rgb(var(--text-primary))]/5'
            }
    `}>
            <div className="flex items-start gap-3">
                <div className="mt-0.5">{insight.icon}</div>
                <div className="flex-1">
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium text-[rgb(var(--text-primary))]">{insight.title}</h4>
                        {insight.value && (
                            <span className={`
                text-sm font-medium px-2 py-0.5 rounded-lg
                ${insight.change !== undefined
                                    ? insight.change > 0
                                        ? 'bg-emerald-500/10 text-emerald-500'
                                        : 'bg-red-500/10 text-red-500'
                                    : 'bg-[rgb(var(--text-primary))]/[0.05] text-[rgb(var(--text-secondary))]'
                                }
              `}>
                                {insight.value}
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-[rgb(var(--text-secondary))] mt-1">{insight.description}</p>
                </div>
            </div>
        </div>
    );
}
