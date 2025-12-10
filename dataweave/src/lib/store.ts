import { create } from 'zustand';

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
    type: 'bar' | 'line' | 'pie' | 'scatter' | 'histogram' | 'area';
    title: string;
    xAxis?: string;
    yAxis?: string;
    aggregation?: 'sum' | 'mean' | 'count' | 'min' | 'max';
    colorScheme?: string[];
}

export interface DataState {
    // Raw data
    rawData: Record<string, unknown>[] | null;
    fileName: string | null;

    // Analysis
    columns: ColumnInfo[];
    rowCount: number;

    // Transformed data
    transformedData: Record<string, unknown>[] | null;
    addedColumns: string[];

    // Dashboard
    charts: ChartConfig[];

    // Actions
    setRawData: (data: Record<string, unknown>[], fileName: string) => void;
    setColumns: (columns: ColumnInfo[]) => void;
    setTransformedData: (data: Record<string, unknown>[]) => void;
    addColumn: (name: string) => void;
    addChart: (chart: ChartConfig) => void;
    updateChart: (id: string, updates: Partial<ChartConfig>) => void;
    removeChart: (id: string) => void;
    reset: () => void;
}

const initialState = {
    rawData: null,
    fileName: null,
    columns: [],
    rowCount: 0,
    transformedData: null,
    addedColumns: [],
    charts: [],
};

export const useDataStore = create<DataState>((set) => ({
    ...initialState,

    setRawData: (data, fileName) => set({
        rawData: data,
        fileName,
        rowCount: data.length,
        transformedData: data,
    }),

    setColumns: (columns) => set({ columns }),

    setTransformedData: (data) => set({ transformedData: data }),

    addColumn: (name) => set((state) => ({
        addedColumns: [...state.addedColumns, name],
    })),

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

    reset: () => set(initialState),
}));
