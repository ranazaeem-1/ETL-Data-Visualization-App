'use client';

import React, { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';

interface FileUploaderProps {
    onFileSelect: (file: File) => void;
    isLoading?: boolean;
}

export function FileUploader({ onFileSelect, isLoading }: FileUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragging(true);
        } else if (e.type === 'dragleave') {
            setIsDragging(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files?.[0]) {
            onFileSelect(files[0]);
        }
    }, [onFileSelect]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files?.[0]) {
            onFileSelect(files[0]);
        }
    }, [onFileSelect]);

    return (
        <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`
        relative border-2 border-dashed rounded-lg p-12 text-center transition-colors
        ${isDragging
                    ? 'border-[rgb(var(--accent))] bg-[rgba(var(--accent),0.05)]'
                    : 'border-[rgb(var(--border-color))] hover:border-[rgb(var(--accent))]'
                }
        ${isLoading ? 'opacity-50 pointer-events-none' : ''}
      `}
        >
            <input
                type="file"
                accept=".csv"
                onChange={handleChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isLoading}
            />

            <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[rgb(var(--bg-secondary))] flex items-center justify-center">
                    {isLoading ? (
                        <div className="w-6 h-6 border-2 border-[rgb(var(--accent))] border-t-transparent rounded-full animate-spin" />
                    ) : isDragging ? (
                        <FileSpreadsheet className="w-8 h-8 text-[rgb(var(--accent))]" />
                    ) : (
                        <Upload className="w-8 h-8 text-[rgb(var(--text-secondary))]" />
                    )}
                </div>

                <div>
                    <p className="text-lg font-medium text-[rgb(var(--text-primary))]">
                        {isLoading ? 'Processing...' : isDragging ? 'Drop file here' : 'Upload CSV file'}
                    </p>
                    <p className="text-sm text-[rgb(var(--text-secondary))] mt-1">
                        Drag and drop or click to browse
                    </p>
                </div>
            </div>
        </div>
    );
}
