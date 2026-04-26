import React from 'react';

export const LabelValue = ({
    label,
    value,
    editingNode,
    isEditing,
}: {
    label: string;
    value: string | React.ReactNode;
    editingNode?: React.ReactNode;
    isEditing?: boolean;
}) => (
    <div className="mb-4 last:mb-0">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
        {isEditing && editingNode ? (
            editingNode
        ) : (
            <p className="text-base text-slate-800 font-semibold leading-snug">{value || '—'}</p>
        )}
    </div>
);
