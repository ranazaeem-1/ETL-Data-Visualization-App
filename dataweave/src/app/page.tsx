'use client';

import React, { useState, useCallback } from 'react';
import { FileUploader } from '@/components/FileUploader';
import { DataTable } from '@/components/DataTable';
import { ChartCard } from '@/components/ChartCard';
import { ColumnAnalysisPanel } from '@/components/ColumnAnalysisPanel';
import { AddChartPanel } from '@/components/AddChartPanel';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ColumnEditor } from '@/components/ColumnEditor';
import { MissingValuePanel } from '@/components/MissingValuePanel';
import { ChartEditPanel } from '@/components/ChartEditPanel';
import { CalculatedColumnPanel } from '@/components/CalculatedColumnPanel';
import { CorrelationHeatmap } from '@/components/CorrelationHeatmap';
import { TransformationPanel } from '@/components/TransformationPanel';
import { InsightsPanel } from '@/components/InsightsPanel';
import { DashboardManager } from '@/components/DashboardManager';
import { MultiFilePanel } from '@/components/MultiFilePanel';
import { DataCleaningPanel } from '@/components/DataCleaningPanel';
import { GeoMap } from '@/components/GeoMap';
import { PDFReportPanel } from '@/components/PDFReportPanel';
import { ColumnReorderPanel } from '@/components/ColumnReorderPanel';
import { NLQueryPanel } from '@/components/NLQueryPanel';
import { useDataStore, ChartConfig, FilterConfig, ColumnInfo } from '@/lib/store';
import {
  parseCSV,
  analyzeDataset,
  applySmartTransformations,
  downloadCSV,
  downloadExcel,
  fillMissingValues,
  dropRowsWithMissing,
  FillStrategy
} from '@/lib/data-engine';
import { suggestCharts } from '@/lib/vis-engine';
import {
  Database,
  Table2,
  BarChart3,
  Download,
  RefreshCw,
  Settings,
  Calculator,
  Grid3X3,
  Wand2,
  Lightbulb,
  FolderOpen,
  Files,
  Undo2,
  Redo2,
  AlertTriangle,
  Plus,
  X,
  Trash2,
  MapPin,
  FileText,
  GripVertical,
  MessageSquare
} from 'lucide-react';

type TabType = 'data' | 'dashboard';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('data');
  const [isLoading, setIsLoading] = useState(false);
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [showMissingValuePanel, setShowMissingValuePanel] = useState(false);
  const [editingChart, setEditingChart] = useState<ChartConfig | null>(null);
  const [showCalculatedColumn, setShowCalculatedColumn] = useState(false);
  const [showCorrelation, setShowCorrelation] = useState(false);
  const [showTransformations, setShowTransformations] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [showDashboardManager, setShowDashboardManager] = useState(false);
  const [showMultiFile, setShowMultiFile] = useState(false);
  const [showDataCleaning, setShowDataCleaning] = useState(false);
  const [showGeoMap, setShowGeoMap] = useState(false);
  const [showPDFReport, setShowPDFReport] = useState(false);
  const [showColumnReorder, setShowColumnReorder] = useState(false);
  const [showNLQuery, setShowNLQuery] = useState(false);

  const {
    rawData,
    fileName,
    columns,
    rowCount,
    transformedData,
    addedColumns,
    charts,
    filters,
    files,
    history,
    setRawData,
    setColumns,
    setTransformedData,
    addColumn,
    addChart,
    updateChart,
    removeChart,
    renameColumn,
    deleteColumn,
    setFilter,
    clearFilters,
    addFile,
    removeFile,
    mergeFiles,
    undo,
    redo,
    canUndo,
    canRedo,
    reset
  } = useDataStore();

  const handleFileSelect = useCallback(async (file: File) => {
    setIsLoading(true);
    try {
      const data = await parseCSV(file);
      setRawData(data, file.name);
      const columnInfo = analyzeDataset(data);
      setColumns(columnInfo);
      const transformed = applySmartTransformations(data, columnInfo);
      setTransformedData(transformed.data);
      columnInfo.forEach((col) => {
        if (!data[0] || !(col.name in data[0])) {
          addColumn(col.name);
        }
      });
      const suggestedCharts = suggestCharts(columnInfo);
      suggestedCharts.slice(0, 3).forEach((chart) => {
        addChart({ ...chart, id: `chart-${Date.now()}-${Math.random()}` });
      });
    } catch (error) {
      console.error('Error processing file:', error);
    } finally {
      setIsLoading(false);
    }
  }, [setRawData, setColumns, setTransformedData, addColumn, addChart]);

  const handleExportCSV = useCallback(() => {
    if (transformedData) {
      downloadCSV(transformedData, fileName?.replace('.csv', '_transformed.csv') || 'data.csv');
    }
  }, [transformedData, fileName]);

  const handleExportExcel = useCallback(() => {
    if (transformedData) {
      downloadExcel(transformedData, fileName?.replace('.csv', '_transformed.xlsx') || 'data.xlsx');
    }
  }, [transformedData, fileName]);

  const handleAddChart = useCallback((config: Omit<ChartConfig, 'id'>) => {
    addChart({ ...config, id: `chart-${Date.now()}` });
  }, [addChart]);

  const handleReset = useCallback(() => {
    reset();
  }, [reset]);

  const handleFilterChange = useCallback((column: string, filter: FilterConfig | null) => {
    setFilter(column, filter);
  }, [setFilter]);

  const handleFillMissing = useCallback((column: string, strategy: FillStrategy, customValue?: unknown) => {
    if (!transformedData) return;
    const newData = fillMissingValues(transformedData, column, strategy, customValue);
    setTransformedData(newData);
    const updatedColumns = analyzeDataset(newData);
    setColumns(updatedColumns);
  }, [transformedData, setTransformedData, setColumns]);

  const handleDropRows = useCallback((column?: string) => {
    if (!transformedData) return;
    const newData = column
      ? dropRowsWithMissing(transformedData, [column])
      : dropRowsWithMissing(transformedData);
    setTransformedData(newData);
    const updatedColumns = analyzeDataset(newData);
    setColumns(updatedColumns);
  }, [transformedData, setTransformedData, setColumns]);

  const handleUpdateChart = useCallback((updates: Partial<ChartConfig>) => {
    if (editingChart) {
      updateChart(editingChart.id, updates);
    }
  }, [editingChart, updateChart]);

  const handleAddCalculatedColumn = useCallback((name: string, formula: string, values: unknown[]) => {
    if (!transformedData) return;
    const newData = transformedData.map((row, i) => ({ ...row, [name]: values[i] }));
    setTransformedData(newData);
    addColumn(name);
    const updatedColumns = analyzeDataset(newData);
    setColumns(updatedColumns);
  }, [transformedData, setTransformedData, addColumn, setColumns]);

  const handleApplyTransformation = useCallback((newData: Record<string, unknown>[], newColumnNames: string[]) => {
    setTransformedData(newData);
    newColumnNames.forEach((col) => {
      if (!addedColumns.includes(col)) {
        addColumn(col);
      }
    });
    const updatedColumns = analyzeDataset(newData);
    setColumns(updatedColumns);
  }, [setTransformedData, addColumn, addedColumns, setColumns]);

  const hasMissingValues = columns.some((col) => col.missing > 0);
  const hasNumericColumns = columns.filter((col) => col.type === 'numeric').length >= 2;

  // No data uploaded yet
  if (!rawData) {
    return (
      <main className="min-h-screen bg-[rgb(var(--bg-secondary))]">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-[rgb(var(--accent))] text-white mb-4">
              <Database className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-[rgb(var(--text-primary))] mb-2">DataWeave</h1>
            <p className="text-[rgb(var(--text-secondary))]">Upload a CSV file to get started with data transformation and visualization</p>
          </div>

          <div className="card p-8">
            <FileUploader onFileSelect={handleFileSelect} isLoading={isLoading} />
          </div>

          <div className="flex justify-center mt-4">
            <ThemeToggle />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[rgb(var(--bg-secondary))]">
      {/* Header */}
      <header className="bg-[rgb(var(--bg-primary))] border-b border-[rgb(var(--border-color))] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo & File Info */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Database className="w-6 h-6 text-[rgb(var(--accent))]" />
                <span className="font-semibold text-[rgb(var(--text-primary))]">DataWeave</span>
              </div>
              <div className="h-6 w-px bg-[rgb(var(--border-color))]" />
              <div className="text-sm">
                <span className="text-[rgb(var(--text-secondary))]">{fileName}</span>
                <span className="text-[rgb(var(--text-secondary))] mx-2">•</span>
                <span className="text-[rgb(var(--text-secondary))]">{rowCount.toLocaleString()} rows</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {history.length > 0 && (
                <>
                  <button onClick={undo} disabled={!canUndo()} className="btn-icon" title="Undo">
                    <Undo2 className="w-4 h-4" />
                  </button>
                  <button onClick={redo} disabled={!canRedo()} className="btn-icon" title="Redo">
                    <Redo2 className="w-4 h-4" />
                  </button>
                  <div className="h-6 w-px bg-[rgb(var(--border-color))]" />
                </>
              )}
              <button onClick={handleExportCSV} className="btn-icon" title="Export CSV">
                <Download className="w-4 h-4" />
              </button>
              <button onClick={handleReset} className="btn-icon text-[rgb(var(--error))]" title="Reset">
                <RefreshCw className="w-4 h-4" />
              </button>
              <div className="h-6 w-px bg-[rgb(var(--border-color))]" />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-[rgb(var(--bg-primary))] border-b border-[rgb(var(--border-color))]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('data')}
              className={`tab ${activeTab === 'data' ? 'tab-active' : ''}`}
            >
              <Table2 className="w-4 h-4 inline mr-2" />
              Data
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`tab ${activeTab === 'dashboard' ? 'tab-active' : ''}`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Dashboard ({charts.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'data' && (
          <div className="grid grid-cols-12 gap-6">
            {/* Sidebar - Tools */}
            <div className="col-span-3">
              <div className="card p-4 sticky top-28">
                <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))] mb-4">Tools</h3>

                <div className="space-y-2">
                  {hasMissingValues && (
                    <button
                      onClick={() => setShowMissingValuePanel(true)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[rgb(var(--bg-secondary))] text-left"
                    >
                      <AlertTriangle className="w-4 h-4 text-[rgb(var(--warning))]" />
                      <span className="text-sm text-[rgb(var(--text-primary))]">Missing Values</span>
                      <span className="ml-auto badge badge-warning">{columns.filter(c => c.missing > 0).length}</span>
                    </button>
                  )}

                  <button
                    onClick={() => setShowDataCleaning(true)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[rgb(var(--bg-secondary))] text-left"
                  >
                    <Trash2 className="w-4 h-4 text-[rgb(var(--accent))]" />
                    <span className="text-sm text-[rgb(var(--text-primary))]">Data Cleaning</span>
                  </button>

                  <button
                    onClick={() => setShowCalculatedColumn(true)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[rgb(var(--bg-secondary))] text-left"
                  >
                    <Calculator className="w-4 h-4 text-[rgb(var(--accent))]" />
                    <span className="text-sm text-[rgb(var(--text-primary))]">Calculated Column</span>
                  </button>

                  <button
                    onClick={() => setShowTransformations(true)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[rgb(var(--bg-secondary))] text-left"
                  >
                    <Wand2 className="w-4 h-4 text-[rgb(var(--accent))]" />
                    <span className="text-sm text-[rgb(var(--text-primary))]">Transformations</span>
                  </button>

                  {hasNumericColumns && (
                    <button
                      onClick={() => setShowCorrelation(true)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[rgb(var(--bg-secondary))] text-left"
                    >
                      <Grid3X3 className="w-4 h-4 text-[rgb(var(--accent))]" />
                      <span className="text-sm text-[rgb(var(--text-primary))]">Correlation</span>
                    </button>
                  )}

                  <button
                    onClick={() => setShowInsights(true)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[rgb(var(--bg-secondary))] text-left"
                  >
                    <Lightbulb className="w-4 h-4 text-[rgb(var(--accent))]" />
                    <span className="text-sm text-[rgb(var(--text-primary))]">Auto Insights</span>
                  </button>

                  <button
                    onClick={() => setShowNLQuery(true)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[rgb(var(--bg-secondary))] text-left"
                  >
                    <MessageSquare className="w-4 h-4 text-[rgb(var(--accent))]" />
                    <span className="text-sm text-[rgb(var(--text-primary))]">Natural Language</span>
                  </button>

                  <button
                    onClick={() => setShowGeoMap(true)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[rgb(var(--bg-secondary))] text-left"
                  >
                    <MapPin className="w-4 h-4 text-[rgb(var(--accent))]" />
                    <span className="text-sm text-[rgb(var(--text-primary))]">Geographic Map</span>
                  </button>

                  <button
                    onClick={() => setShowMultiFile(true)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[rgb(var(--bg-secondary))] text-left"
                  >
                    <Files className="w-4 h-4 text-[rgb(var(--accent))]" />
                    <span className="text-sm text-[rgb(var(--text-primary))]">Multi-File Merge</span>
                  </button>

                  <button
                    onClick={() => setShowPDFReport(true)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[rgb(var(--bg-secondary))] text-left"
                  >
                    <FileText className="w-4 h-4 text-[rgb(var(--accent))]" />
                    <span className="text-sm text-[rgb(var(--text-primary))]">PDF Report</span>
                  </button>

                  <button
                    onClick={() => setShowColumnReorder(true)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[rgb(var(--bg-secondary))] text-left"
                  >
                    <GripVertical className="w-4 h-4 text-[rgb(var(--text-secondary))]" />
                    <span className="text-sm text-[rgb(var(--text-primary))]">Reorder Columns</span>
                  </button>

                  <button
                    onClick={() => setShowColumnManager(true)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[rgb(var(--bg-secondary))] text-left"
                  >
                    <Settings className="w-4 h-4 text-[rgb(var(--text-secondary))]" />
                    <span className="text-sm text-[rgb(var(--text-primary))]">Manage Columns</span>
                  </button>
                </div>

                {/* Column Summary */}
                <div className="mt-6 pt-4 border-t border-[rgb(var(--border-color))]">
                  <h4 className="text-xs font-semibold text-[rgb(var(--text-secondary))] uppercase mb-3">Columns</h4>
                  <div className="space-y-1 max-h-64 overflow-auto">
                    {columns.map((col) => (
                      <div key={col.name} className="flex items-center justify-between text-sm py-1">
                        <span className="text-[rgb(var(--text-primary))] truncate">{col.name}</span>
                        <span className={`badge ${col.type === 'numeric' ? 'badge-primary' : 'badge-success'}`}>
                          {col.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Main - Data Table */}
            <div className="col-span-9">
              <div className="card">
                {transformedData && (
                  <DataTable
                    data={transformedData}
                    columns={columns.map(c => c.name)}
                    addedColumns={addedColumns}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div>
            {/* Dashboard Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">Charts</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowDashboardManager(true)}
                  className="btn btn-secondary"
                >
                  <FolderOpen className="w-4 h-4" />
                  Save/Load
                </button>
                <AddChartPanel columns={columns} onAddChart={handleAddChart} />
              </div>
            </div>

            {charts.length === 0 ? (
              <div className="card p-12 text-center">
                <BarChart3 className="w-12 h-12 mx-auto text-[rgb(var(--text-secondary))] mb-4" />
                <p className="text-[rgb(var(--text-secondary))]">No charts yet. Add a chart to visualize your data.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-6">
                {charts.map((chart) => (
                  <div key={chart.id} className="card">
                    {transformedData && (
                      <ChartCard
                        config={chart}
                        data={transformedData}
                        onRemove={() => removeChart(chart.id)}
                        onEdit={() => setEditingChart(chart)}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showColumnManager && (
        <div className="modal-overlay animate-fade-in" onClick={() => setShowColumnManager(false)}>
          <div className="modal-content w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-[rgb(var(--border-color))]">
              <h3 className="font-semibold text-[rgb(var(--text-primary))]">Manage Columns</h3>
              <button onClick={() => setShowColumnManager(false)} className="btn-icon">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 max-h-96 overflow-auto">
              {columns.map((column) => (
                <ColumnEditor
                  key={column.name}
                  column={column}
                  onRename={renameColumn}
                  onDelete={deleteColumn}
                  isGenerated={addedColumns.includes(column.name)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {showMissingValuePanel && transformedData && (
        <MissingValuePanel
          data={transformedData}
          columns={columns}
          onFillMissing={handleFillMissing}
          onDropRows={handleDropRows}
          onClose={() => setShowMissingValuePanel(false)}
        />
      )}

      {editingChart && (
        <ChartEditPanel
          config={editingChart}
          onUpdate={handleUpdateChart}
          onClose={() => setEditingChart(null)}
        />
      )}

      {showCalculatedColumn && transformedData && (
        <CalculatedColumnPanel
          columns={columns}
          data={transformedData}
          onAddColumn={handleAddCalculatedColumn}
          onClose={() => setShowCalculatedColumn(false)}
        />
      )}

      {showCorrelation && transformedData && (
        <CorrelationHeatmap
          data={transformedData}
          columns={columns}
          onClose={() => setShowCorrelation(false)}
        />
      )}

      {showTransformations && transformedData && (
        <TransformationPanel
          columns={columns}
          data={transformedData}
          onApplyTransformation={handleApplyTransformation}
          onClose={() => setShowTransformations(false)}
        />
      )}

      {showInsights && transformedData && (
        <InsightsPanel
          data={transformedData}
          columns={columns}
          onClose={() => setShowInsights(false)}
        />
      )}

      {showDashboardManager && (
        <DashboardManager
          currentCharts={charts}
          onLoadCharts={(loadedCharts) => {
            loadedCharts.forEach((chart) => addChart({ ...chart, id: `chart-${Date.now()}-${Math.random()}` }));
          }}
          onClose={() => setShowDashboardManager(false)}
        />
      )}

      {showMultiFile && (
        <MultiFilePanel
          files={files}
          onAddFile={addFile}
          onRemoveFile={removeFile}
          onMergeFiles={mergeFiles}
          onClose={() => setShowMultiFile(false)}
        />
      )}

      {showDataCleaning && transformedData && (
        <DataCleaningPanel
          data={transformedData}
          columns={columns}
          onApply={(newData) => {
            setTransformedData(newData);
            const updatedColumns = analyzeDataset(newData);
            setColumns(updatedColumns);
          }}
          onClose={() => setShowDataCleaning(false)}
        />
      )}

      {showGeoMap && transformedData && (
        <GeoMap
          data={transformedData}
          columns={columns}
          onClose={() => setShowGeoMap(false)}
        />
      )}

      {showPDFReport && transformedData && fileName && (
        <PDFReportPanel
          data={transformedData}
          columns={columns}
          fileName={fileName}
          onClose={() => setShowPDFReport(false)}
        />
      )}

      {showColumnReorder && (
        <ColumnReorderPanel
          columns={columns}
          onReorder={(newOrder) => {
            // Reorder columns and data
            const reorderedColumns = newOrder.map((name) => columns.find((c) => c.name === name)!).filter(Boolean);
            setColumns(reorderedColumns);
            if (transformedData) {
              const reorderedData = transformedData.map((row) => {
                const newRow: Record<string, unknown> = {};
                newOrder.forEach((name) => {
                  newRow[name] = row[name];
                });
                return newRow;
              });
              setTransformedData(reorderedData);
            }
          }}
          onClose={() => setShowColumnReorder(false)}
        />
      )}

      {showNLQuery && transformedData && (
        <NLQueryPanel
          data={transformedData}
          columns={columns}
          onApplyFilter={(filteredData) => {
            setTransformedData(filteredData);
            const updatedColumns = analyzeDataset(filteredData);
            setColumns(updatedColumns);
          }}
          onClose={() => setShowNLQuery(false)}
        />
      )}
    </main>
  );
}
