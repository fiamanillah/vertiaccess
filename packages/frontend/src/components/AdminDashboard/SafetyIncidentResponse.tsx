import { motion } from 'motion/react';
import { FileText, MessageSquare, Ban, Filter } from 'lucide-react';
import { useState } from 'react';
import type { IncidentStatus } from '../../types';
import type { IncidentReport } from '../../types';

interface SafetyIncidentResponseProps {
    incidentReports: IncidentReport[];
    onViewIncident: (incident: IncidentReport) => void;
    onUpdateIncidentStatus: (incidentId: string, status: IncidentStatus) => void;
    onAddIncidentNote: (incidentId: string, note: string) => void;
    onBlockSite: (siteId: string) => void;
}

export function SafetyIncidentResponse({
    incidentReports,
    onViewIncident,
    onUpdateIncidentStatus,
    onAddIncidentNote,
    onBlockSite,
}: SafetyIncidentResponseProps) {
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    const filteredIncidents =
        statusFilter === 'ALL'
            ? incidentReports
            : incidentReports.filter(r => r.status === statusFilter);
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
        >
            <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                            Safety & Incident Response
                        </h2>
                        <p className="text-sm text-slate-500 font-medium mt-1">
                            Review reported safety concerns, operator breaches, and site damage.
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Filter className="size-4 text-slate-400" />
                        <label className="text-xs font-black text-slate-400 uppercase tracking-wider">
                            Filter by Status:
                        </label>
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="px-3 py-1.5 bg-white border border-slate-200 text-sm font-bold text-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        >
                            <option value="ALL">All Status</option>
                            <option value="OPEN">Open</option>
                            <option value="UNDER_REVIEW">Under Review</option>
                            <option value="RESOLVED">Resolved</option>
                            <option value="CLOSED">Closed</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-6 mb-8">
                    <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                        <p className="text-xs font-black text-red-400 uppercase tracking-wider mb-1">
                            Open Cases
                        </p>
                        <p className="text-2xl font-black text-red-700">
                            {filteredIncidents.filter(r => r.status === 'OPEN').length}
                        </p>
                    </div>
                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                        <p className="text-xs font-black text-amber-500 uppercase tracking-wider mb-1">
                            Under Review
                        </p>
                        <p className="text-2xl font-black text-amber-700">
                            {filteredIncidents.filter(r => r.status === 'UNDER_REVIEW').length}
                        </p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                        <p className="text-xs font-black text-blue-400 uppercase tracking-wider mb-1">
                            Critical Urgency
                        </p>
                        <p className="text-2xl font-black text-blue-700">
                            {filteredIncidents.filter(r => r.urgency === 'critical').length}
                        </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">
                            Resolved (30d)
                        </p>
                        <p className="text-2xl font-black text-slate-700">
                            {filteredIncidents.filter(r => r.status === 'RESOLVED').length}
                        </p>
                    </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                <th className="text-left px-4 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">
                                    Case Info
                                </th>
                                <th className="text-left px-4 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">
                                    Incident Type
                                </th>
                                <th className="text-left px-4 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">
                                    Involved Parties
                                </th>
                                <th className="text-left px-4 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">
                                    Severity
                                </th>
                                <th className="text-left px-4 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="text-right px-4 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F1F5F9]">
                            {filteredIncidents.length > 0 ? (
                                filteredIncidents.map(report => (
                                    <tr
                                        key={report.id}
                                        className="group hover:bg-slate-50 transition-colors"
                                    >
                                        <td className="px-4 py-6">
                                            <p className="text-sm font-black text-slate-800 mb-1">
                                                {report.id}
                                            </p>
                                            <p className="text-xs text-slate-400 font-bold">
                                                {new Date(report.createdAt).toLocaleDateString()}
                                            </p>
                                        </td>
                                        <td className="px-4 py-6">
                                            <div className="flex items-center gap-2">
                                                <span className="capitalize text-sm font-bold text-slate-700">
                                                    {report.type.replace(/_/g, ' ')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-6">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase w-16">
                                                        Site:
                                                    </span>
                                                    <span className="text-xs font-bold text-blue-600">
                                                        {report.siteName}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase w-16">
                                                        Operator:
                                                    </span>
                                                    <span className="text-xs font-bold text-slate-700">
                                                        {report.operatorName || 'Unknown'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-6">
                                            <span
                                                className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${
                                                    report.urgency === 'critical'
                                                        ? 'bg-red-600 text-white'
                                                        : report.urgency === 'high'
                                                          ? 'bg-orange-100 text-orange-700'
                                                          : report.urgency === 'medium'
                                                            ? 'bg-amber-100 text-amber-700'
                                                            : 'bg-blue-100 text-blue-700'
                                                }`}
                                            >
                                                {report.urgency}
                                            </span>
                                        </td>
                                        <td className="px-4 py-6">
                                            <select
                                                value={report.status}
                                                onChange={e => {
                                                    const newStatus = e.target
                                                        .value as IncidentStatus;
                                                    onUpdateIncidentStatus(report.id, newStatus);
                                                }}
                                                className="h-8 px-2 bg-white border border-slate-200 rounded-lg text-xs font-black uppercase tracking-wider outline-none"
                                            >
                                                <option value="OPEN">Open</option>
                                                <option value="UNDER_REVIEW">Under Review</option>
                                                <option value="RESOLVED">Resolved</option>
                                                <option value="CLOSED">Closed</option>
                                            </select>
                                        </td>
                                        <td className="px-4 py-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => onViewIncident(report)}
                                                    className="h-9 px-4 bg-[#EAF2FF] text-blue-600 rounded-lg text-xs font-black uppercase hover:bg-[#D9E6FF] transition-all flex items-center gap-2"
                                                >
                                                    <FileText className="size-3.5" />
                                                    View Case
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const note = prompt(
                                                            'Enter admin investigation notes:',
                                                            report.adminNotes || ''
                                                        );
                                                        if (note !== null) {
                                                            onAddIncidentNote(report.id, note);
                                                        }
                                                    }}
                                                    className="size-9 rounded-lg border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-50 transition-all"
                                                    title="Attach Notes"
                                                >
                                                    <MessageSquare className="size-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        onBlockSite(report.siteId);
                                                    }}
                                                    className="size-9 rounded-lg border border-red-100 text-red-600 flex items-center justify-center hover:bg-red-50 transition-all"
                                                    title="Block Site Booking"
                                                >
                                                    <Ban className="size-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center">
                                        <p className="text-slate-400 font-bold text-sm">
                                            {statusFilter === 'ALL'
                                                ? 'No incident reports found'
                                                : `No incident reports with status "${statusFilter.replace(
                                                      /_/g,
                                                      ' '
                                                  )}"`}
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
}
