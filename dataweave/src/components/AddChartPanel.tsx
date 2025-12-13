'use client';

import React from 'react';
import { Plus, X } from 'lucide-react';
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
    const [yAxis2, setYAxis2] = React.useState('');
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
            yAxis2: chartType === 'dualAxis' ? yAxis2 : undefined,
            aggregation: 'sum',
        });

        setIsOpen(false);
        setXAxis('');
        setYAxis('');
        setYAxis2('');
        setTitle('');
    };

    const chartTypes: { type: ChartConfig['type']; label: string }[] = [
        { type: 'bar', label: 'Bar' },
        { type: 'line', label: 'Line' },
        { type: 'area', label: 'Area' },
        { type: 'pie', label: 'Pie' },
        { type: 'scatter', label: 'Scatter' },
        { type: 'treemap', label: 'Treemap' },
        { type: 'dualAxis', label: 'Dual Axis' },
    ];

    if (!isOpen) {
        return (
            <button onClick={() => setIsOpen(true)} className="btn btn-primary">
                <Plus className="w-4 h-4" />
                Add Chart
            </button>
        );
    }

    return (
        <div className="modal-overlay animate-fade-in" onClick={() => setIsOpen(false)}>
            <div className="modal-content w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-[rgb(var(--border-color))]">
                    <h3 className="font-semibold text-[rgb(var(--text-primary))]">Add Chart</h3>
                    <button onClick={() => setIsOpen(false)} className="btn-icon">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
                            Chart Type
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {chartTypes.map((ct) => (
                                <button
                                    key={ct.type}
                                    type="button"
                                    onClick={() => setChartType(ct.type)}
                                    className={`px-3 py-2 text-sm rounded-lg border transition-colors ${chartType === ct.type
                                        ? 'border-[rgb(var(--accent))] bg-[rgba(var(--accent),0.1)] text-[rgb(var(--accent))]'
                                        : 'border-[rgb(var(--border-color))] text-[rgb(var(--text-secondary))] hover:border-[rgb(var(--accent))]'
                                        }`}
                                >
                                    {ct.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
                            Title
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Chart title..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
                            X-Axis Column
                        </label>
                        <select value={xAxis} onChange={(e) => setXAxis(e.target.value)} required>
                            <option value="">Select column...</option>
                            <optgroup label="Categorical">
                                {categoricalCols.map((col) => (
                                    <option key={col.name} value={col.name}>{col.name}</option>
                                ))}
                            </optgroup>
                            <optgroup label="Numeric">
                                {numericCols.map((col) => (
                                    <option key={col.name} value={col.name}>{col.name}</option>
                                ))}
                            </optgroup>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
                            Y-Axis Column {chartType === 'dualAxis' ? '(Left)' : '(optional)'}
                        </label>
                        <select value={yAxis} onChange={(e) => setYAxis(e.target.value)} required={chartType === 'dualAxis'}>
                            <option value="">{chartType === 'dualAxis' ? 'Select column...' : 'Count'}</option>
                            {numericCols.map((col) => (
                                <option key={col.name} value={col.name}>{col.name}</option>
                            ))}
                        </select>
                    </div>

                    {chartType === 'dualAxis' && (
                        <div>
                            <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
                                Y-Axis Column (Right)
                            </label>
                            <select value={yAxis2} onChange={(e) => setYAxis2(e.target.value)} required>
                                <option value="">Select column...</option>
                                {numericCols.filter((col) => col.name !== yAxis).map((col) => (
                                    <option key={col.name} value={col.name}>{col.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="flex gap-2 pt-2">
                        <button type="button" onClick={() => setIsOpen(false)} className="btn btn-secondary flex-1">
                            Cancel
                        </button>
                        <button type="submit" disabled={!xAxis} className="btn btn-primary flex-1">
                            Add Chart
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
