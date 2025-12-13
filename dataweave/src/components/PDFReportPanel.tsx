'use client';

import React, { useState } from 'react';
import { X, FileText, Download, CheckCircle } from 'lucide-react';
import { ColumnInfo } from '@/lib/store';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PDFReportPanelProps {
    data: Record<string, unknown>[];
    columns: ColumnInfo[];
    fileName: string;
    onClose: () => void;
}

export function PDFReportPanel({ data, columns, fileName, onClose }: PDFReportPanelProps) {
    const [generating, setGenerating] = useState(false);
    const [generated, setGenerated] = useState(false);

    const generateReport = async () => {
        setGenerating(true);

        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            let yPos = 20;

            // Title
            doc.setFontSize(20);
            doc.setTextColor(79, 70, 229); // Indigo
            doc.text('Data Profiling Report', pageWidth / 2, yPos, { align: 'center' });
            yPos += 10;

            // Subtitle
            doc.setFontSize(12);
            doc.setTextColor(100, 100, 100);
            doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPos, { align: 'center' });
            yPos += 15;

            // File info
            doc.setFontSize(11);
            doc.setTextColor(0, 0, 0);
            doc.text(`File: ${fileName}`, 14, yPos);
            yPos += 6;
            doc.text(`Total Rows: ${data.length.toLocaleString()}`, 14, yPos);
            yPos += 6;
            doc.text(`Total Columns: ${columns.length}`, 14, yPos);
            yPos += 15;

            // Data Quality Summary
            doc.setFontSize(14);
            doc.setTextColor(79, 70, 229);
            doc.text('Data Quality Summary', 14, yPos);
            yPos += 8;

            const missingCols = columns.filter((c) => c.missing > 0);
            const numericCols = columns.filter((c) => c.type === 'numeric');
            const categoricalCols = columns.filter((c) => c.type === 'categorical');
            const totalMissing = columns.reduce((sum, c) => sum + c.missing, 0);
            const completenessRate = ((1 - totalMissing / (data.length * columns.length)) * 100).toFixed(1);

            const qualityData = [
                ['Data Completeness', `${completenessRate}%`],
                ['Numeric Columns', numericCols.length.toString()],
                ['Categorical Columns', categoricalCols.length.toString()],
                ['Columns with Missing Values', missingCols.length.toString()],
                ['Total Missing Values', totalMissing.toLocaleString()],
            ];

            autoTable(doc, {
                startY: yPos,
                head: [['Metric', 'Value']],
                body: qualityData,
                theme: 'striped',
                headStyles: { fillColor: [79, 70, 229] },
                margin: { left: 14, right: 14 },
            });

            yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

            // Column Statistics
            doc.setFontSize(14);
            doc.setTextColor(79, 70, 229);
            doc.text('Column Statistics', 14, yPos);
            yPos += 8;

            const colStats = columns.map((col) => {
                const values = data.map((row) => row[col.name]);
                const nonNull = values.filter((v) => v != null && v !== '');
                const uniqueCount = new Set(nonNull.map((v) => String(v))).size;

                if (col.type === 'numeric') {
                    const numVals = nonNull.filter((v): v is number => typeof v === 'number');
                    const mean = numVals.length > 0 ? numVals.reduce((a, b) => a + b, 0) / numVals.length : 0;
                    const min = numVals.length > 0 ? Math.min(...numVals) : 0;
                    const max = numVals.length > 0 ? Math.max(...numVals) : 0;

                    return [
                        col.name,
                        col.type,
                        col.missing.toString(),
                        uniqueCount.toString(),
                        mean.toFixed(2),
                        min.toFixed(2),
                        max.toFixed(2),
                    ];
                }

                return [
                    col.name,
                    col.type,
                    col.missing.toString(),
                    uniqueCount.toString(),
                    '-',
                    '-',
                    '-',
                ];
            });

            autoTable(doc, {
                startY: yPos,
                head: [['Column', 'Type', 'Missing', 'Unique', 'Mean', 'Min', 'Max']],
                body: colStats,
                theme: 'striped',
                headStyles: { fillColor: [79, 70, 229] },
                margin: { left: 14, right: 14 },
                styles: { fontSize: 8 },
                columnStyles: {
                    0: { cellWidth: 35 },
                    1: { cellWidth: 25 },
                    2: { cellWidth: 20 },
                    3: { cellWidth: 20 },
                    4: { cellWidth: 25 },
                    5: { cellWidth: 25 },
                    6: { cellWidth: 25 },
                },
            });

            yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

            // Check if we need a new page
            if (yPos > 250) {
                doc.addPage();
                yPos = 20;
            }

            // Sample Data Preview
            doc.setFontSize(14);
            doc.setTextColor(79, 70, 229);
            doc.text('Sample Data (First 10 Rows)', 14, yPos);
            yPos += 8;

            const sampleData = data.slice(0, 10).map((row) =>
                columns.slice(0, 6).map((col) => {
                    const val = row[col.name];
                    const str = val != null ? String(val) : '';
                    return str.length > 20 ? str.substring(0, 17) + '...' : str;
                })
            );

            autoTable(doc, {
                startY: yPos,
                head: [columns.slice(0, 6).map((c) => c.name.length > 12 ? c.name.substring(0, 10) + '...' : c.name)],
                body: sampleData,
                theme: 'striped',
                headStyles: { fillColor: [79, 70, 229] },
                margin: { left: 14, right: 14 },
                styles: { fontSize: 7 },
            });

            yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

            // Insights
            if (yPos > 250) {
                doc.addPage();
                yPos = 20;
            }

            doc.setFontSize(14);
            doc.setTextColor(79, 70, 229);
            doc.text('Key Insights', 14, yPos);
            yPos += 8;

            const insights: string[] = [];

            // Missing value insights
            if (missingCols.length > 0) {
                const worstCol = missingCols.reduce((a, b) => a.missing > b.missing ? a : b);
                insights.push(`Column "${worstCol.name}" has ${worstCol.missing} missing values (${((worstCol.missing / data.length) * 100).toFixed(1)}%)`);
            } else {
                insights.push('No missing values detected - data is complete!');
            }

            // Numeric column insights
            numericCols.forEach((col) => {
                const values = data.map((r) => r[col.name]).filter((v): v is number => typeof v === 'number');
                if (values.length > 0) {
                    const mean = values.reduce((a, b) => a + b, 0) / values.length;
                    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
                    const cv = (Math.sqrt(variance) / mean) * 100;

                    if (cv > 100) {
                        insights.push(`Column "${col.name}" has high variability (CV: ${cv.toFixed(1)}%)`);
                    }
                }
            });

            // Cardinality insights
            columns.forEach((col) => {
                const uniqueCount = new Set(data.map((r) => String(r[col.name] ?? ''))).size;
                if (uniqueCount === data.length && col.type === 'categorical') {
                    insights.push(`Column "${col.name}" appears to be a unique identifier`);
                } else if (uniqueCount === 2 && col.type !== 'numeric') {
                    insights.push(`Column "${col.name}" is binary (2 unique values)`);
                }
            });

            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            insights.slice(0, 8).forEach((insight, i) => {
                doc.text(`• ${insight}`, 14, yPos + (i * 6));
            });

            // Footer
            const pageCount = doc.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150, 150, 150);
                doc.text(
                    `DataWeave Report - Page ${i} of ${pageCount}`,
                    pageWidth / 2,
                    doc.internal.pageSize.getHeight() - 10,
                    { align: 'center' }
                );
            }

            // Save
            doc.save(`${fileName.replace('.csv', '')}_profiling_report.pdf`);
            setGenerated(true);
        } catch (error) {
            console.error('Error generating PDF:', error);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="modal-overlay animate-fade-in" onClick={onClose}>
            <div className="modal-content w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[rgb(var(--border-color))]">
                    <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-[rgb(var(--accent))]" />
                        <h3 className="font-semibold text-[rgb(var(--text-primary))]">Data Profiling Report</h3>
                    </div>
                    <button onClick={onClose} className="btn-icon">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {generated ? (
                        <div className="text-center">
                            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                            <h4 className="text-lg font-medium text-[rgb(var(--text-primary))] mb-2">Report Generated!</h4>
                            <p className="text-[rgb(var(--text-secondary))] mb-4">
                                Your PDF report has been downloaded.
                            </p>
                            <button onClick={onClose} className="btn btn-primary">
                                Close
                            </button>
                        </div>
                    ) : (
                        <>
                            <p className="text-[rgb(var(--text-secondary))] mb-6">
                                Generate a comprehensive PDF report with data quality metrics, column statistics, and insights.
                            </p>

                            <div className="space-y-3 mb-6 p-4 rounded-lg bg-[rgb(var(--bg-secondary))]">
                                <div className="flex justify-between text-sm">
                                    <span className="text-[rgb(var(--text-secondary))]">File:</span>
                                    <span className="text-[rgb(var(--text-primary))] font-medium">{fileName}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-[rgb(var(--text-secondary))]">Rows:</span>
                                    <span className="text-[rgb(var(--text-primary))] font-medium">{data.length.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-[rgb(var(--text-secondary))]">Columns:</span>
                                    <span className="text-[rgb(var(--text-primary))] font-medium">{columns.length}</span>
                                </div>
                            </div>

                            <h4 className="text-sm font-medium text-[rgb(var(--text-primary))] mb-2">Report Includes:</h4>
                            <ul className="text-sm text-[rgb(var(--text-secondary))] space-y-1 mb-6">
                                <li>✓ Data quality summary</li>
                                <li>✓ Column statistics (type, missing, unique, mean, min, max)</li>
                                <li>✓ Sample data preview</li>
                                <li>✓ Key insights and recommendations</li>
                            </ul>

                            <button
                                onClick={generateReport}
                                disabled={generating}
                                className="btn btn-primary w-full"
                            >
                                {generating ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-4 h-4" />
                                        Generate PDF Report
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
