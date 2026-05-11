'use client';

import * as React from 'react';
import { Controller, UseFormReturn } from 'react-hook-form';
import {
	Banknote,
	TrendingUp,
	ArrowRight,
	ArrowLeft,
	Info,
	ShieldCheck,
	LayoutDashboard,
} from 'lucide-react';

import { Field, FieldError, FieldGroup, FieldLabel, FieldDescription } from '@workspace/ui/components/field';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { cn } from '@workspace/ui/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Separator } from '@workspace/ui/components/separator';
import { Badge } from '@workspace/ui/components/badge';

interface SiteCommercialFormProps {
	form: UseFormReturn<any>;
	isLoading: boolean;
	onNext: () => void;
	onPrev: () => void;
	globalDisabled?: boolean;
}

function FieldSection({
	title,
	description,
	children,
}: {
	title: string;
	description?: string;
	children: React.ReactNode;
}) {
	return (
		<div className="space-y-4">
			<div>
				<p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
					{title}
				</p>
				{description && <p className="text-xs text-muted-foreground/70 mt-0.5">{description}</p>}
			</div>
			{children}
		</div>
	);
}

const PLATFORM_FEE_PERCENT = 15;

export function SiteCommercialForm({ form, isLoading, onNext, onPrev, globalDisabled }: SiteCommercialFormProps) {
	const toalFee = form.watch('toalFee') || 0;
	const emergencyFee = form.watch('emergencyFee') || 0;

	const platformFeeAmount = (toalFee * PLATFORM_FEE_PERCENT) / 100;
	const netReceived = toalFee - platformFeeAmount;
    
    const emergencyPlatformFee = (emergencyFee * PLATFORM_FEE_PERCENT) / 100;
    const emergencyNet = emergencyFee - emergencyPlatformFee;

	return (
		<Card className="shadow-md border-border/60">
			<CardHeader className="relative overflow-hidden pb-6 border-b">
				<div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />
				<div className="relative z-10">
					<CardTitle className="text-xl font-bold flex items-center gap-2">
						<Banknote className="h-5 w-5 text-primary" />
						Commercial Setup
					</CardTitle>
					<CardDescription className="mt-1">
						Configure pricing and understand your earnings.
					</CardDescription>
				</div>
			</CardHeader>

			<CardContent className="pt-8">
				<div className="space-y-8">
					{/* ─── Typical Pricing Guideline ─────────────────────────── */}
					<div className="bg-muted/30 border border-border/50 rounded-xl p-4 flex gap-4 items-start">
						<div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
							<TrendingUp className="h-5 w-5 text-primary" />
						</div>
						<div className="space-y-1">
							<div className="flex items-center gap-2">
								<h4 className="text-sm font-semibold">Typical Pricing</h4>
								<Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] h-4">
									Indicator
								</Badge>
							</div>
							<p className="text-sm font-bold text-foreground">£50 – £150 <span className="text-xs font-normal text-muted-foreground">per booking</span></p>
							<p className="text-xs text-muted-foreground leading-relaxed">
								Market-competitive rates for Private Land sites. You retain full control over pricing.
							</p>
						</div>
					</div>

					{/* ─── Access Fees ───────────────────────────────────────── */}
					<FieldSection title="Service Fees" description="Set the base rates for site operations">
						<fieldset disabled={globalDisabled}>
						<FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<Controller
								name="toalFee"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel className="flex items-center gap-2">
											TOAL Access Fee *
											<Info className="h-3 w-3 text-muted-foreground cursor-help" />
										</FieldLabel>
										<div className="relative">
											<span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium pointer-events-none">
												£
											</span>
											<Input
												{...field}
												type="number"
												placeholder="0.00"
												className="pl-7 h-12 bg-muted/20 border-input/50"
												onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
												disabled={isLoading}
											/>
										</div>
										<FieldDescription>
											Amount paid by the operator per approved operation.
										</FieldDescription>
										{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
									</Field>
								)}
							/>

							<Controller
								name="emergencyFee"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel className="flex items-center gap-2">
											Emergency Access Fee *
											<Info className="h-3 w-3 text-muted-foreground cursor-help" />
										</FieldLabel>
										<div className="relative">
											<span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium pointer-events-none">
												£
											</span>
											<Input
												{...field}
												type="number"
												placeholder="0.00"
												className="pl-7 h-12 bg-muted/20 border-input/50"
												onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
												disabled={isLoading}
											/>
										</div>
										<FieldDescription>
											Premium fee for emergency contingency recovery landings.
										</FieldDescription>
										{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
									</Field>
								)}
							/>
						</FieldGroup>
						</fieldset>
					</FieldSection>

					<Separator />

					{/* ─── Earnings Preview ──────────────────────────────────── */}
					<FieldSection title="Earnings Preview" description="Real-time breakdown of your net income">
						<div className="bg-background border border-border/60 rounded-xl overflow-hidden shadow-sm">
							<div className="p-5 space-y-4">
								<div className="flex justify-between items-center text-sm">
									<span className="text-muted-foreground flex items-center gap-2">
                                        Access Fee (Base)
                                    </span>
									<span className="font-semibold text-foreground">£{toalFee.toFixed(2)}</span>
								</div>
								<div className="flex justify-between items-center text-sm">
									<span className="text-muted-foreground">Emergency Fee</span>
									<span className="font-semibold text-foreground">£{emergencyFee.toFixed(2)}</span>
								</div>
								<div className="flex justify-between items-center text-sm">
									<span className="text-muted-foreground flex items-center gap-2">
                                        Platform Fee
                                        <Badge variant="outline" className="text-[9px] h-3.5 px-1 font-normal opacity-70">
                                            {PLATFORM_FEE_PERCENT}%
                                        </Badge>
                                    </span>
									<span className="text-destructive font-medium">
                                        - £{((toalFee * PLATFORM_FEE_PERCENT) / 100).toFixed(2)}
                                    </span>
								</div>

								<Separator className="opacity-50" />

								<div className="flex flex-col gap-1">
                                    <div className="flex justify-between items-end pt-1">
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider">
                                                <LayoutDashboard className="h-3.5 w-3.5" />
                                                You Receive
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-black text-foreground">£{netReceived.toFixed(2)}</p>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground text-right italic">
                                        + £{emergencyNet.toFixed(2)} if emergency access is utilised
                                    </p>
                                </div>
							</div>
                            
                            <div className="bg-muted/40 p-4 border-t border-border/40 flex justify-between items-center">
                                <div className="space-y-0.5">
                                    <p className="text-xs font-semibold text-foreground">Operator Pays</p>
                                    <p className="text-[10px] text-muted-foreground">Transparency builds trust.</p>
                                </div>
                                <p className="text-lg font-bold text-foreground">£{toalFee.toFixed(2)}</p>
                            </div>
						</div>
                        
                        <p className="text-[10px] text-muted-foreground px-1 leading-relaxed">
                            * Platform fee is fetched from backend billing plans and shown here exactly as configured. 
                            Value Added Tax (VAT) may apply depending on your tax status.
                        </p>
					</FieldSection>

					{/* ─── Footer Actions ────────────────────────────────────── */}
					<div className="flex items-center justify-between pt-6 border-t mt-4">
						<Button
							variant="ghost"
							type="button"
							onClick={onPrev}
							disabled={isLoading}
							className="text-muted-foreground hover:text-foreground"
						>
							<ArrowLeft className="h-4 w-4 mr-2" />
							Back to Policy
						</Button>
						<Button
							type="button"
							onClick={onNext}
							disabled={isLoading}
							className="gap-2 font-semibold shadow-md shadow-primary/20 min-w-[140px]"
							size="lg"
						>
							Review Site Details
							<ArrowRight className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
