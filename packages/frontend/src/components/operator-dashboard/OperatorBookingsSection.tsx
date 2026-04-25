import { useState } from 'react';
import { AlertTriangle, MapPin, Info, CreditCard, ShieldAlert, Loader } from 'lucide-react';
import type { BookingRequest } from '../../types';
import { Skeleton } from '../ui/skeleton';
import { toast } from 'sonner';

interface OperatorBookingsSectionProps {
    bookings: BookingRequest[];
    isLoading: boolean;
    isCancellingLoading: boolean;
    isPayingBooking: boolean;
    onSelectBookingDetails: (booking: BookingRequest) => void;
    onSelectReceipt: (booking: BookingRequest) => void;
    onSetBookingToCancel: (booking: BookingRequest) => void;
    onReportIncident: (booking: BookingRequest) => void;
}

export function OperatorBookingsSection({
    bookings,
    isLoading,
    isCancellingLoading,
    isPayingBooking,
    onSelectBookingDetails,
    onSelectReceipt,
    onSetBookingToCancel,
    onReportIncident,
}: OperatorBookingsSectionProps) {
    const [hoveredRow, setHoveredRow] = useState<string | null>(null);

    const hasBlockedBookings = bookings.some(b => b.status === 'CANCELLED');

    return (
        <div className="space-y-6">


            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {isLoading && (
                    <div className="p-6 flex items-center gap-3 bg-blue-50/30 border-b border-slate-200">
                        <div className="size-5 rounded-full bg-blue-100 flex items-center justify-center">
                            <div className="size-2 rounded-full bg-blue-600 animate-pulse" />
                        </div>
                        <p className="text-sm font-medium text-slate-600">Loading bookings...</p>
                    </div>
                )}
                {isLoading ? (
                    <div className="p-6 space-y-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div
                                key={i}
                                className="flex items-center gap-4 py-3 border-b border-slate-50 last:border-0"
                            >
                                <Skeleton className="size-10 rounded-lg shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-5 w-48" />
                                    <Skeleton className="h-3 w-32 opacity-50" />
                                </div>
                                <Skeleton className="h-4 w-24 mx-4" />
                                <Skeleton className="h-4 w-24 mx-4" />
                                <Skeleton className="h-8 w-8 rounded-lg shrink-0 ml-auto" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Site
                                </th>
                                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Window
                                </th>
                                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Reference
                                </th>
                                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Infrastructure
                                </th>
                                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Incident
                                </th>
                                <th className="text-right px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {bookings.map(booking => (
                                <tr
                                    key={booking.id}
                                    className="hover:bg-slate-50 transition-colors group"
                                    onMouseEnter={() => setHoveredRow(booking.id)}
                                    onMouseLeave={() => setHoveredRow(null)}
                                >
                                    <td className="px-6 py-5">
                                        <div className="flex items-start gap-4">
                                            <div className="size-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 text-slate-400 group-hover:text-blue-600 transition-colors">
                                                <MapPin className="size-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">
                                                    {booking.siteName}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    {booking.operatorId}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900">
                                                {new Date(booking.startTime).toLocaleDateString(
                                                    'en-GB',
                                                    {
                                                        day: '2-digit',
                                                        month: 'short',
                                                    }
                                                )}
                                            </span>
                                            <span className="text-slate-500 text-xs">
                                                {new Date(booking.startTime).toLocaleTimeString(
                                                    [],
                                                    {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    }
                                                )}
                                                {' - '}
                                                {new Date(booking.endTime).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="font-mono text-sm font-bold text-slate-600">
                                            {booking.operationReference}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex gap-2">
                                            <span
                                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight ${
                                                    booking.useCategory === 'planned_toal'
                                                        ? 'bg-blue-50 text-blue-600'
                                                        : 'bg-amber-50 text-amber-700'
                                                }`}
                                            >
                                                {booking.useCategory === 'planned_toal'
                                                    ? 'TOAL'
                                                    : 'Emergency & Recovery'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span
                                            className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${
                                                booking.status === 'APPROVED'
                                                    ? 'bg-green-50 text-green-700 border-green-100'
                                                    : booking.status === 'PENDING'
                                                      ? 'bg-amber-50 text-amber-700 border-amber-100'
                                                      : booking.status === 'CANCELLED'
                                                        ? 'bg-red-50 text-red-700 border-red-100'
                                                        : 'bg-slate-50 text-slate-700 border-slate-100'
                                            }`}
                                        >
                                            {booking.status === 'PENDING'
                                                ? 'Pending'
                                                : booking.status.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <button
                                            onClick={e => {
                                                e.stopPropagation();
                                                onReportIncident(booking);
                                            }}
                                            className="text-red-500 hover:text-red-700 p-1 transition-colors mx-auto block disabled:opacity-50"
                                            title="Report Safety Incident"
                                            disabled={isCancellingLoading || isPayingBooking}
                                        >
                                            <ShieldAlert className="size-5" />
                                        </button>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => onSelectBookingDetails(booking)}
                                                disabled={isCancellingLoading || isPayingBooking}
                                                className="text-slate-400 hover:text-slate-900 p-1 transition-colors disabled:opacity-50"
                                                title="View Details"
                                            >
                                                <Info className="size-5" />
                                            </button>
                                            {booking.status === 'APPROVED' && (
                                                <button
                                                    onClick={() => onSelectReceipt(booking)}
                                                    disabled={
                                                        isCancellingLoading || isPayingBooking
                                                    }
                                                    className="text-slate-400 hover:text-blue-600 p-1 transition-colors disabled:opacity-50"
                                                    title="View Receipt"
                                                >
                                                    <CreditCard className="size-5" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {bookings.length === 0 && !isLoading && (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="px-6 py-12 text-center text-slate-500 italic"
                                    >
                                        No bookings found. Click "Book Site Access" to start.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
