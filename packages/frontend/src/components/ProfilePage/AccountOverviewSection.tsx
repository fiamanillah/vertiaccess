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
    X,
    Loader2,
    Pencil,
} from 'lucide-react';
import { HumanIdChip } from '../ui/HumanIdChip';

interface AccountOverviewSectionProps {
    user: User;
    fullName: string;
    isEditingFullName: boolean;
    onFullNameChange: (value: string) => void;
    onStartEditFullName: () => void;
    onSaveFullName: () => void;
    onCancelFullName: () => void;
    isSavingFullName: boolean;
    organisationName: string;
    isEditingOrganisation: boolean;
    onOrganisationChange: (value: string) => void;
    onStartEditOrganisation: () => void;
    onSaveOrganisation: () => void;
    onCancelOrganisation: () => void;
    isSavingOrganisation: boolean;
    flyerId: string;
    isEditingFlyerId: boolean;
    onFlyerIdChange: (value: string) => void;
    onStartEditFlyerId: () => void;
    onSaveFlyerId: () => void;
    onCancelFlyerId: () => void;
    isSavingFlyerId: boolean;
    operatorId: string;
    isEditingOperatorId: boolean;
    onOperatorIdChange: (value: string) => void;
    onStartEditOperatorId: () => void;
    onSaveOperatorId: () => void;
    onCancelOperatorId: () => void;
    isSavingOperatorId: boolean;
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
    displayValue,
    originalValue,
    icon,
    isEditing,
    onStartEdit,
    onSave,
    onCancel,
    onChange,
    placeholder,
    mono,
    isSaving,
    required,
}: {
    label: string;
    value: string;
    displayValue: string;
    originalValue: string;
    icon: React.ReactNode;
    isEditing: boolean;
    onStartEdit: () => void;
    onSave: () => void;
    onCancel: () => void;
    onChange: (value: string) => void;
    placeholder?: string;
    mono?: boolean;
    isSaving: boolean;
    required?: boolean;
}) {
    const normalizedValue = value.trim();
    const normalizedOriginal = originalValue.trim();
    const hasChanges = normalizedValue !== normalizedOriginal;
    const isInvalid = required ? !normalizedValue : false;
    const disableSave = isSaving || !hasChanges || isInvalid;

    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {label}
                </p>
                {!isEditing && (
                    <button
                        onClick={onStartEdit}
                        className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-xs font-bold transition-colors"
                    >
                        <Pencil className="size-3" />
                        Edit
                    </button>
                )}
            </div>
            {isEditing ? (
                <div className="space-y-2">
                    <input
                        type="text"
                        value={value}
                        onChange={e => onChange(e.target.value)}
                        disabled={isSaving}
                        className={`w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none bg-white font-bold disabled:bg-slate-50 disabled:text-slate-500 ${mono ? 'font-mono uppercase' : ''}`}
                        placeholder={placeholder}
                        autoFocus
                    />
                    <div className="flex items-center justify-end gap-2">
                        <button
                            onClick={onCancel}
                            disabled={isSaving}
                            aria-label={`Cancel ${label} edit`}
                            className="p-2 border border-slate-200 text-slate-600 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <X className="size-4" />
                        </button>
                        <button
                            onClick={onSave}
                            disabled={disableSave}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <Save className="size-4" />
                            )}
                            <span className="text-xs font-bold">
                                {isSaving ? 'Saving...' : 'Save'}
                            </span>
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-2 text-slate-700 min-w-0">
                        {icon}
                        <span
                            className={`font-bold text-sm truncate ${mono ? 'uppercase font-mono' : ''}`}
                        >
                            {displayValue}
                        </span>
                    </div>
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
    onCancelFullName,
    isSavingFullName,
    organisationName,
    isEditingOrganisation,
    onOrganisationChange,
    onStartEditOrganisation,
    onSaveOrganisation,
    onCancelOrganisation,
    isSavingOrganisation,
    flyerId,
    isEditingFlyerId,
    onFlyerIdChange,
    onStartEditFlyerId,
    onSaveFlyerId,
    onCancelFlyerId,
    isSavingFlyerId,
    operatorId,
    isEditingOperatorId,
    onOperatorIdChange,
    onStartEditOperatorId,
    onSaveOperatorId,
    onCancelOperatorId,
    isSavingOperatorId,
}: AccountOverviewSectionProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 rounded-2xl p-4 md:p-5">
            <EditableField
                label="Full Name"
                value={fullName}
                displayValue={user.fullName || 'Not specified'}
                originalValue={user.fullName || ''}
                icon={<UserIcon className="size-4 text-slate-400" />}
                isEditing={isEditingFullName}
                onStartEdit={onStartEditFullName}
                onSave={onSaveFullName}
                onCancel={onCancelFullName}
                onChange={onFullNameChange}
                isSaving={isSavingFullName}
                required
            />

            <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Email Address
                </p>
                <div className="flex items-center gap-2 text-slate-700">
                    <Mail className="size-4 text-slate-400" />
                    <span className="font-medium text-slate-700 text-sm break-all">
                        {user.email}
                    </span>
                </div>
            </div>

            <EditableField
                label="Organisation"
                value={organisationName}
                displayValue={organisationName.trim() || user.organisation || 'Not specified'}
                originalValue={user.organisation || ''}
                icon={<Building2 className="size-4 text-slate-400" />}
                isEditing={isEditingOrganisation}
                onStartEdit={onStartEditOrganisation}
                onSave={onSaveOrganisation}
                onCancel={onCancelOrganisation}
                onChange={onOrganisationChange}
                isSaving={isSavingOrganisation}
            />

            <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Account Type
                </p>
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-slate-700">
                        <Zap className="size-4 text-slate-400" />
                        <span className="font-medium text-slate-700 text-sm capitalize">
                            {user.role}
                        </span>
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

            <div className="md:col-span-2 space-y-1 pt-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Account ID
                </p>
                <div className="flex items-center">
                    <HumanIdChip
                        id={user.id}
                        prefix={user.role === 'landowner' ? 'vt-lo' : 'vt-op'}
                        copyable
                    />
                </div>
            </div>

            {user.role === 'operator' && (
                <>
                    <EditableField
                        label="Flyer ID"
                        value={flyerId}
                        displayValue={user.flyerId || 'Not registered'}
                        originalValue={user.flyerId || ''}
                        icon={<IdCard className="size-4 text-slate-400" />}
                        isEditing={isEditingFlyerId}
                        onStartEdit={onStartEditFlyerId}
                        onSave={onSaveFlyerId}
                        onCancel={onCancelFlyerId}
                        onChange={onFlyerIdChange}
                        placeholder="e.g. FLY-123456"
                        mono
                        isSaving={isSavingFlyerId}
                    />

                    <EditableField
                        label="Operator ID"
                        value={operatorId}
                        displayValue={user.operatorId || 'Not registered'}
                        originalValue={user.operatorId || ''}
                        icon={<ShieldCheck className="size-4 text-slate-400" />}
                        isEditing={isEditingOperatorId}
                        onStartEdit={onStartEditOperatorId}
                        onSave={onSaveOperatorId}
                        onCancel={onCancelOperatorId}
                        onChange={onOperatorIdChange}
                        placeholder="e.g. GBR-OP-123456"
                        mono
                        isSaving={isSavingOperatorId}
                    />
                </>
            )}
        </div>
    );
}
