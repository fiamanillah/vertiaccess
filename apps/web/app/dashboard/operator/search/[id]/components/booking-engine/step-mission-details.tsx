'use client';

import * as React from 'react';
import { 
    Plane, 
    ShieldCheck, 
    Monitor, 
    Scale, 
    FileType, 
    Fingerprint, 
    Navigation, 
    Info 
} from 'lucide-react';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Textarea } from '@workspace/ui/components/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@workspace/ui/components/select';
import { MissionData } from './types';

interface StepMissionDetailsProps {
    missionData: MissionData;
    setMissionData: React.Dispatch<React.SetStateAction<MissionData>>;
}

export function StepMissionDetails({ missionData, setMissionData }: StepMissionDetailsProps) {
    const updateMissionData = (field: keyof MissionData, value: string) => {
        setMissionData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="space-y-3.5">
            <div className="flex items-center justify-between">
                <p className="text-sm font-bold flex items-center gap-2">
                    <Plane className="h-4 w-4 text-primary" />
                    Flight Mission
                </p>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-500/5 px-2 py-0.5 rounded-full border border-emerald-500/10">
                    <ShieldCheck className="h-3 w-3" />
                    COMPLIANT
                </div>
            </div>

            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Drone Model</Label>
                        <div className="relative">
                            <Monitor className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                                placeholder="DJI Mavic 3..."
                                className="pl-9 h-9 bg-muted/30 border-primary/10 focus-visible:ring-primary/20 text-xs"
                                value={missionData.droneModel}
                                onChange={(e) => updateMissionData('droneModel', e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Weight Class</Label>
                        <Select
                            value={missionData.weightClass}
                            onValueChange={(val) => updateMissionData('weightClass', val)}
                        >
                            <SelectTrigger className='w-full h-9 text-xs' >
                                <div className="flex items-center gap-2">
                                    <Scale className="h-3.5 w-3.5 text-muted-foreground" />
                                    <SelectValue placeholder="Select Class" />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="c0">C0 (&lt;250g)</SelectItem>
                                <SelectItem value="c1">C1 (250g-900g)</SelectItem>
                                <SelectItem value="c2">C2 (900g-4kg)</SelectItem>
                                <SelectItem value="c3">C3 (4kg-25kg)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Mission Intent</Label>
                    <div className="relative">
                        <FileType className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                        <Textarea
                            placeholder="Describe your flight purpose, path, and safety precautions..."
                            className="pl-9 min-h-[65px] bg-muted/30 border-primary/10 focus-visible:ring-primary/20 resize-none pt-2 text-xs"
                            value={missionData.missionIntent}
                            onChange={(e) => updateMissionData('missionIntent', e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Flyer ID</Label>
                        <div className="relative">
                            <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                                placeholder="FLY-XXXXX"
                                className="pl-9 h-9 bg-muted/30 border-primary/10 focus-visible:ring-primary/20 text-xs"
                                value={missionData.flyerId}
                                onChange={(e) => updateMissionData('flyerId', e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Operator ID</Label>
                        <div className="relative">
                            <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                                placeholder="OP-XXXXX"
                                className="pl-9 h-9 bg-muted/30 border-primary/10 focus-visible:ring-primary/20 text-xs"
                                value={missionData.operatorId}
                                onChange={(e) => updateMissionData('operatorId', e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground bg-muted/20 p-2.5 border border-border/50 rounded-lg">
                <Info className="h-3.5 w-3.5 text-primary" />
                Ensuring safety and regulatory compliance for all flights.
            </div>
        </div>
    );
}
