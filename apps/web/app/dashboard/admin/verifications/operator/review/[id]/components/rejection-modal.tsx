'use client';

import * as React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@workspace/ui/components/dialog';
import { Textarea } from '@workspace/ui/components/textarea';
import { Label } from '@workspace/ui/components/label';
import { RejectionCheckbox } from './ui-helpers';

interface RejectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reasons: string[], customNote: string) => void;
    isLoading?: boolean;
}

const REJECTION_LABELS: Record<string, string> = {
    license: 'CAA Operator ID is expired or cannot be verified',
    insurance: 'Public liability insurance is insufficient or expired',
    id: 'Pilot identity verification failed or is illegible',
};

export function RejectionModal({ isOpen, onClose, onConfirm, isLoading }: RejectionModalProps) {
    const [rejectionReasons, setRejectionReasons] = React.useState<string[]>([]);
    const [customNote, setCustomNote] = React.useState('');

    const toggleReason = (reason: string) => {
        setRejectionReasons(prev =>
            prev.includes(reason) ? prev.filter(r => r !== reason) : [...prev, reason]
        );
    };

    const handleConfirm = () => {
        const mappedReasons = rejectionReasons.map(r => REJECTION_LABELS[r] || r);
        onConfirm(mappedReasons, customNote);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        Reject Operator License
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        The drone operator will be notified. Please specify why their licensing or identity documents were rejected.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground">Rejection Reasons</Label>
                        <div className="grid gap-2">
                            <RejectionCheckbox
                                id="reason-license"
                                label="CAA Operator ID is expired or cannot be verified"
                                checked={rejectionReasons.includes('license')}
                                onCheckedChange={() => toggleReason('license')}
                                disabled={isLoading}
                            />
                            <RejectionCheckbox
                                id="reason-insurance"
                                label="Public liability insurance is insufficient or expired"
                                checked={rejectionReasons.includes('insurance')}
                                onCheckedChange={() => toggleReason('insurance')}
                                disabled={isLoading}
                            />
                            <RejectionCheckbox
                                id="reason-id"
                                label="Pilot identity verification failed or is illegible"
                                checked={rejectionReasons.includes('id')}
                                onCheckedChange={() => toggleReason('id')}
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="custom-note" className="text-xs font-semibold text-muted-foreground">Admin Notes</Label>
                        <Textarea
                            id="custom-note"
                            placeholder="E.g., Your insurance certificate must show a minimum coverage of £5M..."
                            className="min-h-[80px] resize-none"
                            value={customNote}
                            onChange={(e) => setCustomNote(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} disabled={isLoading}>Cancel</Button>
                    <Button
                        onClick={handleConfirm}
                        variant="destructive"
                        disabled={isLoading || (rejectionReasons.length === 0 && !customNote.trim())}
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm Rejection
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
