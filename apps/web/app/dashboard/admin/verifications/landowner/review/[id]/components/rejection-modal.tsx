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
                    <DialogTitle className="text-2xl font-bold">Reject Verification</DialogTitle>
                    <DialogDescription className="text-base">
                        The landowner will be notified. Please select the specific reasons for rejecting their identity/business verification.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-8 py-6">
                    <div className="space-y-4">
                        <Label className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground">Rejection Reasons</Label>
                        <div className="grid gap-3">
                            <RejectionCheckbox
                                id="reason-id"
                                label="Identity document is missing, expired, or blurry"
                                checked={rejectionReasons.includes('id')}
                                onCheckedChange={() => toggleReason('id')}
                            />
                            <RejectionCheckbox
                                id="reason-business"
                                label="Proof of Business / Entity is invalid or not found"
                                checked={rejectionReasons.includes('business')}
                                onCheckedChange={() => toggleReason('business')}
                            />
                            <RejectionCheckbox
                                id="reason-info"
                                label="Provided information does not match legal documents"
                                checked={rejectionReasons.includes('info')}
                                onCheckedChange={() => toggleReason('info')}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Label htmlFor="custom-note" className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground">Admin Notes</Label>
                        <Textarea
                            id="custom-note"
                            placeholder="E.g., Please provide a higher-resolution scan of your VAT certificate..."
                            className="h-32 bg-muted/30 focus-visible:ring-red-500 border-none rounded-xl"
                            value={customNote}
                            onChange={(e) => setCustomNote(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter className="gap-3">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button
                        onClick={() => onConfirm(rejectionReasons, customNote)}
                        variant="destructive"
                        disabled={rejectionReasons.length === 0 && !customNote.trim()}
                    >
                        Confirm Rejection
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
