'use client';

import * as React from 'react';
import { 
    User, 
    Mail, 
    Phone, 
    Plane, 
    ShieldCheck, 
    Award,
    FileCheck,
    Briefcase
} from 'lucide-react';
import { DetailBox } from './ui-helpers';

interface OperatorContextColumnProps {
    operator: any;
}

export function OperatorContextColumn({ operator }: OperatorContextColumnProps) {
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
                    <DetailBox label="Full Name / Entity" value={operator.name} icon={Briefcase} />
                    <DetailBox label="Operator Type" value={operator.operatorType} isBadge badgeVariant="indigo" />
                    <DetailBox label="Email Address" value={operator.email} icon={Mail} />
                    <DetailBox label="Contact Phone" value="+44 7800 112233" icon={Phone} />
                </div>
            </div>

            {/* 2. Regulatory Compliance */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 border-b pb-4">
                    <div className="p-2 rounded-md bg-muted">
                        <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <h2 className="text-xl font-bold tracking-tight">Regulatory Status</h2>
                </div>
                <div className="grid grid-cols-2 gap-x-12 gap-y-8 p-8 bg-muted/5 rounded-2xl border border-border/40">
                    <DetailBox label="CAA Operator ID" value={operator.licenseId} isHighlight icon={Award} />
                    <DetailBox label="License Expiry" value="Dec 2025" icon={FileCheck} />
                    <DetailBox label="Insurance Status" value="Fully Insured" icon={ShieldCheck} />
                    <DetailBox label="Insurance Provider" value="CoverDrone UK" icon={Briefcase} />
                </div>
            </div>

            {/* 3. Fleet & Operations */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 border-b pb-4">
                    <div className="p-2 rounded-md bg-muted">
                        <Plane className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <h2 className="text-xl font-bold tracking-tight">Operational Context</h2>
                </div>
                <div className="p-8 rounded-2xl bg-muted/10 border border-border/50 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary/20" />
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-3 block">Operational Bio</span>
                    <p className="text-base leading-relaxed text-foreground/80 italic">
                        "Specializing in heavy-lift logistics and urban aerial survey operations. Our fleet is equipped with the latest ADS-B transponders and autonomous flight management systems for high-density airspace."
                    </p>
                </div>
            </div>
        </div>
    );
}
