import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Ban, CheckCircle, Info, RotateCcw, Search, Users } from 'lucide-react';
import type { AccountStatus, ManagedUser } from '../../types';
import { UserSuspensionModal } from './UserSuspensionModal';

interface UserManagementSectionProps {
    users: ManagedUser[];
    onViewUser: (user: ManagedUser) => void;
    onSuspendUser: (user: ManagedUser, reason: string) => void;
    onReinstateUser: (user: ManagedUser) => void;
}

export function UserManagementSection({
    users,
    onViewUser,
    onSuspendUser,
    onReinstateUser,
}: UserManagementSectionProps) {
    const [userMgmtTab, setUserMgmtTab] = useState<'landowner' | 'operator'>('landowner');
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [showSuspendModal, setShowSuspendModal] = useState(false);
    const [selectedUserForAction, setSelectedUserForAction] = useState<ManagedUser | null>(null);
    const [suspendReason, setSuspendReason] = useState('');

    const filteredUsers = users.filter(user => {
        const matchesRole = user.role === userMgmtTab;
        const query = userSearchQuery.toLowerCase();
        const matchesSearch =
            user.name.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query) ||
            (user.organisation?.toLowerCase() || '').includes(query);
        return matchesRole && matchesSearch;
    });

    const openSuspendModal = (user: ManagedUser) => {
        setSelectedUserForAction(user);
        setSuspendReason('');
        setShowSuspendModal(true);
    };

    const closeSuspendModal = () => {
        setShowSuspendModal(false);
        setSelectedUserForAction(null);
        setSuspendReason('');
    };

    const handleConfirmSuspend = () => {
        if (!selectedUserForAction) return;
        onSuspendUser(selectedUserForAction, suspendReason);
        closeSuspendModal();
    };

    return (
        <motion.div
            key="user-mgmt"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
        >
            <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                            {userMgmtTab === 'landowner' ? 'Landowner' : 'Operator'} Account
                            Management
                        </h2>
                        <p className="text-sm text-slate-500 font-medium mt-1">
                            Manage verified accounts - suspend or reinstate access
                        </p>
                    </div>
                    <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                        <button
                            onClick={() => setUserMgmtTab('landowner')}
                            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${userMgmtTab === 'landowner' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            Landowners
                        </button>
                        <button
                            onClick={() => setUserMgmtTab('operator')}
                            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${userMgmtTab === 'operator' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            Operators
                        </button>
                    </div>
                </div>

                <div className="flex gap-4 mb-8">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email, or organisation..."
                            className="w-full h-12 pl-12 pr-4 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                            value={userSearchQuery}
                            onChange={e => setUserSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="text-left px-4 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">
                                    {userMgmtTab === 'landowner' ? 'Landowner' : 'Operator'}
                                </th>
                                <th className="text-left px-4 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">
                                    Organisation
                                </th>
                                <th className="text-left px-4 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">
                                    {userMgmtTab === 'landowner' ? 'Sites' : 'Bookings'}
                                </th>
                                <th className="text-left px-4 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="text-left px-4 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">
                                    Verified Date
                                </th>
                                <th className="text-right px-4 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F1F5F9]">
                            {filteredUsers.map(user => (
                                <tr
                                    key={user.id}
                                    className={`group ${user.verificationStatus === 'SUSPENDED' ? 'bg-red-50/30' : 'hover:bg-slate-50'} transition-colors`}
                                >
                                    <td className="px-4 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="size-9 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                                                <Users className="size-4" />
                                            </div>
                                            <div
                                                className="cursor-pointer"
                                                onClick={() => onViewUser(user)}
                                            >
                                                <p className="text-sm font-black text-slate-800 group-hover:text-blue-600 transition-colors">
                                                    {user.name}
                                                </p>
                                                <p className="text-xs text-slate-400 font-medium">
                                                    {user.email}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-6">
                                        <p className="text-sm font-bold text-slate-600">
                                            {user.organisation || '—'}
                                        </p>
                                    </td>
                                    <td className="px-4 py-6">
                                        <div className="text-xs font-bold">
                                            {user.role === 'landowner' ? (
                                                <>
                                                    <span className="text-blue-600">
                                                        {user.activeSites} active
                                                    </span>
                                                    <p className="text-slate-400">
                                                        {user.totalSites} total
                                                    </p>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="text-blue-600">
                                                        {user.totalBookings} total
                                                    </span>
                                                    <p className="text-slate-400">bookings</p>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-6">
                                        {user.verificationStatus === 'VERIFIED' ? (
                                            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-[#15803D] text-[10px] font-black uppercase rounded-lg border border-emerald-100 w-fit">
                                                <CheckCircle className="size-3" />
                                                Verified
                                            </div>
                                        ) : (
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 px-3 py-1 bg-red-50 text-red-700 text-[10px] font-black uppercase rounded-lg border border-red-100 w-fit">
                                                    <Ban className="size-3" />
                                                    Suspended
                                                </div>
                                                {user.suspendedReason && (
                                                    <p className="text-[10px] text-red-600 font-bold leading-tight">
                                                        {user.suspendedReason}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-6 text-sm font-bold text-slate-600">
                                        {new Date(user.verifiedDate).toLocaleDateString('en-GB')}
                                    </td>
                                    <td className="px-4 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => onViewUser(user)}
                                                className="size-9 flex items-center justify-center bg-white border border-slate-200 text-slate-500 rounded-lg hover:text-blue-600 transition-all"
                                                title="View Details"
                                            >
                                                <Info className="size-4" />
                                            </button>
                                            {user.verificationStatus === 'VERIFIED' ? (
                                                <button
                                                    onClick={() => openSuspendModal(user)}
                                                    className="h-10 px-4 bg-red-600 text-white rounded-lg text-xs font-black uppercase hover:bg-red-700 transition-all flex items-center gap-2"
                                                >
                                                    <Ban className="size-3.5" />
                                                    Suspend
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => onReinstateUser(user)}
                                                    className="h-10 px-4 bg-emerald-600 text-white rounded-lg text-xs font-black uppercase hover:bg-emerald-700 transition-all flex items-center gap-2"
                                                >
                                                    <RotateCcw className="size-3.5" />
                                                    Reinstate
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <AnimatePresence>
                {showSuspendModal && selectedUserForAction && (
                    <UserSuspensionModal
                        user={selectedUserForAction}
                        reason={suspendReason}
                        onReasonChange={setSuspendReason}
                        onConfirm={handleConfirmSuspend}
                        onCancel={closeSuspendModal}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}
