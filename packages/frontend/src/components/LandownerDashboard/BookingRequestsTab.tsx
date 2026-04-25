import type { BookingRequest } from '../../types';
import { ChevronRight, ShieldAlert } from 'lucide-react';
import { Spinner } from '../ui/spinner';
import { HumanIdChip } from '../ui/HumanIdChip';

interface BookingRequestsTabProps {
    bookingRequests: BookingRequest[];
    statusFilter: 'all' | 'PENDING' | 'APPROVED' | 'REJECTED';
    onStatusFilterChange: (value: 'all' | 'PENDING' | 'APPROVED' | 'REJECTED') => void;
    onSelectRequest: (request: BookingRequest) => void;
    onReportIncident: (request: BookingRequest) => void;
    onApproveRequest: (requestId: string) => void;
    onRejectRequest: (requestId: string) => void;
    pendingRequestId: string | null;
    pendingAction: 'APPROVE' | 'REJECT' | null;
    loading: boolean;
}

export function BookingRequestsTab({
    bookingRequests,
    statusFilter,
    onStatusFilterChange,
    onSelectRequest,
    onReportIncident,
    onApproveRequest,
    onRejectRequest,
    pendingRequestId,
    pendingAction,
    loading,
}: BookingRequestsTabProps) {
    const filteredRequests = bookingRequests.filter(
        req => statusFilter === 'all' || req.status === statusFilter
    );

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12">
                <div className="flex flex-col items-center justify-center gap-3 text-slate-500">
                    <Spinner
                        size="lg"
                        className="text-blue-500"
                        aria-label="Loading booking requests"
                    />
                    <p className="text-sm font-medium">Loading booking requests...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex gap-2 mb-6">
                {[
                    { id: 'all', label: 'All Requests' },
                    { id: 'PENDING', label: 'Pending' },
                    { id: 'APPROVED', label: 'Approved' },
                    { id: 'REJECTED', label: 'Rejected' },
                ].map(filter => (
                    <button
                        key={filter.id}
                        onClick={() =>
                            onStatusFilterChange(
                                filter.id as 'all' | 'PENDING' | 'APPROVED' | 'REJECTED'
                            )
                        }
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${
                            statusFilter === filter.id
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                    >
                        {filter.label}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Operator
                            </th>
                            <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Site
                            </th>
                            <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Window
                            </th>
                            <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Type
                            </th>
                            <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Report
                            </th>
                            <th className="text-right px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredRequests.map(request => (
                            <tr
                                key={request.id}
                                className="hover:bg-slate-50 cursor-pointer transition-colors"
                                onClick={() => onSelectRequest(request)}
                            >
                                <td className="px-6 py-5">
                                    <p className="font-bold text-slate-900">
                                        {request.operatorOrganisation || 'Independent Operator'}
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        {request.operatorEmail}
                                    </p>
                                    <div className="mt-1">
                                        <HumanIdChip id={request.humanId} prefix="vt-bkg" />
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-sm font-medium text-slate-700">
                                    {request.siteName}
                                </td>
                                <td className="px-6 py-5 text-sm">
                                    <p className="text-slate-900">
                                        {new Date(request.startTime).toLocaleDateString()}
                                    </p>
                                    <p className="text-slate-500 text-xs">
                                        {new Date(request.startTime).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </p>
                                </td>
                                <td className="px-6 py-5">
                                    <span
                                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight ${
                                            request.useCategory === 'planned_toal'
                                                ? 'bg-indigo-50 text-indigo-700'
                                                : 'bg-amber-50 text-amber-700'
                                        }`}
                                    >
                                        {request.useCategory === 'planned_toal'
                                            ? 'TOAL'
                                            : 'Emergency and Recovery Site'}
                                    </span>
                                </td>
                                <td className="px-6 py-5">
                                    <span
                                        className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                                            request.status === 'APPROVED'
                                                ? 'bg-green-50 text-green-700'
                                                : request.status === 'REJECTED'
                                                  ? 'bg-red-50 text-red-700'
                                                  : request.status === 'PENDING'
                                                    ? 'bg-amber-50 text-amber-700'
                                                    : 'bg-slate-50 text-slate-700'
                                        }`}
                                    >
                                        {request.status === 'PENDING' ? 'Pending' : request.status}
                                    </span>
                                </td>
                                <td className="px-6 py-5">
                                    <button
                                        onClick={e => {
                                            e.stopPropagation();
                                            onReportIncident(request);
                                        }}
                                        className="text-red-500 hover:text-red-700 p-1 transition-colors"
                                        title="Report Incident"
                                    >
                                        <ShieldAlert className="size-5" />
                                    </button>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    {request.status === 'PENDING' ? (
                                        <div className="flex justify-end gap-2">
                                            {(() => {
                                                const isPendingForRequest =
                                                    pendingRequestId === request.id;
                                                const isApproving =
                                                    isPendingForRequest &&
                                                    pendingAction === 'APPROVE';
                                                const isRejecting =
                                                    isPendingForRequest &&
                                                    pendingAction === 'REJECT';

                                                return (
                                                    <>
                                                        <button
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                onApproveRequest(request.id);
                                                            }}
                                                            disabled={isPendingForRequest}
                                                            className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-700 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                                                        >
                                                            {isApproving && (
                                                                <Spinner
                                                                    size="sm"
                                                                    className="size-3 text-white"
                                                                    aria-label="Approving request"
                                                                />
                                                            )}
                                                            {isApproving
                                                                ? 'Approving...'
                                                                : 'Approve'}
                                                        </button>
                                                        <button
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                onRejectRequest(request.id);
                                                            }}
                                                            disabled={isPendingForRequest}
                                                            className="bg-white text-red-600 border border-red-100 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                                                        >
                                                            {isRejecting && (
                                                                <Spinner
                                                                    size="sm"
                                                                    className="size-3 text-red-500"
                                                                    aria-label="Rejecting request"
                                                                />
                                                            )}
                                                            {isRejecting
                                                                ? 'Rejecting...'
                                                                : 'Reject'}
                                                        </button>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    ) : (
                                        <ChevronRight className="size-5 text-slate-300 ml-auto" />
                                    )}
                                </td>
                            </tr>
                        ))}

                        {filteredRequests.length === 0 && (
                            <tr>
                                <td
                                    colSpan={7}
                                    className="px-6 py-12 text-center text-slate-400 italic"
                                >
                                    No{' '}
                                    {statusFilter !== 'all' ? statusFilter.replace(/_/g, ' ') : ''}{' '}
                                    booking requests found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
