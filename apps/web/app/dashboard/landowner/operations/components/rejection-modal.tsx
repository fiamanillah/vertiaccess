'use client';

import * as React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@workspace/ui/components/dialog';
import { Button } from '@workspace/ui/components/button';
import { Textarea } from '@workspace/ui/components/textarea';
import { Checkbox } from '@workspace/ui/components/checkbox';
import { Label } from '@workspace/ui/components/label';
import { AlertCircle } from 'lucide-react';

interface RejectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
    isSubmitting?: boolean;
}

export function RejectionModal({
    isOpen,
    onClose,
    onConfirm,
    isSubmitting = false,
}: RejectionModalProps) {
    const [reason, setReason] = React.useState('');
    const [selectedQuickReasons, setSelectedQuickReasons] = React.useState<string[]>([]);

    const quickReasons = [
        "Schedule conflict",
        "Incomplete mission details",
        "Site maintenance",
        "Safety concerns",
        "Restricted airspace event"
    ];

    const toggleReason = (r: string) => {
        setSelectedQuickReasons(prev => 
            prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]
        );
    };

    const handleConfirm = () => {
        const fullReason = [
            ...selectedQuickReasons,
            reason.trim()
        ].filter(Boolean).join('; ');
        
        onConfirm(fullReason || "No specific reason provided.");
    };

    React.useEffect(() => {
        if (!isOpen) {
            setReason('');
            setSelectedQuickReasons([]);
        }
    }, [isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="flex items-center gap-2 text-destructive mb-2">
                        <AlertCircle className="h-5 w-5" />
                        <DialogTitle>Reject Booking Request</DialogTitle>
                    </div>
                    <DialogDescription className="text-sm">
                        Please provide a reason for declining this request. This will be shared with the operator.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-2">
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Quick Select Reasons</Label>
                        <div className="grid grid-cols-1 gap-2">
                            {quickReasons.map((r) => (
                                <div key={r} className="flex items-center space-x-2 bg-muted/30 p-2 rounded-lg border border-border/40 hover:bg-muted/50 transition-colors">
                                    <Checkbox 
                                        id={`reason-${r}`} 
                                        checked={selectedQuickReasons.includes(r)}
                                        onCheckedChange={() => toggleReason(r)}
                                    />
                                    <Label 
                                        htmlFor={`reason-${r}`}
                                        className="text-xs font-medium cursor-pointer flex-1"
                                    >
                                        {r}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Custom Notes</Label>
                        <Textarea
                            placeholder="Add any additional context or specific instructions..."
                            className="min-h-[100px] resize-none text-sm"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={!reason.trim() || isSubmitting}
                        className="font-bold"
                    >
                        {isSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
