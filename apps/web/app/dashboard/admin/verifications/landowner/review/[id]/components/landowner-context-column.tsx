'use client';

import * as React from 'react';
import { 
    User, 
    Mail, 
    Phone, 
    Building2, 
    MapPin, 
    Calendar,
    FileText,
    ShieldCheck
} from 'lucide-react';
import { DetailBox } from './ui-helpers';

interface LandownerContextColumnProps {
    landowner: any;
}

export function LandownerContextColumn({ landowner }: LandownerContextColumnProps) {
    return (
        <div className="flex-1 overflow-y-auto p-8 space-y-12 bg-background custom-scrollbar">
            {/* 1. Personal / Business Identity */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 border-b pb-4">
                    <div className="p-2 rounded-md bg-muted">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <h2 className="text-xl font-bold tracking-tight">Identity Details</h2>
                </div>
                <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                    <DetailBox label="Full Name" value={landowner.name} icon={User} />
                    <DetailBox label="Company / Estate" value={landowner.company} icon={Building2} />
                    <DetailBox label="Email Address" value={landowner.email} icon={Mail} />
                    <DetailBox label="Phone Number" value={landowner.phone} icon={Phone} />
                </div>
            </div>

            {/* 2. Business Details */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 border-b pb-4">
                    <div className="p-2 rounded-md bg-muted">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <h2 className="text-xl font-bold tracking-tight">Business Verification</h2>
                </div>
                <div className="grid grid-cols-2 gap-x-12 gap-y-8 p-8 bg-muted/5 rounded-2xl border border-border/40">
                    <DetailBox label="Verification Type" value={landowner.documentType} isBadge badgeVariant="indigo" />
                    <DetailBox label="Registered Since" value="May 2024" icon={Calendar} />
                    <DetailBox label="Tax / VAT ID" value="GB 123 4567 89" icon={ShieldCheck} />
                    <DetailBox label="Registered Address" value="12 High Street, Surrey, UK" icon={MapPin} />
                </div>
            </div>

            {/* 3. About the Estate */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 border-b pb-4">
                    <div className="p-2 rounded-md bg-muted">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <h2 className="text-xl font-bold tracking-tight">About the Estate</h2>
                </div>
                <div className="p-8 rounded-2xl bg-muted/10 border border-border/50 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary/20" />
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-3 block">Landowner Bio</span>
                    <p className="text-base leading-relaxed text-foreground/80 italic">
                        "Professional estate management firm specializing in agricultural land development and conservation. We provide secured landing areas for emergency and commercial drone delivery services."
                    </p>
                </div>
            </div>
        </div>
    );
}
