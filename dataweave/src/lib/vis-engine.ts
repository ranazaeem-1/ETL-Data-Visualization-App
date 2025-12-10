import { ColumnInfo, ChartConfig } from './store';

/**
 * Generate suggested charts based on column types
 */
export function suggestCharts(columns: ColumnInfo[]): ChartConfig[] {
    const charts: ChartConfig[] = [];

    const numericCols = columns.filter((c) => c.type === 'numeric');
    const categoricalCols = columns.filter((c) => c.type === 'categorical');
    const dateCols = columns.filter((c) => c.type === 'date');

    // Time series: Date + Numeric
    dateCols.forEach((dateCol) => {
        numericCols.slice(0, 2).forEach((numCol) => {
            charts.push({
                id: `line-${dateCol.name}-${numCol.name}`,
                type: 'line',
                title: `${numCol.name} over Time`,
                xAxis: dateCol.name,
                yAxis: numCol.name,
                aggregation: 'sum',
            });
        });
    });

    // Category breakdown: Categorical + Numeric
    categoricalCols.slice(0, 2).forEach((catCol) => {
        numericCols.slice(0, 2).forEach((numCol) => {
            charts.push({
                id: `bar-${catCol.name}-${numCol.name}`,
                type: 'bar',
                title: `${numCol.name} by ${catCol.name}`,
                xAxis: catCol.name,
                yAxis: numCol.name,
                aggregation: 'sum',
            });
        });
    });

    // Distribution: Single categorical
    categoricalCols.slice(0, 1).forEach((catCol) => {
        charts.push({
            id: `pie-${catCol.name}`,
            type: 'pie',
            title: `${catCol.name} Distribution`,
            xAxis: catCol.name,
            aggregation: 'count',
        });
    });

    // Scatter: Two numeric
    if (numericCols.length >= 2) {
        charts.push({
            id: `scatter-${numericCols[0].name}-${numericCols[1].name}`,
            type: 'scatter',
            title: `${numericCols[0].name} vs ${numericCols[1].name}`,
            xAxis: numericCols[0].name,
            yAxis: numericCols[1].name,
        });
    }

    // Histogram: Single numeric
    numericCols.slice(0, 1).forEach((numCol) => {
        charts.push({
            id: `histogram-${numCol.name}`,
            type: 'histogram',
            title: `${numCol.name} Distribution`,
            xAxis: numCol.name,
        });
    });

    return charts.slice(0, 6); // Limit to 6 charts
}

/**
 * Aggregate data for visualization
 */
export function aggregateData(
    data: Record<string, unknown>[],
    xAxis: string,
    yAxis?: string,
    aggregation: 'sum' | 'mean' | 'count' | 'min' | 'max' = 'sum'
): { name: string; value: number }[] {
    const groups: Record<string, number[]> = {};

    data.forEach((row) => {
        const key = String(row[xAxis] ?? 'Unknown');
        if (!groups[key]) groups[key] = [];

        if (yAxis) {
            const value = row[yAxis];
            if (typeof value === 'number' && !isNaN(value)) {
                groups[key].push(value);
            }
        } else {
            groups[key].push(1);
        }
    });

    return Object.entries(groups).map(([name, values]) => {
        let value: number;
        switch (aggregation) {
            case 'sum':
                value = values.reduce((a, b) => a + b, 0);
                break;
            case 'mean':
                value = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
                break;
            case 'count':
                value = values.length;
                break;
            case 'min':
                value = Math.min(...values);
                break;
            case 'max':
                value = Math.max(...values);
                break;
            default:
                value = values.reduce((a, b) => a + b, 0);
        }
        return { name, value: Math.round(value * 100) / 100 };
    }).sort((a, b) => b.value - a.value);
}

/**
 * Prepare histogram data
 */
export function prepareHistogramData(
    data: Record<string, unknown>[],
    column: string,
    bins: number = 10
): { name: string; value: number }[] {
    const values = data
        .map((row) => row[column])
        .filter((v): v is number => typeof v === 'number' && !isNaN(v));

    if (values.length === 0) return [];

    const min = Math.min(...values);
    const max = Math.max(...values);
    const binSize = (max - min) / bins || 1;

    const histogram: Record<string, number> = {};

    values.forEach((value) => {
        const binIndex = Math.min(Math.floor((value - min) / binSize), bins - 1);
        const binStart = Math.round(min + binIndex * binSize);
        const binEnd = Math.round(binStart + binSize);
        const binName = `${binStart}-${binEnd}`;
        histogram[binName] = (histogram[binName] || 0) + 1;
    });

    return Object.entries(histogram).map(([name, value]) => ({ name, value }));
}

/**
 * Prepare scatter data
 */
export function prepareScatterData(
    data: Record<string, unknown>[],
    xAxis: string,
    yAxis: string
): { x: number; y: number }[] {
    return data
        .filter((row) => {
            const x = row[xAxis];
            const y = row[yAxis];
            return typeof x === 'number' && typeof y === 'number' && !isNaN(x) && !isNaN(y);
        })
        .map((row) => ({
            x: row[xAxis] as number,
            y: row[yAxis] as number,
        }));
}

// Color palettes
export const CHART_COLORS = [
    '#6366f1', // Indigo
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#f43f5e', // Rose
    '#f97316', // Orange
    '#eab308', // Yellow
    '#22c55e', // Green
    '#14b8a6', // Teal
    '#06b6d4', // Cyan
    '#3b82f6', // Blue
];
