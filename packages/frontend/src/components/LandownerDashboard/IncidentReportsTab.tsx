import type { IncidentReport } from '../../types';
import { ShieldAlert } from 'lucide-react';
import { Spinner } from '../ui/spinner';

interface IncidentReportsTabProps {
    incidentReports: IncidentReport[];
    onSelectIncident: (incident: IncidentReport) => void;
    loading: boolean;
}

export function IncidentReportsTab({
    incidentReports,
    onSelectIncident,
    loading,
}: IncidentReportsTabProps) {
    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12">
                <div className="flex flex-col items-center justify-center gap-3 text-slate-500">
                    <Spinner size="lg" className="text-red-500" aria-label="Loading incidents" />
                    <p className="text-sm font-medium">Loading incident reports...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {incidentReports.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="size-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ShieldAlert className="size-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">No Incidents Reported</h3>
                        <p className="text-slate-500 max-w-sm mx-auto">
                            Reports submitted from the Booking Requests tab will appear here for
                            tracking and resolution.
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
                                    Submitted
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
                            {incidentReports.map(incident => (
                                <tr
                                    key={incident.id}
                                    className="hover:bg-slate-50 transition-colors"
                                >
                                    <td className="px-6 py-5">
                                        <span className="font-mono font-bold text-slate-900">
                                            {incident.id}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <p className="font-bold text-slate-900">
                                            {incident.siteName}
                                        </p>
                                        <p className="text-xs text-slate-500 font-mono">
                                            {incident.bookingId}
                                        </p>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-sm text-slate-700 capitalize">
                                            {incident.type.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-sm text-slate-500">
                                        {new Date(incident.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-5">
                                        <span
                                            className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                incident.status === 'OPEN'
                                                    ? 'bg-amber-100 text-amber-700'
                                                    : incident.status === 'UNDER_REVIEW'
                                                      ? 'bg-blue-100 text-blue-700'
                                                      : 'bg-green-100 text-green-700'
                                            }`}
                                        >
                                            {incident.status.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => onSelectIncident(incident)}
                                                className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                                            >
                                                View Details
                                            </button>
                                        </div>
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
