'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import { BookingTable } from '@/app/dashboard/operator/bookings/components/booking-table';
import { bookingService } from '@/services/booking.service';
import { Booking } from '@/app/dashboard/operator/bookings/types';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface SiteOperationsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  site: any | null;
  assetManagerId: string;
}

export function SiteOperationsDialog({
  isOpen,
  onClose,
  site,
  assetManagerId,
}: SiteOperationsDialogProps) {
  const router = useRouter();
  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const fetchBookings = React.useCallback(async () => {
    if (!site?.id || !assetManagerId) return;
    setIsLoading(true);
    try {
      const res = await bookingService.listAssetManagerBookings({
        assetManagerId,
        siteId: site.id,
        limit: 100,
      });
      if (res.success && Array.isArray(res.data)) {
        setBookings(res.data as unknown as Booking[]);
      } else {
        setBookings([]);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load operations for this site');
    } finally {
      setIsLoading(false);
    }
  }, [site?.id, assetManagerId]);

  React.useEffect(() => {
    if (isOpen && site?.id) {
      fetchBookings();
    } else {
      setBookings([]);
    }
  }, [isOpen, site?.id, fetchBookings]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">
            Drone Operations for {site?.name}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Showing all flight bookings and operations associated with this infrastructure asset.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          <BookingTable
            data={bookings}
            isLoading={isLoading}
            onViewDetails={(booking) => {
              onClose();
              router.push(`/dashboard/operator/bookings/${booking.id}`);
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
