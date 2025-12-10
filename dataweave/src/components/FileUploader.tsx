'use client';

import React, { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, X, Sparkles, Zap, BarChart3 } from 'lucide-react';

interface FileUploaderProps {
    onFileSelect: (file: File) => void;
    isLoading?: boolean;
}

export function FileUploader({ onFileSelect, isLoading }: FileUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDragIn = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setIsDragging(true);
        }
    }, []);

    const handleDragOut = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (file.name.endsWith('.csv')) {
                setFileName(file.name);
                onFileSelect(file);
            }
        }
    }, [onFileSelect]);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setFileName(file.name);
            onFileSelect(file);
        }
    }, [onFileSelect]);

    const clearFile = useCallback(() => {
        setFileName(null);
    }, []);

    return (
        <div className="relative group">
            {/* Animated glow background */}
            <div className={`
        absolute -inset-1 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500
        bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500
        blur-xl
        ${isDragging ? 'opacity-100' : ''}
      `} />

            <div
                className={`
          relative border-2 border-dashed rounded-3xl p-16
          transition-all duration-500 ease-out
          backdrop-blur-xl
          ${isDragging
                        ? 'border-transparent bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 scale-[1.02]'
                        : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                    }
          ${isLoading ? 'pointer-events-none' : ''}
        `}
                onDragEnter={handleDragIn}
                onDragLeave={handleDragOut}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileInput}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isLoading}
                />

                {/* Decorative corner accents */}
                <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-indigo-500/50 rounded-tl-lg" />
                <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-purple-500/50 rounded-tr-lg" />
                <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-pink-500/50 rounded-bl-lg" />
                <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-cyan-500/50 rounded-br-lg" />

                <div className="flex flex-col items-center gap-6 text-center">
                    {isLoading ? (
                        <div className="animate-fade-in">
                            {/* Animated loading spinner */}
                            <div className="relative w-24 h-24 mx-auto mb-4">
                                <div className="absolute inset-0 rounded-full border-4 border-white/10" />
                                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 border-r-purple-500 animate-spin" />
                                <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-pink-500 border-l-cyan-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
                                </div>
                            </div>
                            <p className="text-xl font-medium text-white mb-2">Processing your data...</p>
                            <p className="text-white/50">Analyzing columns and generating insights</p>
                        </div>
                    ) : fileName ? (
                        <div className="animate-fade-in">
                            <div className="relative group/file">
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl blur-xl opacity-30 group-hover/file:opacity-50 transition-opacity" />
                                <div className="relative w-20 h-20 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-2xl">
                                    <FileSpreadsheet className="w-10 h-10 text-white" />
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        clearFile();
                                    }}
                                    className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-400 transition-colors shadow-lg hover:scale-110"
                                >
                                    <X className="w-4 h-4 text-white" />
                                </button>
                            </div>
                            <p className="text-xl font-medium text-white mt-4">{fileName}</p>
                            <p className="text-white/50 mt-1">Drop another file to replace</p>
                        </div>
                    ) : (
                        <div className="animate-fade-in">
                            {/* Main upload icon */}
                            <div className="relative mb-6">
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl blur-2xl opacity-40 animate-pulse" />
                                <div className="relative w-28 h-28 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl mx-auto group-hover:scale-105 transition-transform duration-300">
                                    <Upload className="w-14 h-14 text-white drop-shadow-lg" />
                                </div>

                                {/* Floating icons */}
                                <div className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg animate-bounce" style={{ animationDelay: '0.2s' }}>
                                    <Zap className="w-5 h-5 text-white" />
                                </div>
                                <div className="absolute -bottom-2 -left-2 w-10 h-10 bg-gradient-to-br from-pink-400 to-rose-500 rounded-xl flex items-center justify-center shadow-lg animate-bounce" style={{ animationDelay: '0.4s' }}>
                                    <BarChart3 className="w-5 h-5 text-white" />
                                </div>
                            </div>

                            <h3 className="text-2xl font-bold text-white mb-2">
                                Drop your CSV file here
                            </h3>
                            <p className="text-white/50 text-lg">
                                or <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 font-medium cursor-pointer hover:from-indigo-300 hover:to-purple-300 transition-all">browse</span> to choose a file
                            </p>

                            {/* Supported formats badge */}
                            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-sm text-white/60">Supports CSV files up to 100MB</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
