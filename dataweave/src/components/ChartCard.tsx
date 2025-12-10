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
} from 'recharts';
import { X, Settings, Maximize2 } from 'lucide-react';
import { ChartConfig } from '@/lib/store';
import { aggregateData, prepareHistogramData, prepareScatterData, CHART_COLORS } from '@/lib/vis-engine';

interface ChartCardProps {
    config: ChartConfig;
    data: Record<string, unknown>[];
    onRemove: () => void;
    onEdit?: () => void;
}

const tooltipStyle = {
    backgroundColor: 'rgba(10, 10, 20, 0.95)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    color: 'white',
    boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
    padding: '12px 16px',
};

const axisTickStyle = { fill: 'rgba(255,255,255,0.5)', fontSize: 11 };
const chartMargin = { top: 20, right: 20, left: 10, bottom: 60 };

// Gradient colors for charts
const GRADIENT_COLORS = [
    { start: '#6366f1', end: '#8b5cf6' },
    { start: '#ec4899', end: '#f43f5e' },
    { start: '#06b6d4', end: '#3b82f6' },
    { start: '#10b981', end: '#22d3ee' },
    { start: '#f59e0b', end: '#ef4444' },
];

export function ChartCard({ config, data, onRemove, onEdit }: ChartCardProps) {
    const aggregatedData = useMemo(() => {
        return aggregateData(data, config.xAxis || '', config.yAxis, config.aggregation);
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
            : aggregatedData.length > 0;

    const chartId = `chart-${config.id}`;

    const renderChart = () => {
        switch (config.type) {
            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={aggregatedData} margin={chartMargin}>
                            <defs>
                                {aggregatedData.map((_, i) => (
                                    <linearGradient key={i} id={`barGrad-${chartId}-${i}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={GRADIENT_COLORS[i % GRADIENT_COLORS.length].start} stopOpacity={1} />
                                        <stop offset="100%" stopColor={GRADIENT_COLORS[i % GRADIENT_COLORS.length].end} stopOpacity={0.8} />
                                    </linearGradient>
                                ))}
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="name" tick={axisTickStyle} angle={-45} textAnchor="end" height={80} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                            <YAxis tick={axisTickStyle} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                {aggregatedData.map((_, i) => (
                                    <Cell key={i} fill={`url(#barGrad-${chartId}-${i})`} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                );

            case 'line':
                return (
                    <ResponsiveContainer width="100%" height={320}>
                        <LineChart data={aggregatedData} margin={chartMargin}>
                            <defs>
                                <linearGradient id={`lineGrad-${chartId}`} x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#6366f1" />
                                    <stop offset="50%" stopColor="#8b5cf6" />
                                    <stop offset="100%" stopColor="#ec4899" />
                                </linearGradient>
                                <filter id={`glow-${chartId}`}>
                                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                                    <feMerge>
                                        <feMergeNode in="coloredBlur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="name" tick={axisTickStyle} angle={-45} textAnchor="end" height={80} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                            <YAxis tick={axisTickStyle} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke={`url(#lineGrad-${chartId})`}
                                strokeWidth={3}
                                dot={{ fill: '#8b5cf6', strokeWidth: 0, r: 5, filter: `url(#glow-${chartId})` }}
                                activeDot={{ fill: '#ec4899', strokeWidth: 0, r: 8 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                );

            case 'area':
                return (
                    <ResponsiveContainer width="100%" height={320}>
                        <AreaChart data={aggregatedData} margin={chartMargin}>
                            <defs>
                                <linearGradient id={`areaGrad-${chartId}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.6} />
                                    <stop offset="50%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="#ec4899" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id={`areaStroke-${chartId}`} x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#6366f1" />
                                    <stop offset="100%" stopColor="#ec4899" />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="name" tick={axisTickStyle} angle={-45} textAnchor="end" height={80} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                            <YAxis tick={axisTickStyle} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={`url(#areaStroke-${chartId})`}
                                strokeWidth={2}
                                fill={`url(#areaGrad-${chartId})`}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                );

            case 'pie':
                return (
                    <ResponsiveContainer width="100%" height={320}>
                        <PieChart>
                            <defs>
                                {aggregatedData.map((_, i) => (
                                    <linearGradient key={i} id={`pieGrad-${chartId}-${i}`} x1="0" y1="0" x2="1" y2="1">
                                        <stop offset="0%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={1} />
                                        <stop offset="100%" stopColor={CHART_COLORS[(i + 1) % CHART_COLORS.length]} stopOpacity={0.8} />
                                    </linearGradient>
                                ))}
                            </defs>
                            <Pie
                                data={aggregatedData}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={110}
                                paddingAngle={3}
                                dataKey="value"
                                nameKey="name"
                                label={({ name, percent }) =>
                                    `${name || ''} (${((percent || 0) * 100).toFixed(0)}%)`
                                }
                                labelLine={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1 }}
                            >
                                {aggregatedData.map((_, i) => (
                                    <Cell
                                        key={i}
                                        fill={`url(#pieGrad-${chartId}-${i})`}
                                        stroke="rgba(0,0,0,0.3)"
                                        strokeWidth={1}
                                    />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={tooltipStyle} />
                        </PieChart>
                    </ResponsiveContainer>
                );

            case 'scatter':
                return (
                    <ResponsiveContainer width="100%" height={320}>
                        <ScatterChart margin={chartMargin}>
                            <defs>
                                <radialGradient id={`scatterGrad-${chartId}`}>
                                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.6} />
                                </radialGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis type="number" dataKey="x" name={config.xAxis || ''} tick={axisTickStyle} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                            <YAxis type="number" dataKey="y" name={config.yAxis || ''} tick={axisTickStyle} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                            <Tooltip cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.2)' }} contentStyle={tooltipStyle} />
                            <Scatter data={scatterData} fill={`url(#scatterGrad-${chartId})`}>
                                {scatterData.map((_, i) => (
                                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                ))}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                );

            case 'histogram':
                return (
                    <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={histogramData} margin={chartMargin}>
                            <defs>
                                <linearGradient id={`histGrad-${chartId}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.6} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="name" tick={axisTickStyle} angle={-45} textAnchor="end" height={80} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                            <YAxis tick={axisTickStyle} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                            <Bar dataKey="value" fill={`url(#histGrad-${chartId})`} radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                );

            default:
                return null;
        }
    };

    return (
        <div className="group relative glass-strong rounded-2xl overflow-hidden card-hover">
            {/* Glow effect on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10" />
            </div>

            {/* Header */}
            <div className="relative px-5 py-4 border-b border-white/5 flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-white">{config.title}</h3>
                    <p className="text-xs text-white/40 mt-0.5">
                        {config.xAxis}{config.yAxis ? ` × ${config.yAxis}` : ''}
                    </p>
                </div>
                <div className="flex items-center gap-1.5">
                    <button className="p-2 rounded-lg hover:bg-white/10 transition-all hover:scale-110 active:scale-95 opacity-0 group-hover:opacity-100">
                        <Maximize2 className="w-4 h-4 text-white/50" />
                    </button>
                    {onEdit && (
                        <button onClick={onEdit} className="p-2 rounded-lg hover:bg-white/10 transition-all hover:scale-110 active:scale-95 opacity-0 group-hover:opacity-100">
                            <Settings className="w-4 h-4 text-white/50" />
                        </button>
                    )}
                    <button onClick={onRemove} className="p-2 rounded-lg hover:bg-red-500/20 transition-all hover:scale-110 active:scale-95 opacity-0 group-hover:opacity-100">
                        <X className="w-4 h-4 text-white/50 hover:text-red-400" />
                    </button>
                </div>
            </div>

            {/* Chart */}
            <div className="relative p-4">
                {hasData ? renderChart() : (
                    <div className="h-[320px] flex items-center justify-center text-white/30">
                        No data available
                    </div>
                )}
            </div>
        </div>
    );
}
