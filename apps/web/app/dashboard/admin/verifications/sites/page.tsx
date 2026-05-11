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
import { ApprovedSitesTable } from './components/approved-sites-table';
import { RejectedSitesTable } from './components/rejected-sites-table';

export default function AdminSitesVerificationPage() {
    return (
        <div className="flex flex-col gap-8 p-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Site Verification Queue</h1>
                <p className="text-muted-foreground">Manage and verify landing sites across the network.</p>
            </div>

            <Tabs defaultValue="needs-review" className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-w-md mb-8">
                    <TabsTrigger value="needs-review" className="relative">
                        Needs Review
                        <Badge className="ml-2 bg-primary text-primary-foreground h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px]">3</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="approved">Approved Sites</TabsTrigger>
                    <TabsTrigger value="rejected">Rejected</TabsTrigger>
                </TabsList>

                <TabsContent value="needs-review">
                    <NeedsReviewTable />
                </TabsContent>

                <TabsContent value="approved">
                    <ApprovedSitesTable />
                </TabsContent>

                <TabsContent value="rejected">
                    <RejectedSitesTable />
                </TabsContent>
            </Tabs>
        </div>
    );
}
