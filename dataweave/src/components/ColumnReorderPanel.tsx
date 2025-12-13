'use client';

import React, { useState } from 'react';
import { X, GripVertical, Check } from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ColumnInfo } from '@/lib/store';

interface ColumnReorderPanelProps {
    columns: ColumnInfo[];
    onReorder: (newOrder: string[]) => void;
    onClose: () => void;
}

interface SortableItemProps {
    id: string;
    column: ColumnInfo;
}

function SortableItem({ id, column }: SortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`
        flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all
        ${isDragging
                    ? 'bg-[rgb(var(--accent))]/10 border-[rgb(var(--accent))] shadow-lg z-10'
                    : 'bg-[rgb(var(--bg-primary))] border-[rgb(var(--border-color))] hover:border-[rgb(var(--accent))]/50'
                }
      `}
        >
            <button
                {...attributes}
                {...listeners}
                className="p-1 cursor-grab active:cursor-grabbing text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]"
            >
                <GripVertical className="w-4 h-4" />
            </button>
            <span className="flex-1 text-sm text-[rgb(var(--text-primary))]">{column.name}</span>
            <span className={`text-xs px-2 py-0.5 rounded ${column.type === 'numeric'
                    ? 'bg-blue-500/10 text-blue-600'
                    : 'bg-green-500/10 text-green-600'
                }`}>
                {column.type}
            </span>
        </div>
    );
}

export function ColumnReorderPanel({ columns, onReorder, onClose }: ColumnReorderPanelProps) {
    const [items, setItems] = useState(columns.map((c) => c.name));

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setItems((items) => {
                const oldIndex = items.indexOf(active.id as string);
                const newIndex = items.indexOf(over.id as string);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleApply = () => {
        onReorder(items);
        onClose();
    };

    const columnMap = new Map(columns.map((c) => [c.name, c]));

    return (
        <div className="modal-overlay animate-fade-in" onClick={onClose}>
            <div className="modal-content w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[rgb(var(--border-color))]">
                    <div className="flex items-center gap-3">
                        <GripVertical className="w-5 h-5 text-[rgb(var(--accent))]" />
                        <h3 className="font-semibold text-[rgb(var(--text-primary))]">Reorder Columns</h3>
                    </div>
                    <button onClick={onClose} className="btn-icon">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 max-h-96 overflow-auto">
                    <p className="text-sm text-[rgb(var(--text-secondary))] mb-4">
                        Drag and drop columns to reorder them in the data table.
                    </p>

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext items={items} strategy={verticalListSortingStrategy}>
                            <div className="space-y-2">
                                {items.map((id) => {
                                    const column = columnMap.get(id);
                                    if (!column) return null;
                                    return <SortableItem key={id} id={id} column={column} />;
                                })}
                            </div>
                        </SortableContext>
                    </DndContext>
                </div>

                {/* Footer */}
                <div className="flex gap-2 p-4 border-t border-[rgb(var(--border-color))]">
                    <button onClick={onClose} className="btn btn-secondary flex-1">
                        Cancel
                    </button>
                    <button onClick={handleApply} className="btn btn-primary flex-1">
                        <Check className="w-4 h-4" />
                        Apply Order
                    </button>
                </div>
            </div>
        </div>
    );
}
