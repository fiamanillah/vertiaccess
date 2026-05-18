'use client';

import * as React from 'react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from '@workspace/ui/components/dialog';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@workspace/ui/components/tooltip';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { Separator } from '@workspace/ui/components/separator';
import { PreviewMap } from '@/components/map/preview-map';
import {
	MapPin,
	Building2,
	Phone,
	Mail,
	Calendar as CalendarIcon,
	Banknote,
	FileText,
	Clock,
	Edit,
	Image as ImageIcon,
	CheckCircle2,
	AlertTriangle,
} from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import { toast } from 'sonner';
import { DetailedSite } from '../schema';

interface SitePreviewModalProps {
	site: DetailedSite | null;
	isOpen: boolean;
	onClose: () => void;
	onEdit?: (siteId: string) => void;
}

function InfoSection({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
	return (
		<div className="space-y-3">
			<div className="flex items-center gap-2 text-primary">
				<Icon className="h-4 w-4" />
				<h4 className="font-bold text-sm tracking-tight">{title}</h4>
			</div>
			<div className="space-y-2.5 pl-6">
				{children}
			</div>
		</div>
	);
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div className="flex flex-col gap-0.5">
			<span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{label}</span>
			<div className="text-sm font-medium text-foreground">{value}</div>
		</div>
	);
}

export function SitePreviewModal({ site, isOpen, onClose, onEdit }: SitePreviewModalProps) {
	if (!site) return null;

	const isToal = site.siteType === 'toal';

	const calculatedArea = site.toalRadius 
		? `~${Math.round(Math.PI * Math.pow(site.toalRadius, 2)).toLocaleString()} m²` 
		: 'N/A';

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="lg:min-w-5xl md:min-w-3xl sm:min-w-md p-0 overflow-hidden gap-0 bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh]">

				{/* Header */}
				<DialogHeader className="p-6 pb-4 border-b bg-muted/20">
					<div className="flex items-start justify-between">
						<div className="flex items-start gap-4">
							<div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
								<Building2 className="h-6 w-6 text-primary" />
							</div>
							<div>
								<div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-1">
									<DialogTitle className="text-xl font-bold">{site.name}</DialogTitle>
									<div className="flex flex-wrap items-center gap-2">
										<Badge
											variant="outline"
											className={cn(
												"capitalize text-[10px] font-bold tracking-wide h-5 border-none",
												isToal ? "bg-indigo-50 text-indigo-700" : "bg-amber-50 text-amber-700"
											)}
										>
											{site.siteType.toUpperCase()}
										</Badge>
										<Badge
											className={cn(
												"text-[9px] uppercase tracking-widest border-none font-bold h-5",
												site.status === 'active' ? "bg-emerald-100 text-emerald-700" :
													site.status === 'pending' ? "bg-amber-100 text-amber-700" :
														"bg-red-100 text-red-700"
											)}
										>
											{site.status}
										</Badge>
									</div>
								</div>
								<DialogDescription className="text-sm">
									{site.description || "No description provided."}
								</DialogDescription>
							</div>
						</div>
					</div>
				</DialogHeader>

				{/* Correction Alert Banner */}
				{site.status === 'rejected' && site.reason && (
					<div className="mx-6 mt-6 p-4 rounded-xl border border-destructive/20 bg-destructive/5 flex gap-3 items-start shadow-sm">
						<AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
						<div>
							<h5 className="font-bold text-sm text-destructive uppercase tracking-wide">Correction Required</h5>
							<p className="text-xs text-muted-foreground mt-1 leading-relaxed font-semibold">{site.reason}</p>
						</div>
					</div>
				)}

				{/* Body Content */}
				<div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-5">

					{/* Left Column (Map & Media) */}
					<div className="lg:col-span-2 p-4 sm:p-6 border-b lg:border-b-0 lg:border-r border-border/50 bg-muted/10 space-y-6">
						<div className="space-y-2">
							<span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-1.5">
								<MapPin className="h-3 w-3" /> Location Map
							</span>
							<div className="rounded-xl overflow-hidden border border-border/40 h-[250px] relative">
								<PreviewMap
									center={{ lat: site.latitude, lng: site.longitude }}
									toalRadius={site.toalRadius}
									emergencyRadius={site.emergencyRadius || 0}
									showEmergency={site.allowEmergencyLanding}
									toalMode={site.toalGeometryMode}
									emergencyMode={site.emergencyGeometryMode || 'circle'}
									initialToalPolygonPoints={site.toalPolygonPoints}
									initialEmergencyPolygonPoints={site.emergencyPolygonPoints || []}
								/>
							</div>
							<p className="text-xs text-muted-foreground truncate" title={`${site.address}, ${site.postcode}`}>
								{site.address}, <span className="font-mono">{site.postcode}</span>
							</p>
						</div>

						{site.photoUrls && site.photoUrls.length > 0 && (
							<div className="space-y-2">
								<span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-1.5">
									<ImageIcon className="h-3 w-3" /> Site Photos
								</span>
								<div className="grid grid-cols-3 gap-2">
									{site.photoUrls.map((doc: any, i: number) => (
										<div key={i} className="aspect-square rounded-lg border border-border/40 overflow-hidden relative group cursor-pointer" onClick={() => window.open(doc.url, '_blank')}>
											{/* eslint-disable-next-line @next/next/no-img-element */}
											<img src={doc.url} alt="Site" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
										</div>
									))}
								</div>
							</div>
						)}
					</div>

					{/* Right Column (Details) */}
					<div className="lg:col-span-3 p-4 sm:p-6 space-y-6">
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
							<InfoSection title="Contact Details" icon={Phone}>
								<InfoItem label="Email Address" value={site.contactEmail} />
								<InfoItem label="Phone Number" value={site.contactPhone} />
							</InfoSection>

							<InfoSection title="Commercials" icon={Banknote}>
								<InfoItem label="TOAL Access Fee" value={<span className="font-mono text-primary font-bold">£{site.toalFee.toFixed(2)}</span>} />
								<InfoItem label="Emergency Fee" value={<span className="font-mono">£{site.emergencyFee.toFixed(2)}</span>} />
							</InfoSection>
						</div>

						<Separator />

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
							<InfoSection title="Operational Policy" icon={CalendarIcon}>
								<InfoItem
									label="Activation Schedule"
									value={site.isPermanentActivation ? (
										<Badge className="bg-sky-100 text-sky-700 hover:bg-sky-100 border-none px-2 h-5 text-[10px] uppercase">Permanent</Badge>
									) : (
										`${site.activationStartDate} to ${site.activationEndDate}`
									)}
								/>
								<InfoItem label="Daily Hours" value={`${site.activationStartTime || '00:00'} - ${site.activationEndTime || '23:59'}`} />
								<InfoItem label="Booking Model" value={site.bookingApprovalModel === 'auto' ? 'Auto-Approval' : 'Manual Review'} />
							</InfoSection>

							<InfoSection title="Boundaries" icon={CheckCircle2}>
								<InfoItem
									label="TOAL Area"
									value={`${site.toalGeometryMode === 'circle' ? 'Circle' : 'Polygon'} — ${site.toalRadius}m`}
								/>
								<InfoItem
									label="Calculated Area"
									value={calculatedArea}
								/>
								<InfoItem
									label="Emergency Setup"
									value={site.allowEmergencyLanding ? `Enabled — ${site.emergencyRadius}m` : 'Disabled'}
								/>
							</InfoSection>
						</div>

						<Separator />

						<InfoSection title="Documents" icon={FileText}>
							<div className="flex flex-col gap-4">
								<div className="space-y-1.5">
									<span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold block">Airspace Policy Documents</span>
									<div className="flex flex-wrap gap-2">
										{site.policyDocuments.map((doc: any, i: number) => (
											<Button key={i} variant="outline" size="sm" className="h-7 text-[10px] font-semibold gap-2 border-primary/20 hover:border-primary/50" onClick={() => window.open(doc.url, '_blank')}>
												<FileText className="h-3 w-3" /> Policy Doc #{i + 1}
											</Button>
										))}
										{site.policyDocuments.length === 0 && <span className="text-xs text-muted-foreground italic">No policy documents.</span>}
									</div>
								</div>

								<div className="space-y-1.5">
									<span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold block">Proof of Ownership Deeds</span>
									<div className="flex flex-wrap gap-2">
										{site.ownershipDocuments && site.ownershipDocuments.map((doc: any, i: number) => (
											<Button key={i} variant="outline" size="sm" className="h-7 text-[10px] font-semibold gap-2 border-primary/20 hover:border-primary/50" onClick={() => window.open(doc.url, '_blank')}>
												<FileText className="h-3 w-3" /> Ownership Deed #{i + 1}
											</Button>
										))}
										{(!site.ownershipDocuments || site.ownershipDocuments.length === 0) && <span className="text-xs text-muted-foreground italic">No ownership documents.</span>}
									</div>
								</div>
							</div>
						</InfoSection>

					</div>
				</div>

				{/* Footer Actions */}
				<div className="p-4 px-6 border-t bg-muted/10 flex items-center justify-between">
					<Button variant="ghost" onClick={onClose}>Close</Button>

					{site.status === 'pending' ? (
						<div className="flex items-center gap-4">
							<Button
								variant="destructive"
								onClick={() => {
									toast.success('Application Withdrawn', {
										description: 'Your site application has been withdrawn.'
									});
									onClose();
								}}
							>
								Withdraw Application
							</Button>

							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										{/* Wrapper span needed because disabled buttons don't trigger tooltip hover events properly */}
										<span tabIndex={0} className="cursor-not-allowed">
											<Button disabled className="gap-2 font-bold shadow-md shadow-primary/20 pointer-events-none">
												<Edit className="h-4 w-4" /> Edit Site
											</Button>
										</span>
									</TooltipTrigger>
									<TooltipContent className="bg-amber-50 border-amber-200 text-amber-800 flex items-center gap-2 p-2">
										<AlertTriangle className="h-4 w-4 text-amber-600" />
										<p className="font-medium text-xs">Editing disabled during review</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</div>
					) : (
						<Button className="gap-2 font-bold shadow-md shadow-primary/20" onClick={() => onEdit && onEdit(site.id)}>
							<Edit className="h-4 w-4" /> Edit Site
						</Button>
					)}
				</div>

			</DialogContent>
		</Dialog>
	);
}
