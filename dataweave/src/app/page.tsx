'use client';

import React, { useState, useCallback } from 'react';
import { FileUploader } from '@/components/FileUploader';
import { DataTable } from '@/components/DataTable';
import { ChartCard } from '@/components/ChartCard';
import { ColumnAnalysisPanel } from '@/components/ColumnAnalysisPanel';
import { AddChartPanel } from '@/components/AddChartPanel';
import { useDataStore, ChartConfig } from '@/lib/store';
import { parseCSV, analyzeDataset, applySmartTransformations, downloadCSV } from '@/lib/data-engine';
import { suggestCharts } from '@/lib/vis-engine';
import {
  Database,
  BarChart3,
  Table2,
  Download,
  RefreshCw,
  Sparkles,
  FileSpreadsheet,
  Zap,
  Camera,
  Layers
} from 'lucide-react';
import html2canvas from 'html2canvas';

type TabType = 'upload' | 'data' | 'dashboard';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const [isLoading, setIsLoading] = useState(false);

  const {
    rawData,
    fileName,
    columns,
    rowCount,
    transformedData,
    addedColumns,
    charts,
    setRawData,
    setColumns,
    setTransformedData,
    addColumn,
    addChart,
    removeChart,
    reset
  } = useDataStore();

  const handleFileSelect = useCallback(async (file: File) => {
    setIsLoading(true);
    try {
      const data = await parseCSV(file);
      setRawData(data, file.name);

      const columnInfo = analyzeDataset(data);
      setColumns(columnInfo);

      const { data: transformed, newColumns } = applySmartTransformations(data, columnInfo);
      setTransformedData(transformed);
      newColumns.forEach((col) => addColumn(col));

      const updatedColumnInfo = analyzeDataset(transformed);
      setColumns(updatedColumnInfo);

      const suggestedCharts = suggestCharts(updatedColumnInfo);
      suggestedCharts.forEach((chart) => addChart(chart));

      setActiveTab('data');
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error processing file. Please ensure it is a valid CSV.');
    } finally {
      setIsLoading(false);
    }
  }, [setRawData, setColumns, setTransformedData, addColumn, addChart]);

  const handleExportCSV = useCallback(() => {
    if (transformedData && fileName) {
      const baseName = fileName.replace('.csv', '');
      downloadCSV(transformedData, `${baseName}_transformed.csv`);
    }
  }, [transformedData, fileName]);

  const handleExportDashboard = useCallback(async () => {
    const dashboard = document.getElementById('dashboard-grid');
    if (dashboard) {
      try {
        const canvas = await html2canvas(dashboard, {
          backgroundColor: '#050510',
          scale: 2,
          useCORS: true,
          logging: false,
          // Ignore elements that might have unsupported color functions
          ignoreElements: (element) => {
            return element.classList?.contains('noise') ?? false;
          },
        });
        const link = document.createElement('a');
        link.download = 'dashboard.png';
        link.href = canvas.toDataURL();
        link.click();
      } catch (error) {
        console.error('Screenshot failed:', error);
        alert('Screenshot export failed. Try using your browser\'s built-in screenshot feature instead (e.g., right-click > Take Screenshot).');
      }
    }
  }, []);

  const handleAddChart = useCallback((config: Omit<ChartConfig, 'id'>) => {
    addChart({
      ...config,
      id: `chart-${Date.now()}`,
    });
  }, [addChart]);

  const handleReset = useCallback(() => {
    reset();
    setActiveTab('upload');
  }, [reset]);

  const allColumns = transformedData && transformedData.length > 0
    ? Object.keys(transformedData[0])
    : [];

  return (
    <main className="min-h-screen noise">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#050510]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl blur-lg opacity-50 group-hover:opacity-100 transition-opacity" />
                <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl">
                  <Database className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">DataWeave</h1>
                <p className="text-[11px] text-white/40 tracking-wide">NO-CODE DATA VISUALIZATION</p>
              </div>
            </div>

            {rawData && (
              <div className="flex items-center gap-6">
                {/* Tabs */}
                <nav className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/5">
                  {[
                    { id: 'data', icon: Table2, label: 'Data' },
                    { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
                  ].map(({ id, icon: Icon, label }) => (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id as TabType)}
                      className={`
                        flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300
                        ${activeTab === id
                          ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-white border border-white/10'
                          : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03]'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="font-medium text-sm">{label}</span>
                    </button>
                  ))}
                </nav>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-white/60 hover:text-white hover:bg-white/[0.06] hover:border-white/10 transition-all group"
                  >
                    <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium hidden sm:inline">Export</span>
                  </button>
                  {activeTab === 'dashboard' && (
                    <button
                      onClick={handleExportDashboard}
                      className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-white/60 hover:text-white hover:bg-white/[0.06] transition-all"
                      title="Screenshot Dashboard"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={handleReset}
                    className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"
                    title="Start Over"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pb-16 px-6 pt-8">
        <div className="max-w-7xl mx-auto">
          {/* Upload State */}
          {(!rawData || activeTab === 'upload') && !rawData && (
            <div className="max-w-2xl mx-auto pt-8 animate-fade-in-up">
              {/* Hero Section */}
              <div className="text-center mb-14">
                <div className="inline-flex items-center gap-2 px-5 py-2.5 mb-8 rounded-full bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-white/10">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-medium text-white/70">AI-Powered Data Transformation</span>
                </div>

                <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
                  Transform Your Data
                  <br />
                  Into <span className="gradient-text">Visual Insights</span>
                </h2>

                <p className="text-xl text-white/50 max-w-lg mx-auto leading-relaxed">
                  Upload your CSV and watch as we automatically analyze,
                  transform, and visualize your data in seconds.
                </p>
              </div>

              <FileUploader onFileSelect={handleFileSelect} isLoading={isLoading} />

              {/* Feature Cards */}
              <div className="mt-12 grid grid-cols-3 gap-4 stagger-children">
                {[
                  { icon: FileSpreadsheet, title: 'Smart Detection', desc: 'Auto-detect column types', gradient: 'from-blue-500 to-cyan-500' },
                  { icon: Zap, title: 'Auto Transform', desc: 'Extract dates & create bins', gradient: 'from-purple-500 to-pink-500' },
                  { icon: Layers, title: 'Instant Charts', desc: 'Beautiful visualizations', gradient: 'from-amber-500 to-orange-500' },
                ].map(({ icon: Icon, title, desc, gradient }) => (
                  <div key={title} className="group p-5 glass rounded-2xl text-center card-hover shine">
                    <div className={`w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <p className="font-semibold text-white mb-1">{title}</p>
                    <p className="text-sm text-white/40">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data Tab */}
          {rawData && activeTab === 'data' && (
            <div className="animate-fade-in-up">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">Data Explorer</h2>
                  <div className="flex items-center gap-3 text-white/50">
                    <span className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      {fileName}
                    </span>
                    <span>·</span>
                    <span>{rowCount.toLocaleString()} rows</span>
                    <span>·</span>
                    <span>{columns.length} columns</span>
                    {addedColumns.length > 0 && (
                      <>
                        <span>·</span>
                        <span className="text-emerald-400 font-medium">+{addedColumns.length} generated</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3">
                  <DataTable
                    data={transformedData || []}
                    columns={allColumns}
                    addedColumns={addedColumns}
                  />
                </div>
                <div className="lg:col-span-1">
                  <ColumnAnalysisPanel columns={columns} rowCount={rowCount} />
                </div>
              </div>
            </div>
          )}

          {/* Dashboard Tab */}
          {rawData && activeTab === 'dashboard' && (
            <div className="animate-fade-in-up">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">Dashboard</h2>
                  <p className="text-white/50">
                    {charts.length} visualization{charts.length !== 1 ? 's' : ''} · Click and drag to reorder
                  </p>
                </div>
                <AddChartPanel
                  columns={columns.map((c) => ({ name: c.name, type: c.type }))}
                  onAddChart={handleAddChart}
                />
              </div>

              <div id="dashboard-grid" className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger-children">
                {charts.map((chart) => (
                  <ChartCard
                    key={chart.id}
                    config={chart}
                    data={transformedData || []}
                    onRemove={() => removeChart(chart.id)}
                  />
                ))}
              </div>

              {charts.length === 0 && (
                <div className="text-center py-24 glass rounded-3xl">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                    <BarChart3 className="w-10 h-10 text-white/20" />
                  </div>
                  <p className="text-xl text-white/40 mb-2">No charts yet</p>
                  <p className="text-white/25">Click &quot;Add Chart&quot; to create your first visualization</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
