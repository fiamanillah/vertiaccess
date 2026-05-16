'use client';

import * as React from 'react';
import { 
    User, 
    Mail, 
    Building2, 
    Calendar,
    ShieldCheck
} from 'lucide-react';
import { DetailBox } from './ui-helpers';

interface LandownerContextColumnProps {
    verification: any;
}

export function LandownerContextColumn({ verification }: LandownerContextColumnProps) {
    return (
        <div className="flex-1 overflow-y-auto p-8 space-y-12 bg-background custom-scrollbar">
            {/* 1. Identity */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 border-b pb-4">
                    <div className="p-2 rounded-md bg-muted">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <h2 className="text-xl font-bold tracking-tight">Identity Details</h2>
                </div>
                <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                    <DetailBox label="Full Name" value={verification.userName || 'Unknown'} icon={User} />
                    <DetailBox label="Company / Estate" value={verification.userOrganisation || 'Not Provided'} icon={Building2} />
                    <DetailBox label="Email Address" value={verification.userEmail} icon={Mail} />
                </div>
            </div>

            {/* 2. Request Details */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 border-b pb-4">
                    <div className="p-2 rounded-md bg-muted">
                        <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <h2 className="text-xl font-bold tracking-tight">Request Details</h2>
                </div>
                <div className="grid grid-cols-2 gap-x-12 gap-y-8 p-8 bg-muted/5 rounded-2xl border border-border/40">
                    <DetailBox label="Submission Date" value={new Date(verification.createdAt).toLocaleDateString()} icon={Calendar} />
                    <DetailBox label="Status" value={verification.status} isBadge badgeVariant={verification.status === 'PENDING' ? 'amber' : 'emerald'} />
                </div>
            </div>
        </div>
    );
}
