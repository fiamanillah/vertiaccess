import type { User } from '../../App';
import {
    User as UserIcon,
    Mail,
    Building2,
    CheckCircle,
    AlertCircle,
    Save,
    IdCard,
    ShieldCheck,
    Zap,
} from 'lucide-react';
import { HumanIdChip } from '../ui/HumanIdChip';

interface AccountOverviewSectionProps {
    user: User;
    fullName: string;
    isEditingFullName: boolean;
    onFullNameChange: (value: string) => void;
    onStartEditFullName: () => void;
    onSaveFullName: () => void;
    organisationName: string;
    isEditingOrganisation: boolean;
    onOrganisationChange: (value: string) => void;
    onStartEditOrganisation: () => void;
    onSaveOrganisation: () => void;
    flyerId: string;
    isEditingFlyerId: boolean;
    onFlyerIdChange: (value: string) => void;
    onStartEditFlyerId: () => void;
    onSaveFlyerId: () => void;
    operatorId: string;
    isEditingOperatorId: boolean;
    onOperatorIdChange: (value: string) => void;
    onStartEditOperatorId: () => void;
    onSaveOperatorId: () => void;
}

function StatusBadge({ status }: { status?: 'verified' | 'suspended' | 'unverified' }) {
    const normalizedStatus = status || 'unverified';
    const styles = {
        verified: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        suspended: 'bg-red-50 text-red-700 border-red-100',
        unverified: 'bg-amber-50 text-amber-700 border-amber-100',
    };
    const labels = {
        verified: 'Verified Account',
        suspended: 'Account Suspended',
        unverified: 'Pending Verification',
    };

    return (
        <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${styles[normalizedStatus]}`}
        >
            {normalizedStatus === 'verified' ? (
                <CheckCircle className="size-3" />
            ) : (
                <AlertCircle className="size-3" />
            )}
            {labels[normalizedStatus]}
        </div>
    );
}

function EditableField({
    label,
    value,
    icon,
    isEditing,
    onStartEdit,
    onSave,
    onChange,
    placeholder,
    mono,
}: {
    label: string;
    value: string;
    icon: React.ReactNode;
    isEditing: boolean;
    onStartEdit: () => void;
    onSave: () => void;
    onChange: (value: string) => void;
    placeholder?: string;
    mono?: boolean;
}) {
    return (
        <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {label}
            </p>
            {isEditing ? (
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={value}
                        onChange={e => onChange(e.target.value)}
                        className={`flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-600 outline-none bg-white font-bold ${mono ? 'font-mono' : ''}`}
                        placeholder={placeholder}
                        autoFocus
                    />
                    <button
                        onClick={onSave}
                        className="p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                        <Save className="size-4" />
                    </button>
                </div>
            ) : (
                <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-2 text-slate-700 min-w-0">
                        {icon}
                        <span
                            className={`font-bold text-sm truncate ${mono ? 'uppercase font-mono' : ''}`}
                        >
                            {value}
                        </span>
                    </div>
                    <button
                        onClick={onStartEdit}
                        className="text-blue-600 hover:underline text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    >
                        Edit
                    </button>
                </div>
            )}
        </div>
    );
}

export function AccountOverviewSection({
    user,
    fullName,
    isEditingFullName,
    onFullNameChange,
    onStartEditFullName,
    onSaveFullName,
    organisationName,
    isEditingOrganisation,
    onOrganisationChange,
    onStartEditOrganisation,
    onSaveOrganisation,
    flyerId,
    isEditingFlyerId,
    onFlyerIdChange,
    onStartEditFlyerId,
    onSaveFlyerId,
    operatorId,
    isEditingOperatorId,
    onOperatorIdChange,
    onStartEditOperatorId,
    onSaveOperatorId,
}: AccountOverviewSectionProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 rounded-2xl  p-4 md:p-5">
            <EditableField
                label="Full Name"
                value={user.fullName || fullName}
                icon={<UserIcon className="size-4 text-slate-400" />}
                isEditing={isEditingFullName}
                onStartEdit={onStartEditFullName}
                onSave={onSaveFullName}
                onChange={onFullNameChange}
            />

            <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Email Address
                </p>
                <div className="flex items-center gap-2 text-slate-700">
                    <Mail className="size-4 text-slate-400" />
                    <span className="font-medium text-slate-700 text-sm break-all">{user.email}</span>
                </div>
            </div>

            <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Account ID
                </p>
                <div className="flex items-center gap-2">
                    <HumanIdChip
                        id={user.id}
                        prefix={user.role === 'landowner' ? 'vt-lo' : 'vt-op'}
                        copyable
                    />
                </div>
            </div>

            <EditableField
                label="Organisation"
                value={user.organisation || 'Not specified'}
                icon={<Building2 className="size-4 text-slate-400" />}
                isEditing={isEditingOrganisation}
                onStartEdit={onStartEditOrganisation}
                onSave={onSaveOrganisation}
                onChange={onOrganisationChange}
            />

            <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Account Type
                </p>
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-slate-700">
                        <Zap className="size-4 text-slate-400" />
                        <span className="font-medium text-slate-700 text-sm capitalize">{user.role}</span>
                    </div>
                    <StatusBadge
                        status={
                            (user.verificationStatus?.toLowerCase() as
                                | 'verified'
                                | 'suspended'
                                | 'unverified') || (user.verified ? 'verified' : 'unverified')
                        }
                    />
                </div>
            </div>

            {user.role === 'operator' && (
                <>
                    <EditableField
                        label="Flyer ID"
                        value={user.flyerId || 'Not registered'}
                        icon={<IdCard className="size-4 text-slate-400" />}
                        isEditing={isEditingFlyerId}
                        onStartEdit={onStartEditFlyerId}
                        onSave={onSaveFlyerId}
                        onChange={onFlyerIdChange}
                        placeholder="e.g. FLY-123456"
                        mono
                    />

                    <EditableField
                        label="Operator ID"
                        value={user.operatorId || 'Not registered'}
                        icon={<ShieldCheck className="size-4 text-slate-400" />}
                        isEditing={isEditingOperatorId}
                        onStartEdit={onStartEditOperatorId}
                        onSave={onSaveOperatorId}
                        onChange={onOperatorIdChange}
                        placeholder="e.g. GBR-OP-123456"
                        mono
                    />
                </>
            )}
        </div>
    );
}
