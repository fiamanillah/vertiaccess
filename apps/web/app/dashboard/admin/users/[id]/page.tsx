'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@workspace/ui/components/button';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { adminService } from '@/services/admin.service';
import UserDetailsCard from './components/user-details-card';
import UserActionsCard from './components/user-actions-card';
import { ArrowLeft, Loader2, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  const fetchUserDetails = React.useCallback(async () => {
    if (!params.id) return;
    setIsLoading(true);
    try {
      const res = await adminService.getUser(params.id);
      if (res.success) {
        setUser(res.data);
      } else {
        toast.error(res.message || 'Failed to fetch user details');
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred while loading user profile');
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  React.useEffect(() => {
    fetchUserDetails();
  }, [fetchUserDetails, refreshTrigger]);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  if (isLoading && !user) {
    return (
      <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="flex flex-col gap-6">
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-[250px] w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center min-h-[50vh] gap-4">
        <div className="bg-muted p-4 rounded-full">
          <UserIcon className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold">User Not Found</h2>
        <p className="text-muted-foreground max-w-sm">
          The requested user account could not be found or has been permanently deactivated.
        </p>
        <Button onClick={() => router.push('/dashboard/admin/users')} variant="outline">
          Back to User Management
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto">
      {/* Header and Back Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard/admin/users')}
            className="flex items-center gap-1.5 border-border/60 hover:bg-muted font-semibold"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <div className="space-y-0.5">
            <h1 className="text-2xl font-bold tracking-tight">Manage {user.displayName}</h1>
            <p className="text-xs text-muted-foreground">
              Review profile fields, update system status, and configure billing bypasses.
            </p>
          </div>
        </div>
      </div>

      {/* Stack of details and operations */}
      <div className="flex flex-col gap-6">
        <UserDetailsCard user={user} />
        <UserActionsCard user={user} onActionComplete={handleRefresh} />
      </div>
    </div>
  );
}
