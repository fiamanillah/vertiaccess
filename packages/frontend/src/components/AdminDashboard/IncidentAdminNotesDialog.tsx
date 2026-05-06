import { useState, useEffect } from 'react';
import { Modal } from '../Modal';
import { toast } from 'sonner';

interface Props {
    isOpen: boolean;
    initialNote?: string;
    incidentId: string | null;
    onClose: () => void;
    onSave: (incidentId: string, note: string) => Promise<void>;
}

export function IncidentAdminNotesDialog({
    isOpen,
    initialNote,
    incidentId,
    onClose,
    onSave,
}: Props) {
    const [note, setNote] = useState(initialNote || '');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setNote(initialNote || '');
    }, [initialNote]);

    const handleSave = async () => {
        if (!incidentId) return;
        setSaving(true);
        try {
            await onSave(incidentId, note);
            toast.success('Admin note saved');
            onClose();
        } catch (err: any) {
            toast.error(err?.message || 'Failed to save admin note');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Admin Investigation Note">
            <div className="space-y-4">
                <p className="text-sm text-slate-500">This note is visible to admins only.</p>
                <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    className="w-full min-h-35 p-3 border border-slate-200 rounded-lg outline-none text-sm"
                    placeholder="Enter admin investigation notes"
                />
                <div className="flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 h-9 rounded-lg bg-white border border-slate-200 text-slate-600"
                        disabled={saving}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 h-9 rounded-lg bg-blue-600 text-white font-black"
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Save Note'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
