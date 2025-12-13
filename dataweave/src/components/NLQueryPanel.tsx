'use client';

import React, { useState, useCallback } from 'react';
import { X, MessageSquare, Search, Sparkles, HelpCircle } from 'lucide-react';
import { ColumnInfo } from '@/lib/store';

interface NLQueryPanelProps {
    data: Record<string, unknown>[];
    columns: ColumnInfo[];
    onApplyFilter: (filteredData: Record<string, unknown>[]) => void;
    onClose: () => void;
}

interface QueryResult {
    success: boolean;
    message: string;
    matchCount?: number;
    data?: Record<string, unknown>[];
}

// Simple NLP parser for common query patterns
function parseQuery(
    query: string,
    data: Record<string, unknown>[],
    columns: ColumnInfo[]
): QueryResult {
    const lowerQuery = query.toLowerCase().trim();

    // Check for empty query
    if (!lowerQuery) {
        return { success: false, message: 'Please enter a query' };
    }

    const numericCols = columns.filter((c) => c.type === 'numeric');
    const textCols = columns.filter((c) => c.type !== 'numeric');

    // Pattern: "show rows where [column] is [value]"
    const whereMatch = lowerQuery.match(/(?:show|find|get|filter)\s+(?:rows?\s+)?where\s+(\w+)\s+(?:is|=|equals?)\s+['"]?([^'"]+)['"]?/i);
    if (whereMatch) {
        const colName = columns.find((c) => c.name.toLowerCase() === whereMatch[1].toLowerCase())?.name;
        if (colName) {
            const targetValue = whereMatch[2].trim();
            const filtered = data.filter((row) => {
                const val = String(row[colName] ?? '').toLowerCase();
                return val === targetValue.toLowerCase() || val.includes(targetValue.toLowerCase());
            });
            return { success: true, message: `Filtered to rows where ${colName} contains "${targetValue}"`, matchCount: filtered.length, data: filtered };
        }
    }

    // Pattern: "show [column] greater/less than [number]"
    const comparisonMatch = lowerQuery.match(/(?:show|find|get|filter)\s+(?:rows?\s+)?(?:where\s+)?(\w+)\s+(greater|less|more|above|below|over|under)\s+(?:than\s+)?(\d+(?:\.\d+)?)/i);
    if (comparisonMatch) {
        const colName = numericCols.find((c) => c.name.toLowerCase() === comparisonMatch[1].toLowerCase())?.name;
        if (colName) {
            const threshold = parseFloat(comparisonMatch[3]);
            const isGreater = ['greater', 'more', 'above', 'over'].includes(comparisonMatch[2].toLowerCase());
            const filtered = data.filter((row) => {
                const val = row[colName];
                if (typeof val !== 'number') return false;
                return isGreater ? val > threshold : val < threshold;
            });
            return { success: true, message: `Filtered to rows where ${colName} is ${isGreater ? '>' : '<'} ${threshold}`, matchCount: filtered.length, data: filtered };
        }
    }

    // Pattern: "show top/bottom [n] by [column]"
    const topBottomMatch = lowerQuery.match(/(?:show|get)\s+(top|bottom|first|last)\s+(\d+)\s+(?:by|rows?\s+by)\s+(\w+)/i);
    if (topBottomMatch) {
        const colName = columns.find((c) => c.name.toLowerCase() === topBottomMatch[3].toLowerCase())?.name;
        const n = parseInt(topBottomMatch[2]);
        const isTop = ['top', 'first'].includes(topBottomMatch[1].toLowerCase());

        if (colName && n > 0) {
            const sorted = [...data].sort((a, b) => {
                const aVal = a[colName];
                const bVal = b[colName];
                if (typeof aVal === 'number' && typeof bVal === 'number') {
                    return isTop ? bVal - aVal : aVal - bVal;
                }
                return String(aVal ?? '').localeCompare(String(bVal ?? '')) * (isTop ? -1 : 1);
            });
            const result = sorted.slice(0, n);
            return { success: true, message: `Showing ${isTop ? 'top' : 'bottom'} ${n} rows by ${colName}`, matchCount: result.length, data: result };
        }
    }

    // Pattern: "show [column] between [n] and [m]"
    const betweenMatch = lowerQuery.match(/(?:show|find|get|filter)\s+(?:rows?\s+)?(?:where\s+)?(\w+)\s+between\s+(\d+(?:\.\d+)?)\s+and\s+(\d+(?:\.\d+)?)/i);
    if (betweenMatch) {
        const colName = numericCols.find((c) => c.name.toLowerCase() === betweenMatch[1].toLowerCase())?.name;
        if (colName) {
            const min = parseFloat(betweenMatch[2]);
            const max = parseFloat(betweenMatch[3]);
            const filtered = data.filter((row) => {
                const val = row[colName];
                if (typeof val !== 'number') return false;
                return val >= min && val <= max;
            });
            return { success: true, message: `Filtered to rows where ${colName} is between ${min} and ${max}`, matchCount: filtered.length, data: filtered };
        }
    }

    // Pattern: "show rows with missing [column]" or "show empty values"
    const missingMatch = lowerQuery.match(/(?:show|find|get)\s+(?:rows?\s+)?(?:with\s+)?(?:missing|empty|null|blank)\s+(?:values?\s+)?(?:in\s+)?(\w+)?/i);
    if (missingMatch) {
        if (missingMatch[1]) {
            const colName = columns.find((c) => c.name.toLowerCase() === missingMatch[1].toLowerCase())?.name;
            if (colName) {
                const filtered = data.filter((row) => row[colName] == null || row[colName] === '');
                return { success: true, message: `Showing rows with missing values in ${colName}`, matchCount: filtered.length, data: filtered };
            }
        } else {
            const filtered = data.filter((row) => Object.values(row).some((v) => v == null || v === ''));
            return { success: true, message: 'Showing rows with any missing values', matchCount: filtered.length, data: filtered };
        }
    }

    // Pattern: "show unique values in [column]" - just count and display
    const uniqueMatch = lowerQuery.match(/(?:show|count|list)\s+unique\s+(?:values?\s+)?(?:in\s+)?(\w+)/i);
    if (uniqueMatch) {
        const colName = columns.find((c) => c.name.toLowerCase() === uniqueMatch[1].toLowerCase())?.name;
        if (colName) {
            const uniqueValues = [...new Set(data.map((r) => String(r[colName] ?? '')))];
            return { success: true, message: `Column "${colName}" has ${uniqueValues.length} unique values: ${uniqueValues.slice(0, 5).join(', ')}${uniqueValues.length > 5 ? '...' : ''}`, matchCount: uniqueValues.length };
        }
    }

    // Pattern: "show rows containing [text]"
    const containsMatch = lowerQuery.match(/(?:show|find|get|search)\s+(?:rows?\s+)?(?:containing|with|having)\s+['"]?([^'"]+)['"]?/i);
    if (containsMatch) {
        const searchText = containsMatch[1].toLowerCase().trim();
        const filtered = data.filter((row) =>
            Object.values(row).some((v) => String(v ?? '').toLowerCase().includes(searchText))
        );
        return { success: true, message: `Showing rows containing "${searchText}"`, matchCount: filtered.length, data: filtered };
    }

    // If no pattern matched, try simple column value search
    const words = lowerQuery.split(/\s+/);
    for (const col of columns) {
        if (words.some((w) => col.name.toLowerCase().includes(w))) {
            const uniqueValues = [...new Set(data.map((r) => String(r[col.name] ?? '')))];
            return {
                success: true,
                message: `Column "${col.name}" (${col.type}): ${uniqueValues.length} unique values, ${columns.find(c => c.name === col.name)?.missing || 0} missing`,
                matchCount: uniqueValues.length
            };
        }
    }

    return {
        success: false,
        message: 'Could not understand the query. Try patterns like:\n• "Show rows where [column] is [value]"\n• "Show top 10 by [column]"\n• "Find rows containing [text]"'
    };
}

export function NLQueryPanel({ data, columns, onApplyFilter, onClose }: NLQueryPanelProps) {
    const [query, setQuery] = useState('');
    const [result, setResult] = useState<QueryResult | null>(null);
    const [history, setHistory] = useState<string[]>([]);

    const handleQuery = useCallback(() => {
        if (!query.trim()) return;

        const queryResult = parseQuery(query, data, columns);
        setResult(queryResult);

        if (!history.includes(query)) {
            setHistory((h) => [query, ...h].slice(0, 5));
        }
    }, [query, data, columns, history]);

    const handleApply = () => {
        if (result?.success && result.data) {
            onApplyFilter(result.data);
            onClose();
        }
    };

    const examples = [
        'Show top 10 by Revenue',
        'Find rows where Category is Electronics',
        'Show Sales greater than 1000',
        'Find rows containing Apple',
        'Show rows with missing values',
        'Show Price between 50 and 200',
    ];

    return (
        <div className="modal-overlay animate-fade-in" onClick={onClose}>
            <div className="modal-content w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[rgb(var(--border-color))]">
                    <div className="flex items-center gap-3">
                        <MessageSquare className="w-5 h-5 text-[rgb(var(--accent))]" />
                        <h3 className="font-semibold text-[rgb(var(--text-primary))]">Natural Language Query</h3>
                    </div>
                    <button onClick={onClose} className="btn-icon">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Query Input */}
                <div className="p-4 border-b border-[rgb(var(--border-color))]">
                    <div className="relative">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
                            placeholder="Ask a question about your data..."
                            className="w-full pr-10"
                        />
                        <button
                            onClick={handleQuery}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-[rgb(var(--accent))] text-white hover:bg-[rgb(var(--accent-light))]"
                        >
                            <Search className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 max-h-80 overflow-auto">
                    {result ? (
                        <div className={`p-4 rounded-lg ${result.success ? 'bg-green-500/10' : 'bg-amber-500/10'}`}>
                            <div className="flex items-start gap-3">
                                <Sparkles className={`w-5 h-5 mt-0.5 ${result.success ? 'text-green-500' : 'text-amber-500'}`} />
                                <div className="flex-1">
                                    <p className="text-sm text-[rgb(var(--text-primary))] whitespace-pre-line">{result.message}</p>
                                    {result.matchCount !== undefined && result.data && (
                                        <p className="text-xs text-[rgb(var(--text-secondary))] mt-2">
                                            {result.matchCount} rows matched
                                        </p>
                                    )}
                                </div>
                            </div>

                            {result.success && result.data && (
                                <button onClick={handleApply} className="btn btn-primary w-full mt-4">
                                    Apply Filter ({result.matchCount} rows)
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-2 mb-3">
                                <HelpCircle className="w-4 h-4 text-[rgb(var(--text-secondary))]" />
                                <span className="text-sm font-medium text-[rgb(var(--text-secondary))]">Example Queries</span>
                            </div>
                            <div className="space-y-2">
                                {examples.map((ex, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setQuery(ex)}
                                        className="w-full text-left px-3 py-2 rounded-lg text-sm text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-secondary))] hover:text-[rgb(var(--text-primary))] transition-colors"
                                    >
                                        "{ex}"
                                    </button>
                                ))}
                            </div>
                        </>
                    )}

                    {/* History */}
                    {history.length > 0 && !result && (
                        <div className="mt-4 pt-4 border-t border-[rgb(var(--border-color))]">
                            <p className="text-xs text-[rgb(var(--text-secondary))] mb-2">Recent queries:</p>
                            <div className="flex flex-wrap gap-2">
                                {history.map((h, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setQuery(h)}
                                        className="px-2 py-1 text-xs rounded bg-[rgb(var(--bg-secondary))] text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]"
                                    >
                                        {h}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-[rgb(var(--border-color))] bg-[rgb(var(--bg-secondary))]">
                    <p className="text-xs text-[rgb(var(--text-secondary))]">
                        Columns: {columns.map((c) => c.name).slice(0, 5).join(', ')}
                        {columns.length > 5 && ` +${columns.length - 5} more`}
                    </p>
                </div>
            </div>
        </div>
    );
}
