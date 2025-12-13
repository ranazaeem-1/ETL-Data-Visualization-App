'use client';

import React, { useMemo } from 'react';
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    ScatterChart,
    Scatter,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    Treemap,
    ComposedChart,
    Legend,
} from 'recharts';
import { X, Settings } from 'lucide-react';
import { ChartConfig } from '@/lib/store';
import { aggregateData, prepareHistogramData, prepareScatterData, CHART_COLORS } from '@/lib/vis-engine';

interface ChartCardProps {
    config: ChartConfig;
    data: Record<string, unknown>[];
    onRemove: () => void;
    onEdit?: () => void;
}

export function ChartCard({ config, data, onRemove, onEdit }: ChartCardProps) {
    const aggregatedData = useMemo(() => {
        return aggregateData(
            data,
            config.xAxis || '',
            config.yAxis,
            config.aggregation || 'sum'
        );
    }, [data, config.xAxis, config.yAxis, config.aggregation]);

    const histogramData = useMemo(() => {
        return prepareHistogramData(data, config.xAxis || '');
    }, [data, config.xAxis]);

    const scatterData = useMemo(() => {
        return prepareScatterData(data, config.xAxis || '', config.yAxis || '');
    }, [data, config.xAxis, config.yAxis]);

    const hasData = config.type === 'scatter'
        ? scatterData.length > 0
        : config.type === 'histogram'
            ? histogramData.length > 0
            : config.type === 'dualAxis'
                ? aggregatedData.length > 0
                : aggregatedData.length > 0;

    // Prepare dual-axis data
    const dualAxisData = useMemo(() => {
        if (config.type !== 'dualAxis' || !config.yAxis2) return [];

        const y1Data = aggregateData(data, config.xAxis || '', config.yAxis, config.aggregation || 'sum');
        const y2Map = new Map<string, number>();

        data.forEach((row) => {
            const key = String(row[config.xAxis || ''] ?? '');
            const val = row[config.yAxis2 || ''];
            if (typeof val === 'number') {
                y2Map.set(key, (y2Map.get(key) || 0) + val);
            }
        });

        return y1Data.map((item: { name: string; value: number }) => ({
            name: item.name,
            value1: item.value,
            value2: y2Map.get(item.name) || 0,
        }));
    }, [data, config.xAxis, config.yAxis, config.yAxis2, config.aggregation, config.type]);

    const tooltipStyle = {
        backgroundColor: 'rgb(var(--bg-primary))',
        border: '1px solid rgb(var(--border-color))',
        borderRadius: '6px',
        color: 'rgb(var(--text-primary))',
    };

    const axisStyle = {
        fill: 'rgb(var(--text-secondary))',
        fontSize: 11,
    };

    const renderChart = () => {
        switch (config.type) {
            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={aggregatedData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border-color))" vertical={false} />
                            <XAxis dataKey="name" tick={axisStyle} angle={-45} textAnchor="end" height={60} />
                            <YAxis tick={axisStyle} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                {aggregatedData.map((_: unknown, i: number) => (
                                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                );

            case 'line':
                return (
                    <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={aggregatedData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border-color))" vertical={false} />
                            <XAxis dataKey="name" tick={axisStyle} angle={-45} textAnchor="end" height={60} />
                            <YAxis tick={axisStyle} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Line type="monotone" dataKey="value" stroke={CHART_COLORS[0]} strokeWidth={2} dot={{ fill: CHART_COLORS[0], r: 3 }} />
                        </LineChart>
                    </ResponsiveContainer>
                );

            case 'area':
                return (
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={aggregatedData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border-color))" vertical={false} />
                            <XAxis dataKey="name" tick={axisStyle} angle={-45} textAnchor="end" height={60} />
                            <YAxis tick={axisStyle} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Area type="monotone" dataKey="value" stroke={CHART_COLORS[0]} fill={CHART_COLORS[0]} fillOpacity={0.3} />
                        </AreaChart>
                    </ResponsiveContainer>
                );

            case 'pie':
                return (
                    <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                            <Tooltip contentStyle={tooltipStyle} />
                            <Pie data={aggregatedData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                {aggregatedData.map((_: unknown, i: number) => (
                                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                );

            case 'scatter':
                return (
                    <ResponsiveContainer width="100%" height={280}>
                        <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border-color))" />
                            <XAxis dataKey="x" tick={axisStyle} name={config.xAxis} />
                            <YAxis dataKey="y" tick={axisStyle} name={config.yAxis} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Scatter data={scatterData} fill={CHART_COLORS[0]} />
                        </ScatterChart>
                    </ResponsiveContainer>
                );

            case 'histogram':
                return (
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={histogramData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border-color))" vertical={false} />
                            <XAxis dataKey="name" tick={axisStyle} angle={-45} textAnchor="end" height={60} />
                            <YAxis tick={axisStyle} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Bar dataKey="value" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                );

            case 'treemap': {
                const treemapData = aggregatedData.map((item: { name: string; value: number }, i: number) => ({
                    name: item.name,
                    size: item.value,
                    fill: CHART_COLORS[i % CHART_COLORS.length],
                }));
                return (
                    <ResponsiveContainer width="100%" height={280}>
                        <Treemap data={treemapData} dataKey="size" aspectRatio={4 / 3} stroke="rgb(var(--border-color))">
                            <Tooltip contentStyle={tooltipStyle} />
                            {treemapData.map((entry: { fill: string }, i: number) => (
                                <Cell key={i} fill={entry.fill} />
                            ))}
                        </Treemap>
                    </ResponsiveContainer>
                );
            }

            case 'dualAxis':
                return (
                    <ResponsiveContainer width="100%" height={280}>
                        <ComposedChart data={dualAxisData} margin={{ top: 10, right: 50, left: 0, bottom: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border-color))" vertical={false} />
                            <XAxis dataKey="name" tick={axisStyle} angle={-45} textAnchor="end" height={60} />
                            <YAxis yAxisId="left" tick={axisStyle} stroke={CHART_COLORS[0]} />
                            <YAxis yAxisId="right" orientation="right" tick={axisStyle} stroke={CHART_COLORS[1]} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Legend />
                            <Bar yAxisId="left" dataKey="value1" name={config.yAxis} fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                            <Line yAxisId="right" type="monotone" dataKey="value2" name={config.yAxis2} stroke={CHART_COLORS[1]} strokeWidth={2} dot={{ r: 3 }} />
                        </ComposedChart>
                    </ResponsiveContainer>
                );

            default:
                return null;
        }
    };

    return (
        <div className="overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[rgb(var(--border-color))]">
                <div>
                    <h3 className="font-medium text-[rgb(var(--text-primary))]">{config.title}</h3>
                    <p className="text-xs text-[rgb(var(--text-secondary))] mt-0.5">
                        {config.xAxis}{config.yAxis ? ` vs ${config.yAxis}` : ''}
                    </p>
                </div>
                <div className="flex items-center gap-1">
                    {onEdit && (
                        <button onClick={onEdit} className="btn-icon" title="Edit chart">
                            <Settings className="w-4 h-4" />
                        </button>
                    )}
                    <button onClick={onRemove} className="btn-icon text-[rgb(var(--error))]" title="Remove chart">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Chart */}
            <div className="p-4">
                {hasData ? (
                    renderChart()
                ) : (
                    <div className="h-64 flex items-center justify-center text-[rgb(var(--text-secondary))]">
                        No data to display
                    </div>
                )}
            </div>
        </div>
    );
}
