import { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

interface SecurityDataManagementProps {
    onChangePassword: (
        currentPassword: string,
        newPassword: string,
        confirmPassword: string
    ) => void;
}

export function SecurityDataManagement({ onChangePassword }: SecurityDataManagementProps) {
    // All state is LOCAL — keystrokes no longer trigger parent re-renders
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSubmit = () => {
        setPasswordError('');
        if (!currentPassword || !newPassword || !confirmPassword) {
            setPasswordError('All password fields are required');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError('New passwords do not match');
            return;
        }
        if (newPassword.length < 8) {
            setPasswordError('Password must be at least 8 characters');
            return;
        }
        onChangePassword(currentPassword, newPassword, confirmPassword);
        setIsChangingPassword(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    };

    const handleCancel = () => {
        setIsChangingPassword(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordError('');
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-50/50 rounded-2xl p-6  flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="size-10 bg-white rounded-xl flex items-center justify-center border border-slate-100 text-slate-400 shadow-sm">
                        <Lock className="size-5" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-900">Account Password</p>
                        <p className="text-xs text-slate-500">Last updated 3 months ago</p>
                    </div>
                </div>
                {!isChangingPassword && (
                    <button
                        onClick={() => setIsChangingPassword(true)}
                        className="h-9 px-4 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all"
                    >
                        Update
                    </button>
                )}
            </div>

            {isChangingPassword && (
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Current Password */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                                Current Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showCurrentPassword ? 'text' : 'password'}
                                    value={currentPassword}
                                    onChange={e => setCurrentPassword(e.target.value)}
                                    className="w-full h-11 bg-white border border-slate-200 rounded-xl px-4 pr-12 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    tabIndex={-1}
                                    onClick={() => setShowCurrentPassword(p => !p)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showCurrentPassword ? (
                                        <EyeOff className="size-4" />
                                    ) : (
                                        <Eye className="size-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* New Password */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showNewPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    className="w-full h-11 bg-white border border-slate-200 rounded-xl px-4 pr-12 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    tabIndex={-1}
                                    onClick={() => setShowNewPassword(p => !p)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showNewPassword ? (
                                        <EyeOff className="size-4" />
                                    ) : (
                                        <Eye className="size-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    className="w-full h-11 bg-white border border-slate-200 rounded-xl px-4 pr-12 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    tabIndex={-1}
                                    onClick={() => setShowConfirmPassword(p => !p)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="size-4" />
                                    ) : (
                                        <Eye className="size-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {passwordError && (
                        <p className="text-xs font-bold text-red-500 ml-1">{passwordError}</p>
                    )}

                    <div className="flex gap-2">
                        <button
                            onClick={handleSubmit}
                            className="h-10 px-6 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all"
                        >
                            Save New Password
                        </button>
                        <button
                            onClick={handleCancel}
                            className="h-10 px-6 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
