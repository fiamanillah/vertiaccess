'use client';

import * as React from 'react';
import { 
    User, 
    Mail, 
    ShieldCheck, 
    Award,
    FileCheck,
    Briefcase
} from 'lucide-react';
import { DetailBox } from './ui-helpers';

interface OperatorContextColumnProps {
    verification: any;
}

export function OperatorContextColumn({ verification }: OperatorContextColumnProps) {
    return (
        <div className="flex-1 overflow-y-auto p-8 space-y-12 bg-background custom-scrollbar">
            {/* 1. Pilot / Company Identity */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 border-b pb-4">
                    <div className="p-2 rounded-md bg-muted">
                        <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <h2 className="text-xl font-bold tracking-tight">Operator Profile</h2>
                </div>
                <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                    <DetailBox label="Full Name / Entity" value={verification.userName} icon={Briefcase} />
                    <DetailBox label="Email Address" value={verification.userEmail} icon={Mail} />
                    <DetailBox label="Organisation" value={verification.userOrganisation || 'Not Provided'} icon={Briefcase} />
                    <DetailBox label="CAA Operator ID" value={verification.flyerId || 'N/A'} isHighlight icon={Award} />
                </div>
            </div>

            {/* 2. Verification Metadata */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 border-b pb-4">
                    <div className="p-2 rounded-md bg-muted">
                        <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <h2 className="text-xl font-bold tracking-tight">Request Details</h2>
                </div>
                <div className="grid grid-cols-2 gap-x-12 gap-y-8 p-8 bg-muted/5 rounded-2xl border border-border/40">
                    <DetailBox label="Submission Date" value={new Date(verification.createdAt).toLocaleDateString()} icon={FileCheck} />
                    <DetailBox label="Status" value={verification.status} isBadge badgeVariant={verification.status === 'PENDING' ? 'amber' : 'emerald'} />
                </div>
            </div>
        </div>
    );
}
