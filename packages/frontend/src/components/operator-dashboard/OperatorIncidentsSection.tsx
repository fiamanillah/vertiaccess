import { ShieldAlert } from 'lucide-react';
import type { IncidentReport } from '../../types';
import { Skeleton } from '../ui/skeleton';
import { HumanIdChip } from '../ui/HumanIdChip';

interface OperatorIncidentsSectionProps {
    incidents: IncidentReport[];
    isLoading?: boolean;
    onSelectIncident: (incident: IncidentReport) => void;
}

export function OperatorIncidentsSection({
    incidents,
    isLoading = false,
    onSelectIncident,
}: OperatorIncidentsSectionProps) {
    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {isLoading && (
                    <div className="p-6 flex items-center gap-3 bg-blue-50/30 border-b border-slate-200">
                        <div className="size-5 rounded-full bg-blue-100 flex items-center justify-center">
                            <div className="size-2 rounded-full bg-blue-600 animate-pulse" />
                        </div>
                        <p className="text-sm font-medium text-slate-600">Loading incidents...</p>
                    </div>
                )}
                {isLoading ? (
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Case ID
                                </th>
                                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Site / Booking
                                </th>
                                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Type
                                </th>
                                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Incident Date
                                </th>
                                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="text-right px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {[1, 2, 3, 4, 5].map(i => (
                                <tr key={i} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-5">
                                        <Skeleton className="h-4 w-32" />
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-40" />
                                            <Skeleton className="h-3 w-32 opacity-50" />
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <Skeleton className="h-4 w-28" />
                                    </td>
                                    <td className="px-6 py-5">
                                        <Skeleton className="h-4 w-24" />
                                    </td>
                                    <td className="px-6 py-5">
                                        <Skeleton className="h-6 w-24" />
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <Skeleton className="h-8 w-24 ml-auto" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : incidents.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="size-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ShieldAlert className="size-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">
                            No Safety Incidents Logged
                        </h3>
                        <p className="text-slate-500 max-w-sm mx-auto mt-2">
                            Reports submitted from the My Bookings tab will appear here for tracking
                            and audit purposes.
                        </p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Case ID
                                </th>
                                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Site / Booking
                                </th>
                                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Type
                                </th>
                                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Incident Date
                                </th>
                                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="text-right px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {incidents.map(incident => (
                                <tr
                                    key={incident.id}
                                    className="hover:bg-slate-50 transition-colors"
                                >
                                    <td className="px-6 py-5">
                                        <HumanIdChip id={incident.id} prefix="vt-inc" copyable />
                                    </td>
                                    <td className="px-6 py-5">
                                        <p className="font-bold text-slate-900">
                                            {incident.siteName}
                                        </p>
                                        <p className="text-xs mt-0.5">
                                            {incident.bookingId
                                                ? <HumanIdChip id={incident.bookingId} prefix="vt-bkg" />
                                                : <span className="text-slate-400">—</span>}
                                        </p>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-sm text-slate-700 capitalize">
                                            {incident.type.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-sm text-slate-500">
                                        {new Date(
                                            incident.incidentDateTime || incident.createdAt
                                        ).toLocaleDateString('en-GB', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric',
                                        })}
                                    </td>
                                    <td className="px-6 py-5">
                                        <span
                                            className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                incident.status === 'UNDER_REVIEW'
                                                    ? 'bg-amber-100 text-amber-700'
                                                    : incident.status === 'RESOLVED'
                                                      ? 'bg-blue-100 text-blue-700'
                                                      : 'bg-green-100 text-green-700'
                                            }`}
                                        >
                                            {incident.status.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <button
                                            onClick={() => onSelectIncident(incident)}
                                            className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                                        >
                                            View Report
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
