import React from 'react';
import type { ManagedUser, IncidentReport, Site, BookingRequest } from '../types';
import {
    X,
    User,
    Mail,
    Building2,
    Shield,
    ShieldAlert,
    MapPin,
    Clock,
    FileText,
    PoundSterling,
    Activity,
    ChevronRight,
    Plus,
    CheckCircle,
    Ban,
    RotateCcw,
    MessageSquare,
    Trash2,
    ExternalLink,
    Download,
    AlertTriangle,
    Filter,
    Search,
    Globe,
    Phone,
    Home,
    CreditCard,
    ShieldCheck,
    ArrowUpRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SiteDetailsModal } from './SiteDetailsModal';
import { IncidentDetailModal } from './IncidentDetailModal';
import { BookingDetailModal } from './BookingDetailModal';

interface UserDetailModalProps {
    user: ManagedUser;
    onClose: () => void;
    sites: Site[];
    bookings: BookingRequest[];
    incidents: IncidentReport[];
    allUsers: ManagedUser[]; // Add this to look up landowners/operators
    onUpdateUser: (userId: string, updates: Partial<ManagedUser>) => void;
    onUpdateSite: (siteId: string, status: any) => void;
    onUpdateBooking: (bookingId: string, status: any) => void;
    onRefund: (targetId: string, type: 'booking' | 'user') => void;
    onRaiseIncident: (siteId: string) => void;
    onUpdateIncidentStatus?: (incidentId: string, status: IncidentReport['status']) => void;
    onAddIncidentNote?: (incidentId: string, note: string) => void;
    onAddIncidentDocument?: (
        incidentId: string,
        doc: { name: string; type: string; size: string }
    ) => void;
    onBlockIncidentSite?: (siteId: string) => void;
}

export function UserDetailModal({
    user,
    onClose,
    sites,
    bookings,
    incidents,
    allUsers,
    onUpdateUser,
    onUpdateSite,
    onUpdateBooking,
    onRefund,
    onRaiseIncident,
    onUpdateIncidentStatus,
    onAddIncidentNote,
    onAddIncidentDocument,
    onBlockIncidentSite,
}: UserDetailModalProps) {
    const [activeTab, setActiveTab] = React.useState<'overview' | 'activity' | 'notes' | 'safety'>(
        'overview'
    );
    const [newNote, setNewNote] = React.useState('');
    const [selectedSiteForView, setSelectedSiteForView] = React.useState<Site | null>(null);
    const [selectedIncidentForView, setSelectedIncidentForView] =
        React.useState<IncidentReport | null>(null);
    const [selectedBookingForView, setSelectedBookingForView] =
        React.useState<BookingRequest | null>(null);

    const userSites = sites.filter(s => s.landownerId === user.id);
    const userBookings = bookings.filter(
        b => b.operatorId === user.id || b.operatorEmail === user.email
    );
    const userIncidents = incidents.filter(
        i => i.landownerId === user.id || i.operatorId === user.id
    );

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-200">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white rounded-3xl max-w-5xl w-full h-[85vh] overflow-hidden shadow-2xl flex flex-col border border-slate-100"
            >
                {/* Header */}
                <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                    <div className="flex items-center gap-6">
                        <div
                            className={`size-16 rounded-2xl flex items-center justify-center shadow-lg ${
                                user.verificationStatus === 'SUSPENDED'
                                    ? 'bg-red-500 shadow-red-500/20'
                                    : 'bg-blue-600 shadow-blue-500/20'
                            }`}
                        >
                            {user.role === 'landowner' ? (
                                <MapPin className="size-8 text-white" />
                            ) : (
                                <Shield className="size-8 text-white" />
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-[28px] font-black text-slate-800 tracking-tight">
                                    {user.name}
                                </h2>
                                <div
                                    className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                                        user.verificationStatus === 'VERIFIED'
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                            : user.verificationStatus === 'SUSPENDED'
                                              ? 'bg-red-50 text-red-700 border-red-100'
                                              : 'bg-amber-50 text-amber-700 border-amber-100'
                                    }`}
                                >
                                    {user.verificationStatus}
                                </div>
                                <span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black uppercase text-slate-500 border border-slate-200">
                                    {user.role}
                                </span>
                            </div>
                            <p className="text-sm text-slate-500 font-medium mt-1">
                                {user.organisation || 'Independent'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="size-12 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-all"
                    >
                        <X className="size-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="px-10 border-b border-slate-100 bg-white flex gap-10 shrink-0">
                    {[
                        { id: 'overview', label: 'Overview', icon: <User className="size-4" /> },
                        {
                            id: 'activity',
                            label: user.role === 'landowner' ? 'Sites' : 'Bookings',
                            icon:
                                user.role === 'landowner' ? (
                                    <MapPin className="size-4" />
                                ) : (
                                    <Clock className="size-4" />
                                ),
                        },
                        {
                            id: 'safety',
                            label: 'Safety & Incidents',
                            icon: <ShieldAlert className="size-4" />,
                        },
                        {
                            id: 'notes',
                            label: 'Internal Notes',
                            icon: <MessageSquare className="size-4" />,
                        },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`py-6 text-sm font-black uppercase tracking-widest relative transition-all flex items-center gap-2 ${activeTab === tab.id ? 'text-blue-600' : 'text-slate-400 hover:text-slate-800'}`}
                        >
                            {tab.icon}
                            {tab.label}
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="userTab"
                                    className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"
                                />
                            )}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-slate-50 p-10 custom-scrollbar">
                    {activeTab === 'overview' && (
                        <div className="grid lg:grid-cols-[1fr,320px] gap-10">
                            <div className="space-y-8">
                                <div className="bg-white rounded-[28px] border border-slate-100 p-8 shadow-sm space-y-8">
                                    <h3 className="text-lg font-black text-slate-800 tracking-tight">
                                        Account Information
                                    </h3>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">
                                                Email Address
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <Mail className="size-3.5 text-blue-600" />
                                                <p className="text-base font-bold text-slate-800">
                                                    {user.email}
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">
                                                Account Verified
                                            </p>
                                            <p className="text-base font-bold text-slate-800">
                                                {new Date(user.verifiedDate).toLocaleDateString(
                                                    'en-GB',
                                                    {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric',
                                                    }
                                                )}
                                            </p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">
                                                Registered Address
                                            </p>
                                            <div className="flex items-start gap-2">
                                                <Home className="size-4 text-slate-400 mt-0.5" />
                                                <div>
                                                    <p className="text-base font-bold text-slate-800">
                                                        {user.address || 'Not Provided'}
                                                    </p>
                                                    <p className="text-sm text-slate-500 font-medium">
                                                        {user.postcode}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">
                                                Contact Details
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <Phone className="size-3.5 text-slate-400" />
                                                <p className="text-base font-bold text-slate-800">
                                                    {user.phone || '—'}
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">
                                                Account Status
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className={`size-2 rounded-full ${
                                                        user.verificationStatus === 'VERIFIED'
                                                            ? 'bg-emerald-500'
                                                            : user.verificationStatus ===
                                                                'SUSPENDED'
                                                              ? 'bg-red-500'
                                                              : 'bg-amber-500'
                                                    }`}
                                                />
                                                <p className="text-base font-black text-slate-800 uppercase tracking-wider">
                                                    {user.role.toUpperCase()}_ACCOUNT:{' '}
                                                    {user.verificationStatus.toUpperCase()}
                                                </p>
                                            </div>
                                        </div>
                                        {user.flyerId && (
                                            <div>
                                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">
                                                    Flyer ID
                                                </p>
                                                <p className="text-base font-mono font-bold text-blue-600">
                                                    {user.flyerId}
                                                </p>
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">
                                                Total Revenue/Spend
                                            </p>
                                            <p className="text-base font-bold text-slate-800">
                                                £
                                                {user.role === 'landowner'
                                                    ? '12,450.00'
                                                    : '3,840.00'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-[28px] border border-slate-100 p-8 shadow-sm space-y-6">
                                    <h3 className="text-lg font-black text-slate-800 tracking-tight">
                                        Account Status
                                    </h3>
                                    <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">
                                                Modify Access
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {user.verificationStatus === 'VERIFIED'
                                                    ? 'Suspend this account to prevent all operations.'
                                                    : 'Restore account access to original status.'}
                                            </p>
                                        </div>
                                        {user.verificationStatus === 'VERIFIED' ? (
                                            <button
                                                onClick={() =>
                                                    onUpdateUser(user.id, {
                                                        verificationStatus: 'SUSPENDED',
                                                    })
                                                }
                                                className="h-11 px-6 bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-200"
                                            >
                                                Suspend Account
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() =>
                                                    onUpdateUser(user.id, {
                                                        verificationStatus: 'VERIFIED',
                                                    })
                                                }
                                                className="h-11 px-6 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                                            >
                                                Reinstate Access
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-white rounded-[28px] border border-slate-100 p-8 shadow-sm space-y-6">
                                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                                        Global Actions
                                    </h4>
                                    <div className="space-y-3">
                                        <button
                                            onClick={() => onRefund(user.id, 'user')}
                                            className="w-full h-12 bg-[#EAF2FF] text-blue-600 border border-blue-600/10 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#D9E6FF] transition-all"
                                        >
                                            <CreditCard className="size-4" />
                                            Issue Credit/Refund
                                        </button>
                                        <button className="w-full h-12 bg-white border border-slate-200 text-slate-800 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-all">
                                            <PoundSterling className="size-4" />
                                            Payment History
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'activity' && (
                        <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="text-left px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">
                                            {user.role === 'landowner'
                                                ? 'Site Name'
                                                : 'Booking Ref'}
                                        </th>
                                        <th className="text-left px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">
                                            Status
                                        </th>
                                        <th className="text-left px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">
                                            Date
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {user.role === 'landowner'
                                        ? userSites.map(site => (
                                              <tr
                                                  key={site.id}
                                                  className="hover:bg-[#EAF2FF]/30 transition-colors cursor-pointer group"
                                                  onClick={() => setSelectedSiteForView(site)}
                                              >
                                                  <td className="px-8 py-6 font-bold text-slate-900 group-hover:text-blue-600">
                                                      <div className="flex items-center gap-2">
                                                          {site.name}
                                                          <ArrowUpRight className="size-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                      </div>
                                                  </td>
                                                  <td className="px-8 py-6">
                                                      <span
                                                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                                                              site.status === 'ACTIVE'
                                                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                                  : site.status === 'UNDER_REVIEW'
                                                                    ? 'bg-blue-50 text-blue-700 border-blue-100'
                                                                    : site.status ===
                                                                        'TEMPORARY_RESTRICTED'
                                                                      ? 'bg-amber-50 text-amber-700 border-amber-100'
                                                                      : 'bg-red-50 text-red-700 border-red-100'
                                                          }`}
                                                      >
                                                          {site.status.replace(/_/g, ' ')}
                                                      </span>
                                                  </td>
                                                  <td className="px-8 py-6 text-slate-500 font-medium">
                                                      {new Date(
                                                          site.createdAt
                                                      ).toLocaleDateString()}
                                                  </td>
                                              </tr>
                                          ))
                                        : userBookings.map(booking => (
                                              <tr
                                                  key={booking.id}
                                                  className="hover:bg-[#EAF2FF]/30 transition-colors cursor-pointer group"
                                                  onClick={() => setSelectedBookingForView(booking)}
                                              >
                                                  <td className="px-8 py-6 font-mono font-bold text-slate-900 group-hover:text-blue-600">
                                                      <div className="flex items-center gap-2">
                                                          {booking.operationReference}
                                                          <ArrowUpRight className="size-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                      </div>
                                                  </td>
                                                  <td className="px-8 py-6">
                                                      <span
                                                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                                                              booking.status === 'APPROVED'
                                                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                                  : booking.status === 'REJECTED'
                                                                    ? 'bg-red-50 text-red-700 border-red-100'
                                                                    : 'bg-amber-50 text-amber-700 border-amber-100'
                                                          }`}
                                                      >
                                                          {booking.status}
                                                      </span>
                                                  </td>
                                                  <td className="px-8 py-6 text-slate-500 font-medium">
                                                      {new Date(
                                                          booking.startTime
                                                      ).toLocaleDateString()}
                                                  </td>
                                              </tr>
                                          ))}
                                </tbody>
                            </table>
                            {((user.role === 'landowner' && userSites.length === 0) ||
                                (user.role === 'operator' && userBookings.length === 0)) && (
                                <div className="py-20 text-center text-slate-400 font-bold uppercase text-xs">
                                    No activity recorded
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'safety' && (
                        <div className="space-y-6">
                            {userIncidents.map(incident => (
                                <div
                                    key={incident.id}
                                    className="bg-white rounded-[28px] border border-slate-100 p-8 shadow-sm flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-6">
                                        <div
                                            className={`size-12 rounded-xl flex items-center justify-center ${
                                                incident.urgency === 'critical'
                                                    ? 'bg-red-100 text-red-600'
                                                    : 'bg-slate-100 text-slate-600'
                                            }`}
                                        >
                                            <ShieldAlert className="size-6" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <p className="font-black text-slate-800">
                                                    {incident.id}
                                                </p>
                                                <span className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-black uppercase text-slate-500">
                                                    {incident.type}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-500 font-medium mt-1">
                                                {incident.description.substring(0, 100)}...
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-slate-900">
                                            {new Date(incident.createdAt).toLocaleDateString()}
                                        </p>
                                        <button
                                            onClick={() => setSelectedIncidentForView(incident)}
                                            className="text-[10px] font-black uppercase text-blue-600 hover:underline cursor-pointer"
                                        >
                                            View Full Case
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {userIncidents.length === 0 && (
                                <div className="py-20 text-center bg-white rounded-[28px] border border-dashed border-slate-200">
                                    <ShieldCheck className="size-12 text-slate-200 mx-auto mb-4" />
                                    <p className="text-slate-400 font-bold uppercase text-xs">
                                        No safety incidents reported for this account
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'notes' && (
                        <div className="space-y-8">
                            <div className="bg-white rounded-[28px] border border-slate-100 p-8 shadow-sm">
                                <h3 className="text-lg font-black text-slate-800 tracking-tight mb-6">
                                    Internal Admin Notes
                                </h3>
                                <div className="space-y-4 mb-8">
                                    {user.internalNotes?.map((note, i) => (
                                        <div
                                            key={i}
                                            className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-600 relative group"
                                        >
                                            {note}
                                            <button className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Trash2 className="size-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {(!user.internalNotes || user.internalNotes.length === 0) && (
                                        <p className="py-10 text-center text-slate-400 font-bold uppercase text-xs tracking-wider">
                                            No internal notes yet
                                        </p>
                                    )}
                                </div>

                                <div className="flex gap-4">
                                    <input
                                        type="text"
                                        placeholder="Add a new internal comment..."
                                        value={newNote}
                                        onChange={e => setNewNote(e.target.value)}
                                        className="flex-1 h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600/20 transition-all"
                                    />
                                    <button
                                        onClick={() => {
                                            if (newNote.trim()) {
                                                onUpdateUser(user.id, {
                                                    internalNotes: [
                                                        ...(user.internalNotes || []),
                                                        newNote,
                                                    ],
                                                });
                                                setNewNote('');
                                            }
                                        }}
                                        className="h-14 px-8 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg"
                                    >
                                        Add Note
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-10 py-6 border-t border-slate-100 bg-white flex items-center justify-between shrink-0">
                    <p className="text-xs text-slate-400 font-black uppercase tracking-widest flex items-center gap-2">
                        <Clock className="size-4" />
                        Last Managed by Administrator • {new Date().toLocaleDateString()}
                    </p>
                    <button
                        onClick={onClose}
                        className="h-12 px-8 bg-white border border-slate-200 text-slate-800 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all shadow-sm"
                    >
                        Close Profile
                    </button>
                </div>

                <AnimatePresence>
                    {selectedSiteForView && (
                        <SiteDetailsModal
                            site={selectedSiteForView}
                            onClose={() => setSelectedSiteForView(null)}
                            onSave={updatedSite => {
                                onUpdateSite(updatedSite.id, updatedSite.status);
                                setSelectedSiteForView(null);
                            }}
                        />
                    )}
                    {selectedIncidentForView && (
                        <IncidentDetailModal
                            incident={selectedIncidentForView}
                            onClose={() => setSelectedIncidentForView(null)}
                            onUpdateStatus={status =>
                                onUpdateIncidentStatus?.(selectedIncidentForView.id, status)
                            }
                            onAddNote={note =>
                                onAddIncidentNote?.(selectedIncidentForView.id, note)
                            }
                            onAddDocument={doc =>
                                onAddIncidentDocument?.(selectedIncidentForView.id, doc)
                            }
                            onBlockSite={siteId => onBlockIncidentSite?.(siteId)}
                        />
                    )}
                    {selectedBookingForView && (
                        <BookingDetailModal
                            booking={selectedBookingForView}
                            onClose={() => setSelectedBookingForView(null)}
                            site={sites.find(s => s.id === selectedBookingForView.siteId)}
                            landowner={allUsers.find(
                                u =>
                                    u.id ===
                                    sites.find(s => s.id === selectedBookingForView.siteId)
                                        ?.landownerId
                            )}
                            operator={allUsers.find(
                                u => u.id === selectedBookingForView.operatorId
                            )}
                        />
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
