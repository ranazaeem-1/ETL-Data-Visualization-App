'use client';

import React, { useState, useCallback } from 'react';
import { X, Files, Merge, Upload, Trash2, FileSpreadsheet, ArrowRight } from 'lucide-react';
import { FileInfo } from '@/lib/store';
import { parseCSV, analyzeDataset } from '@/lib/data-engine';

interface MultiFilePanelProps {
    files: FileInfo[];
    onAddFile: (file: FileInfo) => void;
    onRemoveFile: (index: number) => void;
    onMergeFiles: (file1Index: number, file2Index: number, joinColumn: string, joinType: 'inner' | 'left' | 'outer') => void;
    onClose: () => void;
}

export function MultiFilePanel({
    files,
    onAddFile,
    onRemoveFile,
    onMergeFiles,
    onClose
}: MultiFilePanelProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [file1Index, setFile1Index] = useState<number | null>(null);
    const [file2Index, setFile2Index] = useState<number | null>(null);
    const [joinColumn, setJoinColumn] = useState('');
    const [joinType, setJoinType] = useState<'inner' | 'left' | 'outer'>('inner');
    const [error, setError] = useState<string | null>(null);

    const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFile = e.target.files?.[0];
        if (!uploadedFile) return;

        setIsUploading(true);
        setError(null);

        try {
            const data = await parseCSV(uploadedFile);
            const columns = analyzeDataset(data);

            onAddFile({
                name: uploadedFile.name,
                data,
                columns,
                rowCount: data.length,
            });
        } catch (err) {
            setError('Failed to parse file. Please ensure it is a valid CSV.');
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    }, [onAddFile]);

    const handleMerge = () => {
        if (file1Index === null || file2Index === null) {
            setError('Please select two files to merge');
            return;
        }
        if (!joinColumn) {
            setError('Please select a join column');
            return;
        }
        onMergeFiles(file1Index, file2Index, joinColumn, joinType);
        onClose();
    };

    // Get common columns between selected files
    const commonColumns = (() => {
        if (file1Index === null || file2Index === null) return [];
        const file1Cols = new Set(files[file1Index]?.columns.map((c) => c.name) || []);
        const file2Cols = files[file2Index]?.columns.map((c) => c.name) || [];
        return file2Cols.filter((col) => file1Cols.has(col));
    })();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-2xl glass-strong rounded-2xl shadow-2xl animate-fade-in-up max-h-[85vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-[rgb(var(--text-primary))]/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                            <Files className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">Multi-File Manager</h2>
                            <p className="text-sm text-[rgb(var(--text-secondary))]">
                                Upload and merge multiple CSV files
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-[rgb(var(--text-primary))]/5 transition-colors"
                    >
                        <X className="w-5 h-5 text-[rgb(var(--text-secondary))]" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-5 space-y-6">
                    {/* Upload Section */}
                    <div>
                        <h3 className="text-sm font-medium text-[rgb(var(--text-secondary))] mb-3">Upload Files</h3>
                        <label className={`
              flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-dashed
              transition-all cursor-pointer
              ${isUploading
                                ? 'border-indigo-500/50 bg-indigo-500/10'
                                : 'border-[rgb(var(--text-primary))]/10 hover:border-indigo-500/30 hover:bg-indigo-500/5'
                            }
            `}>
                            <Upload className="w-5 h-5 text-[rgb(var(--text-secondary))]" />
                            <span className="text-sm text-[rgb(var(--text-secondary))]">
                                {isUploading ? 'Uploading...' : 'Click to upload another CSV file'}
                            </span>
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileUpload}
                                disabled={isUploading}
                                className="hidden"
                            />
                        </label>
                    </div>

                    {/* File List */}
                    <div>
                        <h3 className="text-sm font-medium text-[rgb(var(--text-secondary))] mb-3">
                            Uploaded Files ({files.length})
                        </h3>
                        {files.length === 0 ? (
                            <div className="text-center py-8 text-[rgb(var(--text-secondary))]/50">
                                No files uploaded yet
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {files.map((file, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 rounded-xl bg-[rgb(var(--text-primary))]/[0.02] border border-[rgb(var(--text-primary))]/5"
                                    >
                                        <div className="flex items-center gap-3">
                                            <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                                            <div>
                                                <p className="font-medium text-[rgb(var(--text-primary))] text-sm">{file.name}</p>
                                                <p className="text-xs text-[rgb(var(--text-secondary))]">
                                                    {file.rowCount.toLocaleString()} rows · {file.columns.length} columns
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => onRemoveFile(index)}
                                            className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Merge Section */}
                    {files.length >= 2 && (
                        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                            <h3 className="text-sm font-medium text-blue-500 mb-4 flex items-center gap-2">
                                <Merge className="w-4 h-4" />
                                Merge Files
                            </h3>

                            <div className="space-y-4">
                                <div className="grid grid-cols-[1fr,auto,1fr] gap-3 items-center">
                                    <select
                                        value={file1Index ?? ''}
                                        onChange={(e) => {
                                            setFile1Index(e.target.value ? Number(e.target.value) : null);
                                            setJoinColumn('');
                                        }}
                                        className="px-3 py-2 bg-[rgb(var(--text-primary))]/[0.03] border border-[rgb(var(--text-primary))]/10 rounded-lg text-[rgb(var(--text-primary))] text-sm focus:outline-none"
                                    >
                                        <option value="">Select file 1...</option>
                                        {files.map((file, i) => (
                                            <option key={i} value={i}>{file.name}</option>
                                        ))}
                                    </select>

                                    <ArrowRight className="w-5 h-5 text-[rgb(var(--text-secondary))]" />

                                    <select
                                        value={file2Index ?? ''}
                                        onChange={(e) => {
                                            setFile2Index(e.target.value ? Number(e.target.value) : null);
                                            setJoinColumn('');
                                        }}
                                        className="px-3 py-2 bg-[rgb(var(--text-primary))]/[0.03] border border-[rgb(var(--text-primary))]/10 rounded-lg text-[rgb(var(--text-primary))] text-sm focus:outline-none"
                                    >
                                        <option value="">Select file 2...</option>
                                        {files.map((file, i) => (
                                            <option key={i} value={i} disabled={i === file1Index}>{file.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {commonColumns.length > 0 && (
                                    <>
                                        <div>
                                            <label className="block text-xs text-[rgb(var(--text-secondary))] mb-1">Join Column</label>
                                            <select
                                                value={joinColumn}
                                                onChange={(e) => setJoinColumn(e.target.value)}
                                                className="w-full px-3 py-2 bg-[rgb(var(--text-primary))]/[0.03] border border-[rgb(var(--text-primary))]/10 rounded-lg text-[rgb(var(--text-primary))] text-sm focus:outline-none"
                                            >
                                                <option value="">Select column...</option>
                                                {commonColumns.map((col) => (
                                                    <option key={col} value={col}>{col}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs text-[rgb(var(--text-secondary))] mb-1">Join Type</label>
                                            <div className="flex gap-2">
                                                {(['inner', 'left', 'outer'] as const).map((type) => (
                                                    <button
                                                        key={type}
                                                        onClick={() => setJoinType(type)}
                                                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${joinType === type
                                                                ? 'bg-blue-500 text-white'
                                                                : 'bg-[rgb(var(--text-primary))]/[0.03] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--text-primary))]/[0.06]'
                                                            }`}
                                                    >
                                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                                    </button>
                                                ))}
                                            </div>
                                            <p className="text-xs text-[rgb(var(--text-secondary))] mt-2">
                                                {joinType === 'inner' && 'Only rows matching in both files'}
                                                {joinType === 'left' && 'All rows from file 1, matching from file 2'}
                                                {joinType === 'outer' && 'All rows from both files'}
                                            </p>
                                        </div>
                                    </>
                                )}

                                {file1Index !== null && file2Index !== null && commonColumns.length === 0 && (
                                    <div className="p-3 rounded-lg bg-amber-500/10 text-amber-500 text-sm">
                                        No common columns found between the selected files.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {files.length >= 2 && commonColumns.length > 0 && joinColumn && (
                    <div className="p-5 border-t border-[rgb(var(--text-primary))]/5">
                        <button
                            onClick={handleMerge}
                            className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                            <Merge className="w-4 h-4" />
                            Merge Files
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
