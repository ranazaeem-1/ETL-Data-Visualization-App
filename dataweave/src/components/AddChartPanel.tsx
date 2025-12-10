'use client';

import React from 'react';
import { Plus, BarChart3, LineChart, PieChart, ScatterChart, AreaChart } from 'lucide-react';
import { ChartConfig } from '@/lib/store';

interface AddChartPanelProps {
    columns: { name: string; type: string }[];
    onAddChart: (config: Omit<ChartConfig, 'id'>) => void;
}

export function AddChartPanel({ columns, onAddChart }: AddChartPanelProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [chartType, setChartType] = React.useState<ChartConfig['type']>('bar');
    const [xAxis, setXAxis] = React.useState('');
    const [yAxis, setYAxis] = React.useState('');
    const [title, setTitle] = React.useState('');

    const numericCols = columns.filter((c) => c.type === 'numeric');
    const categoricalCols = columns.filter((c) => c.type === 'categorical' || c.type === 'date');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!xAxis) return;

        onAddChart({
            type: chartType,
            title: title || `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart`,
            xAxis,
            yAxis: yAxis || undefined,
            aggregation: 'sum',
        });

        setIsOpen(false);
        setXAxis('');
        setYAxis('');
        setTitle('');
    };

    const chartTypes: { type: ChartConfig['type']; icon: React.ElementType; label: string; gradient: string }[] = [
        { type: 'bar', icon: BarChart3, label: 'Bar', gradient: 'from-blue-500 to-cyan-500' },
        { type: 'line', icon: LineChart, label: 'Line', gradient: 'from-purple-500 to-pink-500' },
        { type: 'area', icon: AreaChart, label: 'Area', gradient: 'from-emerald-500 to-teal-500' },
        { type: 'pie', icon: PieChart, label: 'Pie', gradient: 'from-amber-500 to-orange-500' },
        { type: 'scatter', icon: ScatterChart, label: 'Scatter', gradient: 'from-indigo-500 to-purple-500' },
    ];

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all"
            >
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                Add Chart
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Panel */}
                    <div className="absolute right-0 top-full mt-3 w-96 z-50 animate-fade-in">
                        <div className="glass-strong rounded-2xl p-5 shadow-2xl border border-white/10">
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Chart Type Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-white/70 mb-3">Chart Type</label>
                                    <div className="grid grid-cols-5 gap-2">
                                        {chartTypes.map(({ type, icon: Icon, label, gradient }) => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setChartType(type)}
                                                className={`
                          p-3 rounded-xl flex flex-col items-center gap-1.5 transition-all duration-300
                          ${chartType === type
                                                        ? `bg-gradient-to-br ${gradient} text-white shadow-lg scale-105`
                                                        : 'bg-white/[0.03] text-white/50 hover:bg-white/[0.06] hover:text-white/80 border border-white/5'
                                                    }
                        `}
                                            >
                                                <Icon className="w-5 h-5" />
                                                <span className="text-[10px] font-medium">{label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-medium text-white/70 mb-2">Title</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Chart title..."
                                        className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] transition-all"
                                    />
                                </div>

                                {/* X-Axis */}
                                <div>
                                    <label className="block text-sm font-medium text-white/70 mb-2">X-Axis / Category</label>
                                    <select
                                        value={xAxis}
                                        onChange={(e) => setXAxis(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500/50 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="">Select column...</option>
                                        {(chartType === 'scatter' ? numericCols : [...categoricalCols, ...numericCols]).map((col) => (
                                            <option key={col.name} value={col.name}>
                                                {col.name} ({col.type})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Y-Axis */}
                                {chartType !== 'pie' && (
                                    <div>
                                        <label className="block text-sm font-medium text-white/70 mb-2">Y-Axis / Value</label>
                                        <select
                                            value={yAxis}
                                            onChange={(e) => setYAxis(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500/50 transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="">Select column...</option>
                                            {numericCols.map((col) => (
                                                <option key={col.name} value={col.name}>
                                                    {col.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Buttons */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsOpen(false)}
                                        className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white/60 hover:text-white hover:bg-white/[0.06] transition-all font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!xAxis}
                                        className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
                                    >
                                        Add Chart
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
