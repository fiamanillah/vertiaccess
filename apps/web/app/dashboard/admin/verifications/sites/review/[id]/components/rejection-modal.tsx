'use client';

import * as React from 'react';
import { AlertTriangle } from 'lucide-react';
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
}

export function RejectionModal({ isOpen, onClose, onConfirm }: RejectionModalProps) {
    const [rejectionReasons, setRejectionReasons] = React.useState<string[]>([]);
    const [customNote, setCustomNote] = React.useState('');

    const toggleReason = (reason: string) => {
        setRejectionReasons(prev =>
            prev.includes(reason) ? prev.filter(r => r !== reason) : [...prev, reason]
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] border-destructive/20 bg-background/95 backdrop-blur-2xl">
                <DialogHeader>
                    <div className="h-14 w-14 rounded-2xl bg-red-50 flex items-center justify-center mb-4 border border-red-100">
                        <AlertTriangle className="h-7 w-7 text-red-600" />
                    </div>
                    <DialogTitle className="text-2xl font-bold">Reject Application</DialogTitle>
                    <DialogDescription className="text-base">
                        The landowner will be notified and their site will be unlocked for corrections based on your feedback.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-8 py-6">
                    <div className="space-y-4">
                        <Label className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground">Select Rejection Reasons</Label>
                        <div className="grid gap-3">
                            <RejectionCheckbox
                                id="reason-map"
                                label="Map boundary is unsafe / overlaps restricted area"
                                checked={rejectionReasons.includes('map')}
                                onCheckedChange={() => toggleReason('map')}
                            />
                            <RejectionCheckbox
                                id="reason-docs"
                                label="Proof of Ownership document is missing or illegible"
                                checked={rejectionReasons.includes('docs')}
                                onCheckedChange={() => toggleReason('docs')}
                            />
                            <RejectionCheckbox
                                id="reason-policy"
                                label="Pricing or Policy details are unclear"
                                checked={rejectionReasons.includes('policy')}
                                onCheckedChange={() => toggleReason('policy')}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Label htmlFor="custom-note" className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground">Custom Instructions</Label>
                        <Textarea
                            id="custom-note"
                            placeholder="E.g., Please redraw your boundary 10 meters away from the main road..."
                            className="h-32 bg-muted/30 focus-visible:ring-red-500 border-none rounded-xl"
                            value={customNote}
                            onChange={(e) => setCustomNote(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter className="gap-3">
                    <Button variant="ghost" onClick={onClose} >Cancel</Button>
                    <Button
                        onClick={() => onConfirm(rejectionReasons, customNote)}
                        variant="destructive"
                        disabled={rejectionReasons.length === 0 && !customNote.trim()}
                    >
                        Submit Rejection
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
