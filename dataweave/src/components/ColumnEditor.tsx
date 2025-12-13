'use client';

import React, { useState } from 'react';
import { Pencil, Trash2, X, Check, GripVertical } from 'lucide-react';
import { ColumnInfo } from '@/lib/store';

interface ColumnEditorProps {
    column: ColumnInfo;
    onRename: (oldName: string, newName: string) => void;
    onDelete: (columnName: string) => void;
    isGenerated?: boolean;
}

export function ColumnEditor({ column, onRename, onDelete, isGenerated }: ColumnEditorProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState(column.name);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleRename = () => {
        if (newName.trim() && newName !== column.name) {
            onRename(column.name, newName.trim());
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleRename();
        } else if (e.key === 'Escape') {
            setNewName(column.name);
            setIsEditing(false);
        }
    };

    const handleDelete = () => {
        onDelete(column.name);
        setShowDeleteConfirm(false);
    };

    if (isEditing) {
        return (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] dark:bg-white/[0.02]">
                <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    className="flex-1 px-2 py-1 text-sm bg-white/[0.05] dark:bg-white/[0.05] border border-white/10 dark:border-white/10 rounded text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500/50"
                />
                <button
                    onClick={handleRename}
                    className="p-1.5 rounded-md bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                    title="Save"
                >
                    <Check className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={() => {
                        setNewName(column.name);
                        setIsEditing(false);
                    }}
                    className="p-1.5 rounded-md bg-white/[0.05] text-slate-600 dark:text-white/50 hover:bg-white/[0.1] transition-colors"
                    title="Cancel"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
        );
    }

    if (showDeleteConfirm) {
        return (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                <span className="flex-1 text-sm text-red-400">Delete &quot;{column.name}&quot;?</span>
                <button
                    onClick={handleDelete}
                    className="px-2 py-1 text-xs rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                    Delete
                </button>
                <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-2 py-1 text-xs rounded-md bg-white/[0.05] text-slate-600 dark:text-white/50 hover:bg-white/[0.1] transition-colors"
                >
                    Cancel
                </button>
            </div>
        );
    }

    return (
        <div className="group flex items-center gap-2 p-2 rounded-lg hover:bg-white/[0.02] dark:hover:bg-white/[0.02] transition-colors">
            <GripVertical className="w-4 h-4 text-slate-400 dark:text-white/20 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
            <span className={`flex-1 text-sm truncate ${isGenerated ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-700 dark:text-white/80'}`}>
                {column.name}
            </span>
            <span className="text-xs text-slate-500 dark:text-white/40 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/[0.05]">
                {column.type}
            </span>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => setIsEditing(true)}
                    className="p-1.5 rounded-md text-slate-500 dark:text-white/40 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                    title="Rename"
                >
                    <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-1.5 rounded-md text-slate-500 dark:text-white/40 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Delete"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}
