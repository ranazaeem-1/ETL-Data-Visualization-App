import Papa from 'papaparse';
import { ColumnInfo } from './store';

/**
 * Parse CSV file and return array of objects
 */
export function parseCSV(file: File): Promise<Record<string, unknown>[]> {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.errors.length > 0) {
                    console.warn('CSV parsing warnings:', results.errors);
                }
                resolve(results.data as Record<string, unknown>[]);
            },
            error: (error) => reject(error),
        });
    });
}

/**
 * Analyze dataset and infer column types
 */
export function analyzeDataset(data: Record<string, unknown>[]): ColumnInfo[] {
    if (data.length === 0) return [];

    const columns = Object.keys(data[0]);

    return columns.map((name) => {
        const values = data.map((row) => row[name]).filter((v) => v != null && v !== '');
        const missing = data.length - values.length;
        const uniqueValues = new Set(values);
        const unique = uniqueValues.size;

        // Type inference
        let type: ColumnInfo['type'] = 'text';

        // Check if numeric
        const numericValues = values.filter((v) => typeof v === 'number' && !isNaN(v as number));
        if (numericValues.length === values.length && values.length > 0) {
            type = 'numeric';
        }
        // Check if date
        else if (values.length > 0) {
            const datePattern = /^\d{4}[-/]\d{1,2}[-/]\d{1,2}|^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/;
            const dateValues = values.filter((v) => {
                if (typeof v !== 'string') return false;
                return datePattern.test(v) || !isNaN(Date.parse(v));
            });
            if (dateValues.length > values.length * 0.8) {
                type = 'date';
            }
            // Check if categorical (low cardinality)
            else if (unique <= Math.min(20, values.length * 0.5)) {
                type = 'categorical';
            }
        }

        // Calculate stats for numeric columns
        let stats: ColumnInfo['stats'] = undefined;
        if (type === 'numeric' && numericValues.length > 0) {
            const nums = numericValues as number[];
            const sorted = [...nums].sort((a, b) => a - b);
            const sum = nums.reduce((a, b) => a + b, 0);
            const mean = sum / nums.length;
            const median = sorted.length % 2 === 0
                ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
                : sorted[Math.floor(sorted.length / 2)];
            const variance = nums.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / nums.length;

            stats = {
                min: sorted[0],
                max: sorted[sorted.length - 1],
                mean: Math.round(mean * 100) / 100,
                median: Math.round(median * 100) / 100,
                stdDev: Math.round(Math.sqrt(variance) * 100) / 100,
            };
        }

        return { name, type, missing, unique, stats };
    });
}

/**
 * Apply smart transformations to the dataset
 */
export function applySmartTransformations(
    data: Record<string, unknown>[],
    columns: ColumnInfo[]
): { data: Record<string, unknown>[]; newColumns: string[] } {
    const newColumns: string[] = [];
    const transformedData = data.map((row) => ({ ...row }));

    columns.forEach((col) => {
        // Date transformations
        if (col.type === 'date') {
            const yearCol = `${col.name}_Year`;
            const monthCol = `${col.name}_Month`;
            const dayOfWeekCol = `${col.name}_DayOfWeek`;

            transformedData.forEach((row) => {
                const dateValue = row[col.name];
                if (dateValue) {
                    const date = new Date(dateValue as string);
                    if (!isNaN(date.getTime())) {
                        row[yearCol] = date.getFullYear();
                        row[monthCol] = date.toLocaleString('default', { month: 'short' });
                        row[dayOfWeekCol] = date.toLocaleString('default', { weekday: 'short' });
                    }
                }
            });

            newColumns.push(yearCol, monthCol, dayOfWeekCol);
        }

        // Numeric binning
        if (col.type === 'numeric' && col.stats) {
            const binCol = `${col.name}_Bin`;
            const range = (col.stats.max || 0) - (col.stats.min || 0);
            const binSize = range / 5; // 5 bins

            if (binSize > 0) {
                transformedData.forEach((row) => {
                    const value = row[col.name] as number;
                    if (value != null && !isNaN(value)) {
                        const binIndex = Math.min(Math.floor((value - (col.stats?.min || 0)) / binSize), 4);
                        const binStart = Math.round((col.stats?.min || 0) + binIndex * binSize);
                        const binEnd = Math.round(binStart + binSize);
                        row[binCol] = `${binStart}-${binEnd}`;
                    }
                });
                newColumns.push(binCol);
            }
        }
    });

    return { data: transformedData, newColumns };
}

/**
 * Export data to CSV string
 */
export function exportToCSV(data: Record<string, unknown>[]): string {
    return Papa.unparse(data);
}

/**
 * Download data as CSV file
 */
export function downloadCSV(data: Record<string, unknown>[], fileName: string): void {
    const csv = exportToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
}
