'use client';

import React, { useState } from 'react';
import { X, Save, FolderOpen, Trash2, Clock, BarChart3 } from 'lucide-react';
import { ChartConfig, useDashboardStore } from '@/lib/store';

interface DashboardManagerProps {
    currentCharts: ChartConfig[];
    onLoadCharts: (charts: ChartConfig[]) => void;
    onClose: () => void;
}

export function DashboardManager({ currentCharts, onLoadCharts, onClose }: DashboardManagerProps) {
    const [activeTab, setActiveTab] = useState<'save' | 'load'>('load');
    const [newName, setNewName] = useState('');
    const [error, setError] = useState<string | null>(null);

    const { savedDashboards, saveDashboard, loadDashboard, deleteDashboard } = useDashboardStore();

    const handleSave = () => {
        if (!newName.trim()) {
            setError('Please enter a dashboard name');
            return;
        }
        if (currentCharts.length === 0) {
            setError('No charts to save');
            return;
        }

        saveDashboard(newName.trim(), currentCharts);
        setNewName('');
        setError(null);
        setActiveTab('load');
    };

    const handleLoad = (id: string) => {
        const charts = loadDashboard(id);
        if (charts) {
            onLoadCharts(charts);
            onClose();
        }
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this dashboard?')) {
            deleteDashboard(id);
        }
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-lg glass-strong rounded-2xl shadow-2xl animate-fade-in-up max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-[rgb(var(--text-primary))]/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                            <FolderOpen className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">Dashboard Manager</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-[rgb(var(--text-primary))]/5 transition-colors"
                    >
                        <X className="w-5 h-5 text-[rgb(var(--text-secondary))]" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-[rgb(var(--text-primary))]/5">
                    <button
                        onClick={() => setActiveTab('load')}
                        className={`flex-1 py-3 text-sm font-medium transition-all ${activeTab === 'load'
                                ? 'text-indigo-500 border-b-2 border-indigo-500'
                                : 'text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]'
                            }`}
                    >
                        <FolderOpen className="w-4 h-4 inline mr-2" />
                        Load Dashboard
                    </button>
                    <button
                        onClick={() => setActiveTab('save')}
                        className={`flex-1 py-3 text-sm font-medium transition-all ${activeTab === 'save'
                                ? 'text-indigo-500 border-b-2 border-indigo-500'
                                : 'text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]'
                            }`}
                    >
                        <Save className="w-4 h-4 inline mr-2" />
                        Save Current
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-5">
                    {activeTab === 'save' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
                                    Dashboard Name
                                </label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => {
                                        setNewName(e.target.value);
                                        setError(null);
                                    }}
                                    placeholder="My Dashboard"
                                    className="w-full px-4 py-2.5 bg-[rgb(var(--text-primary))]/[0.03] border border-[rgb(var(--text-primary))]/10 rounded-xl text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-secondary))]/50 focus:outline-none focus:border-indigo-500/50 transition-all"
                                />
                            </div>

                            <div className="p-3 rounded-xl bg-[rgb(var(--text-primary))]/[0.02] border border-[rgb(var(--text-primary))]/5">
                                <div className="flex items-center gap-2 text-sm text-[rgb(var(--text-secondary))]">
                                    <BarChart3 className="w-4 h-4" />
                                    <span>{currentCharts.length} chart{currentCharts.length !== 1 ? 's' : ''} will be saved</span>
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleSave}
                                className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                Save Dashboard
                            </button>
                        </div>
                    )}

                    {activeTab === 'load' && (
                        <div className="space-y-3">
                            {savedDashboards.length === 0 ? (
                                <div className="text-center py-12">
                                    <FolderOpen className="w-12 h-12 mx-auto mb-4 text-[rgb(var(--text-secondary))]/30" />
                                    <p className="text-[rgb(var(--text-secondary))]">No saved dashboards yet</p>
                                    <p className="text-sm text-[rgb(var(--text-secondary))]/50 mt-1">
                                        Create charts and save them for later use
                                    </p>
                                </div>
                            ) : (
                                savedDashboards.map((dashboard) => (
                                    <button
                                        key={dashboard.id}
                                        onClick={() => handleLoad(dashboard.id)}
                                        className="w-full p-4 rounded-xl bg-[rgb(var(--text-primary))]/[0.02] border border-[rgb(var(--text-primary))]/5 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all text-left group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="font-medium text-[rgb(var(--text-primary))]">{dashboard.name}</h4>
                                                <div className="flex items-center gap-3 mt-1 text-sm text-[rgb(var(--text-secondary))]">
                                                    <span className="flex items-center gap-1">
                                                        <BarChart3 className="w-3.5 h-3.5" />
                                                        {dashboard.charts.length} chart{dashboard.charts.length !== 1 ? 's' : ''}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {formatDate(dashboard.createdAt)}
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => handleDelete(dashboard.id, e)}
                                                className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all"
                                            >
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </button>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
