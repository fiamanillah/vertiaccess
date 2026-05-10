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
            className="w-full "
        >
            <TabsList className="w-full">
                <TabsTrigger value="national_id">
                    <span className="text-xs font-semibold">National ID Card</span>
                </TabsTrigger>
                <TabsTrigger value="passport">
                    <span className="text-xs font-semibold">Passport</span>
                </TabsTrigger>
            </TabsList>
        </Tabs>
    );
}
