import { useEffect, useRef, useState } from 'react';
import type { User } from '../App';
import { toast } from 'sonner';
import { SecurityDataManagement } from './ProfilePage/SecurityDataManagement';
import { ProfileModalShell } from './ProfilePage/ProfileModalShell';
import { SectionBlock } from './ProfilePage/SectionBlock';
import { DeactivateAccountDialog } from './ProfilePage/DeactivateAccountDialog';
import { useAuth } from '../context/AuthContext';
import { uploadAndRegisterFile } from '../lib/sites';
import {
    apiSubmitIdentity,
    apiSubmitOperatorVerificationWithDocuments,
    cognitoChangePassword,
} from '../lib/auth';
import { activateBillingPlan, fetchPublicPlans, type BillingPlan } from '../lib/billing';
import { getLandownerBalance } from '../lib/withdrawals';
import { AccountOverviewSection } from './ProfilePage/AccountOverviewSection';
import { IdentityVerificationSection } from './ProfilePage/IdentityVerificationSection';
import { BillingSection } from './ProfilePage/BillingSection';
import { DangerZoneSection } from './ProfilePage/DangerZoneSection';
import type {
    OperatorIdentityDoc,
    OperatorSupportingDoc,
    PaymentCard,
    WithdrawalMethod,
} from './ProfilePage/ProfileTypes';

interface ProfilePageProps {
    user: User;
    onClose: () => void;
    onOpenPaymentSettings: () => void;
    onUpdateUser: (user: User) => void;
    onLogout?: () => void;
    totalRevenue?: number;
    scrollToVerification?: boolean;
    rejectionNote?: string | null;
}

export function ProfilePage({
    user,
    onClose,
    onOpenPaymentSettings,
    onUpdateUser,
    scrollToVerification,
    rejectionNote,
}: ProfilePageProps) {
    const { idToken } = useAuth();
    const isLandowner = user.role === 'landowner';
    const isAdmin = user.role === 'admin';

    const [isUploadingId, setIsUploadingId] = useState(false);
    const [isSubmittingOperatorVerification, setIsSubmittingOperatorVerification] = useState(false);
    const [isUploadingOperatorDoc, setIsUploadingOperatorDoc] = useState(false);
    const [operatorSupportingDocs, setOperatorSupportingDocs] = useState<OperatorSupportingDoc[]>(
        []
    );
    const [operatorIdentityDoc, setOperatorIdentityDoc] = useState<OperatorIdentityDoc | null>(
        null
    );

    const [savedPaymentCards, setSavedPaymentCards] = useState<PaymentCard[]>([]);
    const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(false);

    const [isLoadingWithdrawalMethod, setIsLoadingWithdrawalMethod] = useState(false);
    const [withdrawalMethod, setWithdrawalMethod] = useState<WithdrawalMethod | null>(null);

    const [isEditingOrganisation, setIsEditingOrganisation] = useState(false);
    const [organisationName, setOrganisationName] = useState(user.organisation || '');
    const [isEditingFullName, setIsEditingFullName] = useState(false);
    const [fullName, setFullName] = useState(
        user.fullName || (isAdmin ? 'Admin User' : 'Akshava Ariz')
    );
    const [isEditingFlyerId, setIsEditingFlyerId] = useState(false);
    const [flyerId, setFlyerId] = useState(user.flyerId || '');
    const [isEditingOperatorId, setIsEditingOperatorId] = useState(false);
    const [operatorId, setOperatorId] = useState(user.operatorId || '');

    const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<
        'Professional' | 'Growth' | 'Enterprise' | 'Standard' | 'Advanced'
    >(user.planTier || 'Professional');
    const [publicPlans, setPublicPlans] = useState<BillingPlan[]>([]);
    const [isLoadingPlans, setIsLoadingPlans] = useState(false);

    const [identificationDocType, setIdentificationDocType] = useState<'national_id' | 'passport'>(
        'national_id'
    );
    const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
    const verificationSectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!idToken || isLandowner) return;

        const fetchPaymentMethods = async () => {
            try {
                setIsLoadingPaymentMethods(true);
                const response = await fetch(
                    `${(import.meta as any).env.VITE_API_URL}/billing/v1/payment-methods`,
                    {
                        method: 'GET',
                        headers: {
                            Authorization: `Bearer ${idToken}`,
                        },
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    setSavedPaymentCards(data.data || []);
                }
            } catch (error) {
                console.error('Failed to fetch payment methods:', error);
            } finally {
                setIsLoadingPaymentMethods(false);
            }
        };

        void fetchPaymentMethods();
    }, [idToken, isLandowner]);

    useEffect(() => {
        if (!idToken || !isLandowner) return;

        let mounted = true;

        const fetchWithdrawalMethod = async () => {
            try {
                setIsLoadingWithdrawalMethod(true);
                const balance = await getLandownerBalance(idToken);
                if (!mounted) return;

                setWithdrawalMethod({
                    connected: Boolean(balance.stripeConnected),
                    provider: 'Stripe Connect',
                    currency: balance.currency || 'GBP',
                    lastSyncedAt: balance.lastCalculatedAt || null,
                });
            } catch {
                if (mounted) {
                    setWithdrawalMethod({
                        connected: false,
                        provider: 'Stripe Connect',
                        currency: 'GBP',
                        lastSyncedAt: null,
                    });
                }
            } finally {
                if (mounted) {
                    setIsLoadingWithdrawalMethod(false);
                }
            }
        };

        void fetchWithdrawalMethod();

        return () => {
            mounted = false;
        };
    }, [idToken, isLandowner]);

    useEffect(() => {
        if (scrollToVerification && verificationSectionRef.current) {
            const timeoutId = window.setTimeout(() => {
                verificationSectionRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                });
            }, 250);
            return () => window.clearTimeout(timeoutId);
        }
    }, [scrollToVerification]);

    useEffect(() => {
        if (isLandowner) {
            setIsLoadingPlans(false);
            return;
        }

        let isMounted = true;
        setIsLoadingPlans(true);
        fetchPublicPlans()
            .then(plans => {
                if (isMounted) {
                    setPublicPlans(plans.filter(p => p.isActive));
                }
            })
            .catch(error => console.error('Failed to load plans:', error))
            .finally(() => {
                if (isMounted) {
                    setIsLoadingPlans(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [isLandowner]);

    const handleSaveOrganisation = () => {
        if (organisationName.trim()) {
            onUpdateUser({ ...user, organisation: organisationName.trim() });
            setIsEditingOrganisation(false);
        }
    };

    const handleSaveFullName = () => {
        if (fullName.trim()) {
            onUpdateUser({ ...user, fullName: fullName.trim() });
            setIsEditingFullName(false);
        }
    };

    const handleSaveFlyerId = () => {
        onUpdateUser({ ...user, flyerId: flyerId.trim() || undefined });
        setIsEditingFlyerId(false);
    };

    const handleSaveOperatorId = () => {
        onUpdateUser({ ...user, operatorId: operatorId.trim() || undefined });
        setIsEditingOperatorId(false);
    };

    const handleUpdatePlan = async () => {
        const planObj = publicPlans.find(p => p.name === selectedPlan);
        if (!planObj) {
            toast.error('Invalid plan selected.');
            return;
        }

        if (savedPaymentCards.length === 0) {
            toast.error('You need to add a Payment Method first before upgrading.');
            onOpenPaymentSettings();
            return;
        }

        const defaultCard = savedPaymentCards.find(c => c.isDefault) || savedPaymentCards[0]!;

        setIsUpdatingPlan(true);
        try {
            await activateBillingPlan({
                idToken: idToken || '',
                planId: planObj.id,
                paymentMethodId: defaultCard.stripePaymentMethodId,
                interval: planObj.billingType === 'subscription' ? 'month' : undefined,
            });

            const isPAYG = planObj.billingType === 'payg';
            onUpdateUser({ ...user, planTier: selectedPlan, isPAYG, subscriptionStatus: 'ACTIVE' });
            toast.success(`Successfully activated ${selectedPlan} plan!`);
        } catch (error: any) {
            toast.error(
                error?.message || 'Failed to update plan. Please check your payment method.'
            );
        } finally {
            setIsUpdatingPlan(false);
        }
    };

    const handleCancelSubscription = () => {
        if (
            confirm(
                'Are you sure you want to cancel your subscription? Your account will remain active but will revert to Pay-As-You-Go after the current billing cycle.'
            )
        ) {
            onUpdateUser({ ...user, planTier: undefined, isPAYG: true });
        }
    };

    const calculateNextBillingDate = () => {
        if (user.subscriptionStartDate) {
            const startDate = new Date(user.subscriptionStartDate);
            const nextBillingDate = new Date(startDate);
            nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
            return nextBillingDate;
        }

        const nextBillingDate = new Date();
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
        return nextBillingDate;
    };

    const confirmDeactivateAccount = () => {
        const formattedDate = calculateNextBillingDate().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        onUpdateUser({
            ...user,
            deactivationDate: new Date().toISOString(),
        });
        toast.success(
            `Account deactivated. You will continue to have access until ${formattedDate}.`
        );
        setShowDeactivateDialog(false);
    };

    const handleChangePassword = async (
        currentPassword: string,
        newPassword: string,
        confirmPassword: string
    ) => {
        if (newPassword !== confirmPassword) {
            throw new Error('New passwords do not match');
        }

        await cognitoChangePassword(currentPassword, newPassword);
        toast.success('Password changed successfully!');
    };

    const handleIdentificationUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !idToken) return;

        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            toast.info('Please upload a PDF, JPG, or PNG file');
            return;
        }

        setIsUploadingId(true);
        try {
            const { fileKey } = await uploadAndRegisterFile(
                idToken,
                file,
                undefined,
                'ownership' as any
            );
            const fileUrl = URL.createObjectURL(file);
            if (user.role === 'landowner') {
                await apiSubmitIdentity(idToken, identificationDocType, fileKey);
                toast.success(
                    'Identity document submitted successfully. It will be reviewed by our team.'
                );
                onUpdateUser({
                    ...user,
                    hasPendingVerification: true,
                    identificationDocument: {
                        type: identificationDocType,
                        fileName: file.name,
                        fileUrl,
                        uploadedAt: new Date().toISOString(),
                    },
                });
            } else {
                setOperatorIdentityDoc({
                    type: identificationDocType,
                    fileKey,
                    fileName: file.name,
                    fileUrl,
                });
                toast.success('Identity document attached.');
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to upload document');
        } finally {
            setIsUploadingId(false);
            e.target.value = '';
        }
    };

    const handleSubmitOperatorVerification = async () => {
        if (!idToken) return;

        if (!operatorIdentityDoc) {
            toast.error('Identity document is strictly required.');
            return;
        }

        if (operatorSupportingDocs.length === 0) {
            toast.error('A Drone Operator License (Supporting Document) is strictly required.');
            return;
        }

        setIsSubmittingOperatorVerification(true);
        try {
            await apiSubmitOperatorVerificationWithDocuments(
                idToken,
                operatorSupportingDocs.map(doc => ({
                    fileKey: doc.fileKey,
                    fileName: doc.fileName,
                })),
                {
                    documentType: operatorIdentityDoc.type,
                    fileKey: operatorIdentityDoc.fileKey,
                }
            );
            toast.success(
                'Your operator credentials have been submitted for review. You will be notified once approved.'
            );
            onUpdateUser({ ...user, hasPendingVerification: true });
        } catch (error: any) {
            toast.error(error.message || 'Failed to submit operator verification');
        } finally {
            setIsSubmittingOperatorVerification(false);
        }
    };

    const handleOperatorDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !idToken) return;

        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            toast.info('Please upload a PDF, JPG, or PNG file');
            return;
        }

        setIsUploadingOperatorDoc(true);
        try {
            const { fileKey } = await uploadAndRegisterFile(
                idToken,
                file,
                undefined,
                'ownership' as any
            );
            setOperatorSupportingDocs(prev => [
                ...prev,
                {
                    fileKey,
                    fileName: file.name,
                    uploadedAt: new Date().toISOString(),
                },
            ]);
            toast.success('Supporting document added');
        } catch (error: any) {
            toast.error(error.message || 'Failed to upload supporting document');
        } finally {
            setIsUploadingOperatorDoc(false);
            e.target.value = '';
        }
    };

    const handleRemoveOperatorDocument = (fileKey: string) => {
        setOperatorSupportingDocs(prev => prev.filter(doc => doc.fileKey !== fileKey));
    };

    const handleRemoveIdentification = () => {
        if (confirm('Are you sure you want to remove your identification document?')) {
            onUpdateUser({ ...user, identificationDocument: undefined });
        }
    };

    return (
        <ProfileModalShell
            title={isAdmin ? 'Admin Profile' : 'My Profile'}
            subtitle={
                isAdmin
                    ? 'Manage your administrative settings'
                    : 'Manage your personal settings and account status'
            }
            onClose={onClose}
        >
            {user.verificationStatus === 'REJECTED' && rejectionNote && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 shadow-sm mb-4">
                    <div className="size-8 bg-red-100 rounded-lg flex items-center justify-center shrink-0 text-red-600">
                        <span className="font-bold text-lg">!</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-red-900 leading-tight mb-1">
                            Verification Rejected
                        </h3>
                        <p className="text-sm text-red-700 max-w-2xl leading-relaxed">
                            {rejectionNote}
                        </p>
                    </div>
                </div>
            )}
            <SectionBlock title="Account Overview">
                <AccountOverviewSection
                    user={user}
                    fullName={fullName}
                    isEditingFullName={isEditingFullName}
                    onFullNameChange={setFullName}
                    onStartEditFullName={() => setIsEditingFullName(true)}
                    onSaveFullName={handleSaveFullName}
                    organisationName={organisationName}
                    isEditingOrganisation={isEditingOrganisation}
                    onOrganisationChange={setOrganisationName}
                    onStartEditOrganisation={() => setIsEditingOrganisation(true)}
                    onSaveOrganisation={handleSaveOrganisation}
                    flyerId={flyerId}
                    isEditingFlyerId={isEditingFlyerId}
                    onFlyerIdChange={setFlyerId}
                    onStartEditFlyerId={() => setIsEditingFlyerId(true)}
                    onSaveFlyerId={handleSaveFlyerId}
                    operatorId={operatorId}
                    isEditingOperatorId={isEditingOperatorId}
                    onOperatorIdChange={setOperatorId}
                    onStartEditOperatorId={() => setIsEditingOperatorId(true)}
                    onSaveOperatorId={handleSaveOperatorId}
                />
            </SectionBlock>

            {!isAdmin && (
                <>
                    <SectionBlock title="Identity Verification">
                        <IdentityVerificationSection
                            user={user}
                            verificationSectionRef={verificationSectionRef}
                            identificationDocType={identificationDocType}
                            setIdentificationDocType={setIdentificationDocType}
                            isUploadingId={isUploadingId}
                            onIdentificationUpload={handleIdentificationUpload}
                            operatorIdentityDoc={operatorIdentityDoc}
                            setOperatorIdentityDoc={setOperatorIdentityDoc}
                            operatorSupportingDocs={operatorSupportingDocs}
                            isUploadingOperatorDoc={isUploadingOperatorDoc}
                            onOperatorDocumentUpload={handleOperatorDocumentUpload}
                            onRemoveOperatorDocument={handleRemoveOperatorDocument}
                            onSubmitOperatorVerification={handleSubmitOperatorVerification}
                            isSubmittingOperatorVerification={isSubmittingOperatorVerification}
                            onRemoveIdentification={handleRemoveIdentification}
                        />
                    </SectionBlock>

                    <SectionBlock title={isLandowner ? 'Payments' : 'Subscription & Payment'}>
                        <BillingSection
                            user={user}
                            isLandowner={isLandowner}
                            isLoadingWithdrawalMethod={isLoadingWithdrawalMethod}
                            withdrawalMethod={withdrawalMethod}
                            savedPaymentCards={savedPaymentCards}
                            isLoadingPaymentMethods={isLoadingPaymentMethods}
                            onOpenPaymentSettings={onOpenPaymentSettings}
                            isUpdatingPlan={isUpdatingPlan}
                            setIsUpdatingPlan={setIsUpdatingPlan}
                            isLoadingPlans={isLoadingPlans}
                            selectedPlan={selectedPlan}
                            setSelectedPlan={setSelectedPlan}
                            publicPlans={publicPlans}
                            onUpdatePlan={handleUpdatePlan}
                            onCancelSubscription={handleCancelSubscription}
                        />
                    </SectionBlock>
                </>
            )}

            <SectionBlock title="Security & Data Management">
                <SecurityDataManagement onChangePassword={handleChangePassword} />
            </SectionBlock>

            {!isAdmin && (
                <SectionBlock title="Danger Zone">
                    <DangerZoneSection onDeactivateAccount={() => setShowDeactivateDialog(true)} />
                </SectionBlock>
            )}

            <DeactivateAccountDialog
                open={showDeactivateDialog}
                accessUntilDate={calculateNextBillingDate().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                })}
                onCancel={() => setShowDeactivateDialog(false)}
                onConfirm={confirmDeactivateAccount}
            />
        </ProfileModalShell>
    );
}
