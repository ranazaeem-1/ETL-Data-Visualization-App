'use client';

import React, { useState } from 'react';
import { X, Palette, Type, Grid3X3, Eye, EyeOff } from 'lucide-react';
import { ChartConfig } from '@/lib/store';

interface ChartEditPanelProps {
    config: ChartConfig;
    onUpdate: (updates: Partial<ChartConfig>) => void;
    onClose: () => void;
}

const COLOR_PRESETS = [
    { name: 'Default', colors: ['#6366f1', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981'] },
    { name: 'Ocean', colors: ['#0ea5e9', '#06b6d4', '#14b8a6', '#22d3ee', '#38bdf8'] },
    { name: 'Sunset', colors: ['#f97316', '#ef4444', '#f43f5e', '#ec4899', '#d946ef'] },
    { name: 'Forest', colors: ['#22c55e', '#16a34a', '#10b981', '#14b8a6', '#059669'] },
    { name: 'Monochrome', colors: ['#475569', '#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0'] },
];

export function ChartEditPanel({ config, onUpdate, onClose }: ChartEditPanelProps) {
    const [title, setTitle] = useState(config.title);
    const [selectedPreset, setSelectedPreset] = useState(0);
    const [showGrid, setShowGrid] = useState(true);
    const [showLegend, setShowLegend] = useState(true);

    const handleSave = () => {
        onUpdate({
            title,
            colorScheme: COLOR_PRESETS[selectedPreset].colors,
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-md glass-strong rounded-2xl shadow-2xl animate-fade-in-up">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-[rgb(var(--text-primary))]/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                            <Palette className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">Edit Chart</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-[rgb(var(--text-primary))]/5 transition-colors"
                    >
                        <X className="w-5 h-5 text-[rgb(var(--text-secondary))]" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-5">
                    {/* Title */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
                            <Type className="w-4 h-4" />
                            Chart Title
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2.5 bg-[rgb(var(--text-primary))]/[0.03] border border-[rgb(var(--text-primary))]/10 rounded-xl text-[rgb(var(--text-primary))] focus:outline-none focus:border-indigo-500/50 transition-all"
                        />
                    </div>

                    {/* Color Scheme */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-[rgb(var(--text-secondary))] mb-3">
                            <Palette className="w-4 h-4" />
                            Color Scheme
                        </label>
                        <div className="space-y-2">
                            {COLOR_PRESETS.map((preset, index) => (
                                <button
                                    key={preset.name}
                                    onClick={() => setSelectedPreset(index)}
                                    className={`
                    w-full p-3 rounded-xl border transition-all flex items-center justify-between
                    ${selectedPreset === index
                                            ? 'bg-indigo-500/10 border-indigo-500/30'
                                            : 'bg-[rgb(var(--text-primary))]/[0.02] border-[rgb(var(--text-primary))]/5 hover:border-indigo-500/20'
                                        }
                  `}
                                >
                                    <span className="text-sm font-medium text-[rgb(var(--text-primary))]">
                                        {preset.name}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        {preset.colors.map((color, i) => (
                                            <div
                                                key={i}
                                                className="w-5 h-5 rounded-full shadow-sm"
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Toggle Options */}
                    <div className="space-y-3">
                        <button
                            onClick={() => setShowGrid(!showGrid)}
                            className={`
                w-full p-3 rounded-xl border transition-all flex items-center justify-between
                ${showGrid
                                    ? 'bg-emerald-500/10 border-emerald-500/20'
                                    : 'bg-[rgb(var(--text-primary))]/[0.02] border-[rgb(var(--text-primary))]/5'
                                }
              `}
                        >
                            <span className="flex items-center gap-2 text-sm font-medium text-[rgb(var(--text-primary))]">
                                <Grid3X3 className="w-4 h-4" />
                                Show Grid Lines
                            </span>
                            {showGrid ? (
                                <Eye className="w-4 h-4 text-emerald-500" />
                            ) : (
                                <EyeOff className="w-4 h-4 text-[rgb(var(--text-secondary))]" />
                            )}
                        </button>

                        <button
                            onClick={() => setShowLegend(!showLegend)}
                            className={`
                w-full p-3 rounded-xl border transition-all flex items-center justify-between
                ${showLegend
                                    ? 'bg-emerald-500/10 border-emerald-500/20'
                                    : 'bg-[rgb(var(--text-primary))]/[0.02] border-[rgb(var(--text-primary))]/5'
                                }
              `}
                        >
                            <span className="flex items-center gap-2 text-sm font-medium text-[rgb(var(--text-primary))]">
                                <Type className="w-4 h-4" />
                                Show Legend
                            </span>
                            {showLegend ? (
                                <Eye className="w-4 h-4 text-emerald-500" />
                            ) : (
                                <EyeOff className="w-4 h-4 text-[rgb(var(--text-secondary))]" />
                            )}
                        </button>
                    </div>
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
                        onClick={handleSave}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
