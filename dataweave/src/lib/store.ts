import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ColumnInfo {
    name: string;
    type: 'numeric' | 'categorical' | 'date' | 'text';
    missing: number;
    unique: number;
    stats?: {
        min?: number;
        max?: number;
        mean?: number;
        median?: number;
        stdDev?: number;
    };
}

export interface ChartConfig {
    id: string;
    type: 'bar' | 'line' | 'pie' | 'scatter' | 'histogram' | 'area' | 'treemap' | 'dualAxis';
    title: string;
    xAxis?: string;
    yAxis?: string;
    yAxis2?: string; // For dual-axis charts
    aggregation?: 'sum' | 'mean' | 'count' | 'min' | 'max';
    colorScheme?: string[];
}

export interface FilterConfig {
    type: 'categorical' | 'numeric' | 'text';
    values?: string[]; // For categorical: selected values
    min?: number;      // For numeric: min value
    max?: number;      // For numeric: max value
    search?: string;   // For text: search term
}

// History entry for undo/redo
export interface HistoryEntry {
    data: Record<string, unknown>[];
    columns: ColumnInfo[];
    addedColumns: string[];
    description: string;
    timestamp: number;
}

// Saved dashboard configuration
export interface SavedDashboard {
    id: string;
    name: string;
    charts: ChartConfig[];
    createdAt: number;
}

// File info for multi-file support
export interface FileInfo {
    name: string;
    data: Record<string, unknown>[];
    columns: ColumnInfo[];
    rowCount: number;
}

export interface DataState {
    // Raw data
    rawData: Record<string, unknown>[] | null;
    fileName: string | null;

    // Multi-file support
    files: FileInfo[];
    activeFileIndex: number;

    // Analysis
    columns: ColumnInfo[];
    rowCount: number;

    // Transformed data
    transformedData: Record<string, unknown>[] | null;
    addedColumns: string[];

    // Filters
    filters: Record<string, FilterConfig>;

    // Dashboard
    charts: ChartConfig[];

    // History for undo/redo
    history: HistoryEntry[];
    historyIndex: number;

    // Actions - Data
    setRawData: (data: Record<string, unknown>[], fileName: string) => void;
    setColumns: (columns: ColumnInfo[]) => void;
    setTransformedData: (data: Record<string, unknown>[], description?: string) => void;
    addColumn: (name: string) => void;

    // Actions - Multi-file
    addFile: (file: FileInfo) => void;
    setActiveFile: (index: number) => void;
    removeFile: (index: number) => void;
    mergeFiles: (file1Index: number, file2Index: number, joinColumn: string, joinType: 'inner' | 'left' | 'outer') => void;

    // Actions - Column Operations
    renameColumn: (oldName: string, newName: string) => void;
    deleteColumn: (columnName: string) => void;

    // Actions - Filters
    setFilter: (column: string, filter: FilterConfig | null) => void;
    clearFilters: () => void;

    // Actions - Charts
    addChart: (chart: ChartConfig) => void;
    updateChart: (id: string, updates: Partial<ChartConfig>) => void;
    removeChart: (id: string) => void;

    // Actions - History
    undo: () => void;
    redo: () => void;
    canUndo: () => boolean;
    canRedo: () => boolean;

    // Actions - Reset
    reset: () => void;
}

// Theme store (persisted separately)
export interface ThemeState {
    theme: 'dark' | 'light' | 'system';
    setTheme: (theme: 'dark' | 'light' | 'system') => void;
}

// Dashboard persistence store
export interface DashboardPersistState {
    savedDashboards: SavedDashboard[];
    saveDashboard: (name: string, charts: ChartConfig[]) => void;
    loadDashboard: (id: string) => ChartConfig[] | null;
    deleteDashboard: (id: string) => void;
}

const initialDataState = {
    rawData: null,
    fileName: null,
    files: [],
    activeFileIndex: 0,
    columns: [],
    rowCount: 0,
    transformedData: null,
    addedColumns: [],
    filters: {},
    charts: [],
    history: [],
    historyIndex: -1,
};

const MAX_HISTORY_SIZE = 20;

export const useDataStore = create<DataState>((set, get) => ({
    ...initialDataState,

    setRawData: (data, fileName) => set({
        rawData: data,
        fileName,
        rowCount: data.length,
        transformedData: data,
        filters: {},
        history: [],
        historyIndex: -1,
    }),

    setColumns: (columns) => set({ columns }),

    setTransformedData: (data, description = 'Data transformation') => set((state) => {
        // Add to history
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push({
            data: state.transformedData || [],
            columns: state.columns,
            addedColumns: state.addedColumns,
            description,
            timestamp: Date.now(),
        });

        // Limit history size
        if (newHistory.length > MAX_HISTORY_SIZE) {
            newHistory.shift();
        }

        return {
            transformedData: data,
            history: newHistory,
            historyIndex: newHistory.length - 1,
        };
    }),

    addColumn: (name) => set((state) => ({
        addedColumns: [...state.addedColumns, name],
    })),

    // Multi-file support
    addFile: (file) => set((state) => ({
        files: [...state.files, file],
    })),

    setActiveFile: (index) => set((state) => {
        const file = state.files[index];
        if (!file) return state;
        return {
            activeFileIndex: index,
            rawData: file.data,
            fileName: file.name,
            columns: file.columns,
            rowCount: file.rowCount,
            transformedData: file.data,
            addedColumns: [],
            filters: {},
            charts: [],
            history: [],
            historyIndex: -1,
        };
    }),

    removeFile: (index) => set((state) => ({
        files: state.files.filter((_, i) => i !== index),
        activeFileIndex: state.activeFileIndex >= index ? Math.max(0, state.activeFileIndex - 1) : state.activeFileIndex,
    })),

    mergeFiles: (file1Index, file2Index, joinColumn, joinType) => set((state) => {
        const file1 = state.files[file1Index];
        const file2 = state.files[file2Index];
        if (!file1 || !file2) return state;

        const mergedData: Record<string, unknown>[] = [];
        const file2Map = new Map<unknown, Record<string, unknown>[]>();

        // Build lookup map from file2
        file2.data.forEach((row) => {
            const key = row[joinColumn];
            if (!file2Map.has(key)) {
                file2Map.set(key, []);
            }
            file2Map.get(key)!.push(row);
        });

        // Perform join
        if (joinType === 'inner') {
            file1.data.forEach((row1) => {
                const key = row1[joinColumn];
                const matches = file2Map.get(key) || [];
                matches.forEach((row2) => {
                    mergedData.push({ ...row1, ...row2 });
                });
            });
        } else if (joinType === 'left') {
            file1.data.forEach((row1) => {
                const key = row1[joinColumn];
                const matches = file2Map.get(key) || [];
                if (matches.length === 0) {
                    mergedData.push({ ...row1 });
                } else {
                    matches.forEach((row2) => {
                        mergedData.push({ ...row1, ...row2 });
                    });
                }
            });
        } else {
            // Outer join
            const usedFile2Keys = new Set<unknown>();
            file1.data.forEach((row1) => {
                const key = row1[joinColumn];
                const matches = file2Map.get(key) || [];
                if (matches.length === 0) {
                    mergedData.push({ ...row1 });
                } else {
                    matches.forEach((row2) => {
                        mergedData.push({ ...row1, ...row2 });
                        usedFile2Keys.add(key);
                    });
                }
            });
            // Add unmatched file2 rows
            file2.data.forEach((row2) => {
                const key = row2[joinColumn];
                if (!usedFile2Keys.has(key)) {
                    mergedData.push({ ...row2 });
                }
            });
        }

        return {
            rawData: mergedData,
            fileName: `${file1.name}_merged_${file2.name}`,
            rowCount: mergedData.length,
            transformedData: mergedData,
            addedColumns: [],
            filters: {},
            history: [],
            historyIndex: -1,
        };
    }),

    renameColumn: (oldName, newName) => set((state) => {
        if (!state.transformedData) return state;

        // Rename in data
        const newData = state.transformedData.map((row) => {
            const newRow: Record<string, unknown> = {};
            for (const [key, value] of Object.entries(row)) {
                newRow[key === oldName ? newName : key] = value;
            }
            return newRow;
        });

        // Rename in columns
        const newColumns = state.columns.map((col) =>
            col.name === oldName ? { ...col, name: newName } : col
        );

        // Rename in addedColumns
        const newAddedColumns = state.addedColumns.map((col) =>
            col === oldName ? newName : col
        );

        // Update charts that reference this column
        const newCharts = state.charts.map((chart) => ({
            ...chart,
            xAxis: chart.xAxis === oldName ? newName : chart.xAxis,
            yAxis: chart.yAxis === oldName ? newName : chart.yAxis,
        }));

        // Update filters
        const newFilters: Record<string, FilterConfig> = {};
        for (const [key, filter] of Object.entries(state.filters)) {
            newFilters[key === oldName ? newName : key] = filter;
        }

        return {
            transformedData: newData,
            columns: newColumns,
            addedColumns: newAddedColumns,
            charts: newCharts,
            filters: newFilters,
        };
    }),

    deleteColumn: (columnName) => set((state) => {
        if (!state.transformedData) return state;

        // Remove from data
        const newData = state.transformedData.map((row) => {
            const newRow: Record<string, unknown> = {};
            for (const [key, value] of Object.entries(row)) {
                if (key !== columnName) {
                    newRow[key] = value;
                }
            }
            return newRow;
        });

        // Remove from columns
        const newColumns = state.columns.filter((col) => col.name !== columnName);

        // Remove from addedColumns
        const newAddedColumns = state.addedColumns.filter((col) => col !== columnName);

        // Remove charts that depend on this column
        const newCharts = state.charts.filter(
            (chart) => chart.xAxis !== columnName && chart.yAxis !== columnName
        );

        // Remove filter
        const newFilters = { ...state.filters };
        delete newFilters[columnName];

        return {
            transformedData: newData,
            columns: newColumns,
            addedColumns: newAddedColumns,
            charts: newCharts,
            filters: newFilters,
        };
    }),

    setFilter: (column, filter) => set((state) => {
        const newFilters = { ...state.filters };
        if (filter === null) {
            delete newFilters[column];
        } else {
            newFilters[column] = filter;
        }
        return { filters: newFilters };
    }),

    clearFilters: () => set({ filters: {} }),

    addChart: (chart) => set((state) => ({
        charts: [...state.charts, chart],
    })),

    updateChart: (id, updates) => set((state) => ({
        charts: state.charts.map((c) =>
            c.id === id ? { ...c, ...updates } : c
        ),
    })),

    removeChart: (id) => set((state) => ({
        charts: state.charts.filter((c) => c.id !== id),
    })),

    // History actions
    undo: () => set((state) => {
        if (state.historyIndex < 0) return state;

        const entry = state.history[state.historyIndex];
        return {
            transformedData: entry.data,
            columns: entry.columns,
            addedColumns: entry.addedColumns,
            historyIndex: state.historyIndex - 1,
        };
    }),

    redo: () => set((state) => {
        if (state.historyIndex >= state.history.length - 1) return state;

        const nextIndex = state.historyIndex + 1;
        const entry = state.history[nextIndex];

        // Get the data from after this entry was created
        if (nextIndex + 1 < state.history.length) {
            const nextEntry = state.history[nextIndex + 1];
            return {
                transformedData: nextEntry.data,
                columns: nextEntry.columns,
                addedColumns: nextEntry.addedColumns,
                historyIndex: nextIndex,
            };
        }

        return { historyIndex: nextIndex };
    }),

    canUndo: () => {
        const state = get();
        return state.historyIndex >= 0;
    },

    canRedo: () => {
        const state = get();
        return state.historyIndex < state.history.length - 1;
    },

    reset: () => set(initialDataState),
}));

// Theme store with persistence
export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            theme: 'dark',
            setTheme: (theme) => set({ theme }),
        }),
        {
            name: 'dataweave-theme',
        }
    )
);

// Dashboard persistence store
export const useDashboardStore = create<DashboardPersistState>()(
    persist(
        (set, get) => ({
            savedDashboards: [],

            saveDashboard: (name, charts) => set((state) => ({
                savedDashboards: [
                    ...state.savedDashboards,
                    {
                        id: `dashboard-${Date.now()}`,
                        name,
                        charts,
                        createdAt: Date.now(),
                    },
                ],
            })),

            loadDashboard: (id) => {
                const state = get();
                const dashboard = state.savedDashboards.find((d) => d.id === id);
                return dashboard ? dashboard.charts : null;
            },

            deleteDashboard: (id) => set((state) => ({
                savedDashboards: state.savedDashboards.filter((d) => d.id !== id),
            })),
        }),
        {
            name: 'dataweave-dashboards',
        }
    )
);
