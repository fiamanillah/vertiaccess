'use client';

import * as React from 'react';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@workspace/ui/components/tabs';
import { Badge } from '@workspace/ui/components/badge';
import { NeedsReviewTable } from './components/needs-review-table';
import { ApprovedLandownersTable } from './components/approved-landowners-table';
import { RejectedLandownersTable } from './components/rejected-landowners-table';

export default function LandownerVerificationsPage() {
    return (
        <div className="flex flex-col gap-8 p-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Landowner Verification Queue</h1>
                <p className="text-muted-foreground">Approve or reject landowner registration requests.</p>
            </div>

            <Tabs defaultValue="needs-review" className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-w-md mb-8">
                    <TabsTrigger value="needs-review" className="relative">
                        Needs Review
                        <Badge className="ml-2 bg-primary text-primary-foreground h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px]">2</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="approved">Approved</TabsTrigger>
                    <TabsTrigger value="rejected">Rejected</TabsTrigger>
                </TabsList>

                <TabsContent value="needs-review">
                    <NeedsReviewTable />
                </TabsContent>

                <TabsContent value="approved">
                    <ApprovedLandownersTable />
                </TabsContent>

                <TabsContent value="rejected">
                    <RejectedLandownersTable />
                </TabsContent>
            </Tabs>
        </div>
    );
}
