import type { BookingRequest } from '../types';
import { X, AlertTriangle, PoundSterling } from 'lucide-react';

interface CancelBookingModalProps {
  booking: BookingRequest;
  isLoading?: boolean;
  onConfirm: (bookingId: string, cancellationFee: number, paymentStatus: string) => void;
  onClose: () => void;
}

export function CancelBookingModal({ booking, isLoading, onConfirm, onClose }: CancelBookingModalProps) {
  const calculateCancellationDetails = () => {
    const startTime = new Date(booking.startTime);
    const now = new Date();
    const hoursUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Mock pricing - in real app would come from the booking
    const basePrice = booking.pricing?.amount || 50;
    const cancellationPercentage = 50; // For 24h-2h window

    if (hoursUntilStart > 24) {
      return {
        fee: 0,
        status: 'cancelled_no_charge',
        message: 'No cancellation fee (>24 hours notice)',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
      };
    } else if (hoursUntilStart >= 2) {
      const fee = (basePrice * cancellationPercentage) / 100;
      return {
        fee,
        status: 'cancelled_partial',
        message: `${cancellationPercentage}% cancellation fee (24h-2h notice)`,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
      };
    } else {
      return {
        fee: basePrice,
        status: 'cancelled_full',
        message: 'Full booking charge (<2 hours notice)',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
      };
    }
  };

  const cancellationDetails = calculateCancellationDetails();
  const startTime = new Date(booking.startTime);
  const now = new Date();
  const hoursUntilStart = Math.floor((startTime.getTime() - now.getTime()) / (1000 * 60 * 60));

  const handleConfirm = () => {
    onConfirm(booking.id, cancellationDetails.fee, cancellationDetails.status);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-6 text-amber-600" />
            <h2>Cancel Booking</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Booking Details */}
          <div className="mb-6">
            <p className="text-gray-600 text-sm mb-2">Booking Details</p>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div>
                <p className="text-xs text-gray-600">Site</p>
                <p className="font-medium">{booking.siteName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Operation Start</p>
                <p className="text-sm">{new Date(booking.startTime).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Reference</p>
                <p className="text-sm font-mono">{booking.operationReference}</p>
              </div>
            </div>
          </div>

          {/* Time Until Start */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-gray-700 mb-4">
              <AlertTriangle className="size-5" />
              <p>
                <span className="font-medium">{hoursUntilStart} hours</span> until operation start
              </p>
            </div>
          </div>

          {/* Cancellation Fee Notice */}
          <div className={`border ${cancellationDetails.borderColor} ${cancellationDetails.bgColor} rounded-lg p-4 mb-6`}>
            <div className="flex items-start gap-3">
              <PoundSterling className={`size-5 ${cancellationDetails.color} flex-shrink-0 mt-0.5`} />
              <div className="flex-1">
                <p className={`font-medium ${cancellationDetails.color} mb-1`}>
                  Cancellation Policy
                </p>
                <p className="text-sm text-gray-700 mb-3">
                  {cancellationDetails.message}
                </p>
                <div className="bg-white rounded p-3 border border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Cancellation Fee:</span>
                    <span className={`font-medium ${cancellationDetails.color}`}>
                      £{cancellationDetails.fee.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cancellation Policy Breakdown */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-xs text-gray-600 mb-2">Cancellation Policy:</p>
            <ul className="text-xs text-gray-700 space-y-1">
              <li>• <span className="font-medium">More than 24 hours:</span> No charge</li>
              <li>• <span className="font-medium">24 hours to 2 hours:</span> 50% cancellation fee</li>
              <li>• <span className="font-medium">Less than 2 hours:</span> Full booking charge</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Keep Booking
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Confirm Cancellation"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}