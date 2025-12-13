'use client';

import React from 'react';
import { ColumnInfo } from '@/lib/store';
import { Hash, Calendar, Tag, Type, AlertCircle, TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface ColumnAnalysisPanelProps {
    columns: ColumnInfo[];
    rowCount: number;
}

const typeConfig = {
    numeric: {
        icon: Hash,
        label: 'Numeric',
        gradient: 'from-blue-500 to-cyan-500',
        bg: 'bg-blue-500/10',
        text: 'text-blue-500',
        border: 'border-blue-500/20'
    },
    date: {
        icon: Calendar,
        label: 'Date',
        gradient: 'from-purple-500 to-pink-500',
        bg: 'bg-purple-500/10',
        text: 'text-purple-500',
        border: 'border-purple-500/20'
    },
    categorical: {
        icon: Tag,
        label: 'Category',
        gradient: 'from-emerald-500 to-teal-500',
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-500',
        border: 'border-emerald-500/20'
    },
    text: {
        icon: Type,
        label: 'Text',
        gradient: 'from-amber-500 to-orange-500',
        bg: 'bg-amber-500/10',
        text: 'text-amber-500',
        border: 'border-amber-500/20'
    },
};

export function ColumnAnalysisPanel({ columns, rowCount }: ColumnAnalysisPanelProps) {
    return (
        <div className="glass-strong rounded-2xl overflow-hidden card-hover">
            {/* Header */}
            <div className="px-5 py-4 border-b border-[rgb(var(--text-primary))]/5 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                        <Activity className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-[rgb(var(--text-primary))]">Column Analysis</h3>
                        <p className="text-sm text-[rgb(var(--text-secondary))]">{columns.length} columns · {rowCount.toLocaleString()} rows</p>
                    </div>
                </div>
            </div>

            {/* Column List */}
            <div className="divide-y divide-[rgb(var(--text-primary))]/5 max-h-[600px] overflow-y-auto">
                {columns.map((column, index) => {
                    const config = typeConfig[column.type];
                    const Icon = config.icon;
                    const missingPercent = rowCount > 0 ? ((column.missing / rowCount) * 100).toFixed(1) : '0';

                    return (
                        <div
                            key={column.name}
                            className="p-4 hover:bg-[rgb(var(--text-primary))]/[0.02] transition-all duration-300 group"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="flex items-start gap-4">
                                {/* Type Icon */}
                                <div className={`relative p-2.5 rounded-xl ${config.bg} ${config.border} border group-hover:scale-110 transition-transform duration-300`}>
                                    <Icon className={`w-5 h-5 ${config.text}`} />
                                    <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${config.gradient} opacity-0 group-hover:opacity-20 transition-opacity`} />
                                </div>

                                <div className="flex-1 min-w-0">
                                    {/* Column Name & Type */}
                                    <div className="flex items-center gap-2 mb-2">
                                        <p className="font-medium text-[rgb(var(--text-primary))] truncate">{column.name}</p>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${config.bg} ${config.text} ${config.border} border`}>
                                            {config.label}
                                        </span>
                                    </div>

                                    {/* Metrics Row */}
                                    <div className="flex flex-wrap gap-3 text-sm">
                                        <span className="text-[rgb(var(--text-secondary))]">
                                            <span className="text-[rgb(var(--text-primary))]/80 font-medium">{column.unique}</span> unique
                                        </span>
                                        {column.missing > 0 && (
                                            <span className="flex items-center gap-1 text-amber-500">
                                                <AlertCircle className="w-3.5 h-3.5" />
                                                {missingPercent}% missing
                                            </span>
                                        )}
                                    </div>

                                    {/* Stats for numeric columns */}
                                    {column.stats && (
                                        <div className="mt-3 p-3 rounded-xl bg-[rgb(var(--text-primary))]/[0.02] border border-[rgb(var(--text-primary))]/5">
                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                                        <TrendingDown className="w-3.5 h-3.5 text-blue-500" />
                                                    </div>
                                                    <span className="text-[rgb(var(--text-secondary))]">Min:</span>
                                                    <span className="text-[rgb(var(--text-primary))] font-medium">{column.stats.min}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                                        <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                                                    </div>
                                                    <span className="text-[rgb(var(--text-secondary))]">Max:</span>
                                                    <span className="text-[rgb(var(--text-primary))] font-medium">{column.stats.max}</span>
                                                </div>
                                                <div className="text-[rgb(var(--text-secondary))]">
                                                    Mean: <span className="text-[rgb(var(--text-primary))] font-medium">{column.stats.mean}</span>
                                                </div>
                                                <div className="text-[rgb(var(--text-secondary))]">
                                                    σ: <span className="text-[rgb(var(--text-primary))] font-medium">{column.stats.stdDev}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
