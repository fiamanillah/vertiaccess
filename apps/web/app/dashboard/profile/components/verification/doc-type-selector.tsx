'use client';

import { Tabs, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';

interface DocTypeSelectorProps {
    selected: 'national_id' | 'passport';
    onSelect: (type: 'national_id' | 'passport') => void;
}

export function DocTypeSelector({ selected, onSelect }: DocTypeSelectorProps) {
    return (
        <Tabs
            value={selected}
            onValueChange={value => onSelect(value as 'national_id' | 'passport')}
            className="w-full bg-muted/30 p-1 rounded-lg"
        >
            <TabsList className="w-full bg-transparent border-none">
                <TabsTrigger value="national_id" className="flex-1 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all">
                    <span className="text-xs font-semibold">National ID Card</span>
                </TabsTrigger>
                <TabsTrigger value="passport" className="flex-1 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all">
                    <span className="text-xs font-semibold">Passport</span>
                </TabsTrigger>
            </TabsList>
        </Tabs>
    );
}
