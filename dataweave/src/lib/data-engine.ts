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

// ============================================
// MISSING VALUE HANDLING
// ============================================

export type FillStrategy = 'mean' | 'median' | 'mode' | 'custom' | 'drop';

/**
 * Get the mode (most frequent value) of an array
 */
function getMode(values: unknown[]): unknown {
    const frequency: Record<string, number> = {};
    let maxFreq = 0;
    let mode: unknown = null;

    values.forEach((v) => {
        const key = String(v);
        frequency[key] = (frequency[key] || 0) + 1;
        if (frequency[key] > maxFreq) {
            maxFreq = frequency[key];
            mode = v;
        }
    });

    return mode;
}

/**
 * Calculate the mean of numeric values
 */
function getMean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Calculate the median of numeric values
 */
function getMedian(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];
}

/**
 * Fill missing values in a column
 */
export function fillMissingValues(
    data: Record<string, unknown>[],
    columnName: string,
    strategy: FillStrategy,
    customValue?: unknown
): Record<string, unknown>[] {
    const values = data
        .map((row) => row[columnName])
        .filter((v) => v != null && v !== '');

    let fillValue: unknown;

    switch (strategy) {
        case 'mean': {
            const numericValues = values.filter((v) => typeof v === 'number') as number[];
            fillValue = Math.round(getMean(numericValues) * 100) / 100;
            break;
        }
        case 'median': {
            const numericValues = values.filter((v) => typeof v === 'number') as number[];
            fillValue = Math.round(getMedian(numericValues) * 100) / 100;
            break;
        }
        case 'mode':
            fillValue = getMode(values);
            break;
        case 'custom':
            fillValue = customValue;
            break;
        case 'drop':
            // Handled separately
            return data.filter((row) => row[columnName] != null && row[columnName] !== '');
    }

    return data.map((row) => {
        if (row[columnName] == null || row[columnName] === '') {
            return { ...row, [columnName]: fillValue };
        }
        return row;
    });
}

/**
 * Drop rows with any missing values
 */
export function dropRowsWithMissing(
    data: Record<string, unknown>[],
    columns?: string[]
): Record<string, unknown>[] {
    const colsToCheck = columns || (data.length > 0 ? Object.keys(data[0]) : []);

    return data.filter((row) =>
        colsToCheck.every((col) => row[col] != null && row[col] !== '')
    );
}

/**
 * Get missing value summary for all columns
 */
export function getMissingSummary(
    data: Record<string, unknown>[],
    columns: string[]
): { column: string; missing: number; percent: string }[] {
    return columns.map((col) => {
        const missing = data.filter((row) => row[col] == null || row[col] === '').length;
        const percent = ((missing / data.length) * 100).toFixed(1);
        return { column: col, missing, percent };
    });
}

// ============================================
// EXPORT FUNCTIONS
// ============================================

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

/**
 * Download data as Excel file (using simple CSV in xlsx extension)
 * For full Excel support, would need xlsx library
 */
export function downloadExcel(data: Record<string, unknown>[], fileName: string): void {
    // Create a simple tab-separated format that Excel can read
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const rows = [
        headers.join('\t'),
        ...data.map((row) => headers.map((h) => String(row[h] ?? '')).join('\t'))
    ];

    const content = rows.join('\n');
    const blob = new Blob(['\ufeff' + content], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
    link.click();
    URL.revokeObjectURL(link.href);
}
