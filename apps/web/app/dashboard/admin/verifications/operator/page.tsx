'use client';

import * as React from 'react';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@workspace/ui/components/tabs';
import { Badge } from '@workspace/ui/components/badge';
import { adminService, type VerificationRequest } from '@/services/admin.service';
import { toast } from 'sonner';
import { Loader2, RefreshCcw } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { NeedsReviewTable } from './components/needs-review-table';
import { ApprovedOperatorsTable } from './components/approved-operators-table';
import { RejectedOperatorsTable } from './components/rejected-operators-table';

export default function OperatorVerificationsPage() {
    const [verifications, setVerifications] = React.useState<VerificationRequest[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    const fetchVerifications = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await adminService.listVerifications();
            if (response.success) {
                const operators = response.data.filter(v => v.userRole === 'operator');
                setVerifications(operators);
            }
        } catch (error) {
            console.error('Failed to fetch verifications:', error);
            toast.error('Failed to load verification queue');
        } finally {
            setIsLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchVerifications();
    }, [fetchVerifications]);

    const needsReview = verifications.filter(v => v.status === 'PENDING');
    const approved = verifications.filter(v => v.status === 'APPROVED');
    const rejected = verifications.filter(v => v.status === 'REJECTED');

    return (
        <div className="flex flex-col gap-8 p-8">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Drone Operator Verification Queue</h1>
                    <p className="text-muted-foreground">Approve or reject drone operator licensing requests.</p>
                </div>
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                        setIsLoading(true);
                        fetchVerifications();
                    }} 
                    disabled={isLoading}
                    className="gap-2"
                >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                    Refresh
                </Button>
            </div>

            <Tabs defaultValue="needs-review" className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-w-md mb-8">
                    <TabsTrigger value="needs-review" className="relative">
                        Needs Review
                        {needsReview.length > 0 && (
                            <Badge className="ml-2 bg-primary text-primary-foreground h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px]">
                                {needsReview.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="approved">
                        Approved
                        {approved.length > 0 && (
                            <Badge variant="outline" className="ml-2 h-5 min-w-5 px-1 flex items-center justify-center rounded-full text-[10px]">
                                {approved.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="rejected">
                        Rejected
                        {rejected.length > 0 && (
                            <Badge variant="outline" className="ml-2 h-5 min-w-5 px-1 flex items-center justify-center rounded-full text-[10px]">
                                {rejected.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="needs-review">
                    <NeedsReviewTable data={needsReview} isLoading={isLoading} />
                </TabsContent>

                <TabsContent value="approved">
                    <ApprovedOperatorsTable data={approved} isLoading={isLoading} />
                </TabsContent>

                <TabsContent value="rejected">
                    <RejectedOperatorsTable data={rejected} isLoading={isLoading} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
