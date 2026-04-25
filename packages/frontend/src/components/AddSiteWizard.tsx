import { useState, useEffect, useMemo } from 'react';
import type { Site, GeometryType, PendingVerification, Service } from '../types';
import {
    MapPin,
    FileText,
    Shield,
    CheckCircle,
    ChevronRight,
    ChevronLeft,
    ArrowRight,
    Globe,
    PoundSterling,
    Loader2
} from 'lucide-react';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'motion/react';
import { generateVTID } from '../utils/idGenerator';
import * as turf from '@turf/turf';
import { Step1SiteDetails } from './LandownerDashboard/AddSiteWizard/Step1SiteDetails';
import { Step2PolicyRules } from './LandownerDashboard/AddSiteWizard/Step2PolicyRules';
import { Step3MapGeometry } from './LandownerDashboard/AddSiteWizard/Step3MapGeometry';
import { useGeometryState } from '../hooks/useGeometryState';
import { Step4Pricing } from './LandownerDashboard/AddSiteWizard/Step4Pricing';
import { Step5ProofAuthority } from './LandownerDashboard/AddSiteWizard/Step5ProofAuthority';
import { Step6ReviewSubmit } from './LandownerDashboard/AddSiteWizard/Step6ReviewSubmit';

interface AddSiteWizardProps {
    landownerId: string;
    onComplete: (
        site: Site,
        verification: PendingVerification,
        uploadedFiles: {
            policyFiles: File[];
            authorityFiles: File[];
            photoFiles: File[];
        }
    ) => void;
    onCancel: () => void;
    loading?: boolean;
}

type Step = 1 | 2 | 3 | 4 | 5 | 6;

const PRIMARY_BLUE = '#0047FF';

export function AddSiteWizard({ landownerId, onComplete, onCancel, loading = false }: AddSiteWizardProps) {
    const [currentStep, setCurrentStep] = useState<Step>(1);

    // Step 1: Site Details
    const [name, setName] = useState('');
    const [siteCategory, setSiteCategory] = useState('');
    const [siteType, setSiteType] = useState<'toal' | 'emergency'>('toal');
    const [address, setAddress] = useState('');
    const [postcode, setPostcode] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [contactPhone, setContactPhone] = useState('');

    // Step 2: Policy & Rules
    const [validityStart, setValidityStart] = useState('');
    const [validityStartTime, setValidityStartTime] = useState('');
    const [validityEnd, setValidityEnd] = useState('');
    const [validityEndTime, setValidityEndTime] = useState('');
    const [untilFurtherNotice, setUntilFurtherNotice] = useState(false);
    const [autoApprove, setAutoApprove] = useState(false);
    const [exclusiveUse, setExclusiveUse] = useState(true);
    const [emergencyRecoveryEnabled, setEmergencyRecoveryEnabled] = useState(false);
    const [hasPolicy, setHasPolicy] = useState(false);
    const [policyDocument, setPolicyDocument] = useState('');
    const [showPolicyTip, setShowPolicyTip] = useState(false);

    // Step 3: Map & Geometry - using custom hook
    const geometryState = useGeometryState();

    // Local state for site information and photos
    const [sitePhotos, setSitePhotos] = useState<string[]>([]);
    const [sitePhotoFiles, setSitePhotoFiles] = useState<File[]>([]);
    const [siteInformation, setSiteInformation] = useState('');
    const [heightAGL, setHeightAGL] = useState<number | undefined>(undefined);

    // Step 4: Pricing
    const [accessFee, setAccessFee] = useState<string>('');
    const [clzAccessFee, setClzAccessFee] = useState<string>('');

    // Auto-generate Emergency/Recovery buffer for polygons
    useEffect(() => {
        if (
            geometryState.geometryType === 'polygon' &&
            siteType === 'toal' &&
            emergencyRecoveryEnabled &&
            geometryState.polygonPoints.length >= 3 &&
            geometryState.clzPolygonPoints.length === 0
        ) {
            try {
                const coords = [
                    ...geometryState.polygonPoints.map(p => [p[1], p[0]]),
                    [geometryState.polygonPoints[0][1], geometryState.polygonPoints[0][0]],
                ];
                const poly = turf.polygon([coords]);
                const bufferDistanceMeters = Math.max(
                    geometryState.clzRadius - geometryState.radius,
                    50
                );
                const buffered = turf.buffer(poly, bufferDistanceMeters / 1000, {
                    units: 'kilometers',
                });

                if (buffered && buffered.geometry.type === 'Polygon') {
                    const newPoints = buffered.geometry.coordinates[0]
                        .slice(0, -1)
                        .map(c => [c[1], c[0]] as [number, number]);
                    geometryState.setClzPolygonPoints(newPoints);
                }
            } catch (e) {
                console.error('Failed to generate Emergency buffer', e);
            }
        }
    }, [
        geometryState.polygonPoints,
        emergencyRecoveryEnabled,
        geometryState.geometryType,
        geometryState.clzRadius,
        geometryState.radius,
        siteType,
    ]);

    // Step 5: Proof of Authority
    const [authorityDocuments, setAuthorityDocuments] = useState<string[]>([]);
    const [policyDocuments, setPolicyDocuments] = useState<string[]>([]);
    const [authorityFiles, setAuthorityFiles] = useState<File[]>([]);
    const [policyFiles, setPolicyFiles] = useState<File[]>([]);
    const [authorised, setAuthorised] = useState(false);

    // Step 6: T&C acceptance
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    const isClzEnabled = siteType === 'toal' && emergencyRecoveryEnabled;

    // Live Stats
    const geometryStats = useMemo(() => {
        let area = 0;
        const currentCenter =
            siteType === 'emergency' ? geometryState.center : geometryState.center;

        if (geometryState.geometryType === 'circle') {
            const r = siteType === 'emergency' ? geometryState.clzRadius : geometryState.radius;
            area = Math.PI * Math.pow(r, 2);
        } else {
            const points =
                siteType === 'emergency'
                    ? geometryState.clzPolygonPoints
                    : geometryState.polygonPoints;
            if (points.length >= 3) {
                const coords = [...points.map(p => [p[1], p[0]]), [points[0][1], points[0][0]]];
                const polygon = turf.polygon([coords]);
                area = turf.area(polygon);
            }
        }

        return {
            area: area.toLocaleString(undefined, { maximumFractionDigits: 0 }),
            center: `${currentCenter.lat.toFixed(4)}, ${currentCenter.lng.toFixed(4)}`,
        };
    }, [
        geometryState.geometryType,
        geometryState.radius,
        geometryState.polygonPoints,
        geometryState.clzRadius,
        geometryState.clzPolygonPoints,
        geometryState.center,
        siteType,
    ]);

    const handleNext = () => {
        if (currentStep < 6) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setCurrentStep((currentStep + 1) as Step);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setCurrentStep((currentStep - 1) as Step);
        }
    };

    const keepFilesByNames = (files: File[], names: string[]): File[] => {
        const remaining = [...files];
        const nextFiles: File[] = [];

        for (const name of names) {
            const idx = remaining.findIndex(f => f.name === name);
            if (idx >= 0) {
                nextFiles.push(remaining[idx]);
                remaining.splice(idx, 1);
            }
        }

        return nextFiles;
    };

    const handlePolicyDocumentsChange = (names: string[]) => {
        setPolicyDocuments(names);
        setPolicyFiles(prev => keepFilesByNames(prev, names));
    };

    const handleAuthorityDocumentsChange = (names: string[]) => {
        setAuthorityDocuments(names);
        setAuthorityFiles(prev => keepFilesByNames(prev, names));
    };

    const handleSubmit = () => {
        const mainGeometry =
            siteType === 'emergency'
                ? geometryState.geometryType === 'circle'
                    ? {
                          type: 'circle' as const,
                          center: geometryState.center,
                          radius: geometryState.clzRadius,
                          heightAGL,
                      }
                    : {
                          type: 'polygon' as const,
                          points: geometryState.clzPolygonPoints.map(([lat, lng]) => ({
                              lat,
                              lng,
                          })),
                          heightAGL,
                      }
                : geometryState.geometryType === 'circle'
                  ? {
                        type: 'circle' as const,
                        center: geometryState.center,
                        radius: geometryState.radius,
                        heightAGL,
                    }
                  : {
                        type: 'polygon' as const,
                        points: geometryState.polygonPoints.map(([lat, lng]) => ({
                            lat,
                            lng,
                        })),
                        heightAGL,
                    };

        const newSite: Site = {
            id: generateVTID('vt-site'),
            landownerId,
            name,
            siteType: siteType as any,
            siteCategory: siteCategory as any,
            address,
            postcode,
            contactEmail,
            contactPhone,
            geometry: mainGeometry,
            clzGeometry:
                siteType === 'emergency' || emergencyRecoveryEnabled
                    ? siteType === 'emergency'
                        ? mainGeometry
                        : geometryState.geometryType === 'circle'
                          ? {
                                type: 'circle' as const,
                                center: geometryState.center,
                                radius: geometryState.clzRadius,
                            }
                          : {
                                type: 'polygon' as const,
                                points: geometryState.clzPolygonPoints.map(([lat, lng]) => ({
                                    lat,
                                    lng,
                                })),
                            }
                    : undefined,
            validityStart,
            validityEnd: untilFurtherNotice ? undefined : validityEnd,
            autoApprove,
            exclusiveUse,
            emergencyRecoveryEnabled: siteType === 'emergency' ? true : emergencyRecoveryEnabled,
            clzEnabled: siteType === 'emergency' ? true : emergencyRecoveryEnabled,
            policyText: undefined,
            policyDocument: hasPolicy ? policyDocument || undefined : undefined,
            policyDocuments,
            ownershipDocuments: authorityDocuments,
            services: undefined,
            status: 'UNDER_REVIEW',
            photoUrl: sitePhotos.length > 0 ? sitePhotos[0] : undefined,
            toalAccessFee: Number(accessFee),
            clzAccessFee: emergencyRecoveryEnabled ? Number(clzAccessFee) : undefined,
            sitePhotos,
            siteInformation,
            documents: [...policyDocuments, ...authorityDocuments],
            createdAt: new Date().toISOString(),
        };

        const verification: PendingVerification = {
            id: generateVTID('vt-cert'),
            type: 'site',
            siteId: newSite.id,
            siteName: name,
            siteType: siteType as any,
            siteAddress: address,
            sitePostcode: postcode,
            siteGeometry: newSite.geometry,
            clzGeometry: newSite.clzGeometry,
            siteCoordinates:
                geometryState.geometryType === 'circle'
                    ? `Center: ${geometryState.center.lat.toFixed(4)}°, ${geometryState.center.lng.toFixed(4)}° | Radius: ${geometryState.radius}m`
                    : `Polygon with ${geometryState.polygonPoints.length} vertices`,
            siteGeometrySize:
                geometryState.geometryType === 'circle'
                    ? `${geometryState.radius}m radius`
                    : `Polygon area`,
            operationWindowStart: validityStart,
            operationWindowEnd: untilFurtherNotice ? undefined : validityEnd,
            toalOnly: !emergencyRecoveryEnabled,
            exclusiveUse,
            autoApprove,
            authorizedToGrantAccess: authorised,
            acceptedLandownerDeclaration: acceptedTerms,
            toalAccessFee: Number(accessFee),
            clzAccessFee: emergencyRecoveryEnabled ? Number(clzAccessFee) : undefined,
            status: 'PENDING',
            documents: [...policyDocuments, ...authorityDocuments],
            createdAt: new Date().toISOString(),
        };

        onComplete(newSite, verification, {
            policyFiles,
            authorityFiles,
            photoFiles: sitePhotoFiles,
        });
    };

    const handleFileUpload = (
        e: React.ChangeEvent<HTMLInputElement>,
        type: 'authority' | 'policy'
    ) => {
        const files = e.target.files;
        if (files) {
            const selectedFiles = Array.from(files);
            const fileNames = selectedFiles.map(f => f.name);
            if (type === 'authority') {
                setAuthorityDocuments(prev => [...prev, ...fileNames]);
                setAuthorityFiles(prev => [...prev, ...selectedFiles]);
            } else {
                setPolicyDocuments(prev => [...prev, ...fileNames]);
                setPolicyFiles(prev => [...prev, ...selectedFiles]);
            }

            e.target.value = '';
        }
    };

    const isStep1Valid =
        name && siteType && siteCategory && address && postcode && contactEmail && contactPhone;
    const isStep2Valid =
        validityStart &&
        validityStartTime &&
        (!untilFurtherNotice ? validityEnd && validityEndTime : true) &&
        (hasPolicy ? policyDocument : true);
    const isStep3Valid =
        (siteType === 'emergency'
            ? geometryState.geometryType === 'circle'
                ? geometryState.clzRadius > 0
                : geometryState.clzPolygonPoints.length >= 3
            : geometryState.geometryType === 'circle'
              ? geometryState.radius > 0 &&
                (emergencyRecoveryEnabled ? geometryState.clzRadius > 0 : true)
              : geometryState.polygonPoints.length >= 3 &&
                (emergencyRecoveryEnabled ? geometryState.clzPolygonPoints.length >= 3 : true)) &&
        siteInformation;
    const isStep4Valid =
        accessFee &&
        Number(accessFee) >= 0 &&
        (emergencyRecoveryEnabled ? clzAccessFee && Number(clzAccessFee) >= 0 : true);
    const isStep5Valid = authorityDocuments.length > 0 && authorised;
    const isStep6Valid = acceptedTerms;

    const steps = [
        { label: 'Details', icon: MapPin },
        { label: 'Policy', icon: FileText },
        { label: 'Map', icon: Globe },
        { label: 'Pricing', icon: PoundSterling },
        { label: 'Proof', icon: Shield },
        { label: 'Submit', icon: CheckCircle },
    ];

    return (
        <div className="max-w-4xl mx-auto pb-20">
            {/* Header & Stepper */}
            <div className="mb-12">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-bold text-slate-900">Add New Site</h1>
                    <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold border border-blue-100">
                        Step {currentStep} of 6
                    </div>
                </div>

                <div className="relative flex items-center justify-between px-2">
                    {/* Progress Line */}
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -z-10 -translate-y-1/2" />
                    <div
                        className="absolute top-1/2 left-0 h-0.5 bg-blue-600 -z-10 -translate-y-1/2 transition-all duration-500"
                        style={{ width: `${((currentStep - 1) / 5) * 100}%` }}
                    />

                    {steps.map((step, idx) => {
                        const stepNum = idx + 1;
                        const isCompleted = stepNum < currentStep;
                        const isActive = stepNum === currentStep;

                        return (
                            <div key={idx} className="flex flex-col items-center gap-2">
                                <div
                                    className={`size-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                                        isCompleted
                                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20'
                                            : isActive
                                              ? 'bg-white border-blue-600 text-blue-600 shadow-lg shadow-blue-500/10'
                                              : 'bg-white border-slate-200 text-slate-400'
                                    }`}
                                >
                                    {isCompleted ? (
                                        <CheckCircle className="size-5" />
                                    ) : (
                                        <span className="text-sm font-bold">{stepNum}</span>
                                    )}
                                </div>
                                <span
                                    className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-blue-600' : 'text-slate-400'}`}
                                >
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-white rounded-2xl border border-slate-200 shadow-[0_4px_12px_rgba(0,0,0,0.05)] p-8 md:p-10"
                >
                    {/* Step 1: Site Details */}
                    {currentStep === 1 && (
                        <Step1SiteDetails
                            name={name}
                            setName={setName}
                            siteCategory={siteCategory}
                            setSiteCategory={setSiteCategory}
                            siteType={siteType}
                            setSiteType={setSiteType}
                            address={address}
                            setAddress={setAddress}
                            postcode={postcode}
                            setPostcode={setPostcode}
                            contactEmail={contactEmail}
                            setContactEmail={setContactEmail}
                            contactPhone={contactPhone}
                            setContactPhone={setContactPhone}
                        />
                    )}

                    {/* Step 2: Policy & Rules */}
                    {currentStep === 2 && (
                        <Step2PolicyRules
                            validityStart={validityStart}
                            setValidityStart={setValidityStart}
                            validityStartTime={validityStartTime}
                            setValidityStartTime={setValidityStartTime}
                            validityEnd={validityEnd}
                            setValidityEnd={setValidityEnd}
                            validityEndTime={validityEndTime}
                            setValidityEndTime={setValidityEndTime}
                            untilFurtherNotice={untilFurtherNotice}
                            setUntilFurtherNotice={setUntilFurtherNotice}
                            policyDocuments={policyDocuments}
                            setPolicyDocuments={handlePolicyDocumentsChange}
                            autoApprove={autoApprove}
                            setAutoApprove={setAutoApprove}
                            emergencyRecoveryEnabled={emergencyRecoveryEnabled}
                            setEmergencyRecoveryEnabled={setEmergencyRecoveryEnabled}
                            siteType={siteType}
                            handleFileUpload={handleFileUpload}
                        />
                    )}

                    {/* Step 3: Map & Geometry */}
                    {currentStep === 3 && (
                        <Step3MapGeometry
                            geometryType={geometryState.geometryType}
                            setGeometryType={geometryState.setGeometryType}
                            center={geometryState.center}
                            setCenter={geometryState.setCenter}
                            radius={geometryState.radius}
                            setRadius={geometryState.setRadius}
                            clzRadius={geometryState.clzRadius}
                            setClzRadius={geometryState.setClzRadius}
                            polygonPoints={geometryState.polygonPoints}
                            setPolygonPoints={geometryState.setPolygonPoints}
                            clzPolygonPoints={geometryState.clzPolygonPoints}
                            setClzPolygonPoints={geometryState.setClzPolygonPoints}
                            drawingMode={geometryState.drawingMode}
                            setDrawingMode={geometryState.setDrawingMode}
                            siteType={siteType}
                            emergencyRecoveryEnabled={emergencyRecoveryEnabled}
                            siteCategory={siteCategory}
                            geometryStats={geometryStats}
                            onSiteInformationChange={setSiteInformation}
                            onSitePhotosChange={setSitePhotos}
                            onSitePhotoFilesChange={setSitePhotoFiles}
                            initialSiteInformation={siteInformation}
                            initialSitePhotos={sitePhotos}
                            initialSitePhotoFiles={sitePhotoFiles}
                        />
                    )}

                    {/* Step 4: Pricing */}
                    {currentStep === 4 && (
                        <Step4Pricing
                            accessFee={accessFee}
                            setAccessFee={setAccessFee}
                            clzAccessFee={clzAccessFee}
                            setClzAccessFee={setClzAccessFee}
                            siteType={siteType}
                            emergencyRecoveryEnabled={emergencyRecoveryEnabled}
                            siteCategory={siteCategory}
                        />
                    )}

                    {/* Step 5: Proof of Authority */}
                    {currentStep === 5 && (
                        <Step5ProofAuthority
                            authorityDocuments={authorityDocuments}
                            setAuthorityDocuments={handleAuthorityDocumentsChange}
                            authorised={authorised}
                            setAuthorised={setAuthorised}
                            handleFileUpload={handleFileUpload}
                        />
                    )}

                    {/* Step 6: Review & Submit */}
                    {currentStep === 6 && (
                        <Step6ReviewSubmit
                            name={name}
                            siteType={siteType}
                            siteCategory={siteCategory}
                            address={address}
                            autoApprove={autoApprove}
                            isClzEnabled={isClzEnabled}
                            siteInformation={siteInformation}
                            sitePhotos={sitePhotos}
                            policyDocuments={policyDocuments}
                            authorityDocuments={authorityDocuments}
                            accessFee={accessFee}
                            clzAccessFee={clzAccessFee}
                            geometryType={geometryState.geometryType}
                            center={geometryState.center}
                            radius={geometryState.radius}
                            polygonPoints={geometryState.polygonPoints}
                            clzCenter={geometryState.center}
                            clzPolygonPoints={geometryState.clzPolygonPoints}
                            clzRadius={geometryState.clzRadius}
                            acceptedTerms={acceptedTerms}
                            setAcceptedTerms={setAcceptedTerms}
                            setCurrentStep={setCurrentStep}
                        />
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 py-4 z-40">
                <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
                    <button
                        onClick={onCancel}
                        className="px-6 py-2.5 text-slate-500 hover:text-slate-800 text-sm font-bold transition-colors"
                    >
                        Cancel
                    </button>

                    <div className="flex gap-4">
                        {currentStep > 1 && (
                            <button
                                onClick={handleBack}
                                className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all flex items-center gap-2"
                            >
                                <ChevronLeft className="size-4" />
                                Back
                            </button>
                        )}

                        {currentStep < 6 ? (
                            <Button
                                onClick={handleNext}
                                disabled={
                                    (currentStep === 1 && !isStep1Valid) ||
                                    (currentStep === 2 && !isStep2Valid) ||
                                    (currentStep === 3 && !isStep3Valid) ||
                                    (currentStep === 4 && !isStep4Valid) ||
                                    (currentStep === 5 && !isStep5Valid)
                                }
                                className="px-10 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
                            >
                                Continue
                                <ChevronRight className="size-4" />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSubmit}
                                loading={loading}
                                disabled={!isStep6Valid}
                                className="px-10 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
                            >
                                Submit Site for Verification
                                <ArrowRight className="size-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
