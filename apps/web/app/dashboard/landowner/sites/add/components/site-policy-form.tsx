'use client';

import * as React from 'react';
import { Controller, UseFormReturn } from 'react-hook-form';
import { format, parseISO } from 'date-fns';
import {
	FileText,
	Calendar as CalendarIcon,
	CheckSquare,
	ShieldCheck,
	ArrowRight,
	ArrowLeft,
	Clock,
	Info,
} from 'lucide-react';

import { Field, FieldError, FieldGroup, FieldLabel } from '@workspace/ui/components/field';
import { Button } from '@workspace/ui/components/button';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@workspace/ui/components/select';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@workspace/ui/components/card';
import { Popover, PopoverContent, PopoverTrigger } from '@workspace/ui/components/popover';
import { Calendar } from '@workspace/ui/components/calendar';
import { Separator } from '@workspace/ui/components/separator';
import { Checkbox } from '@workspace/ui/components/checkbox';
import { cn } from '@workspace/ui/lib/utils';
import { FileUploader } from '@/components/file-uploader';
	
interface SitePolicyFormProps {
	form: UseFormReturn<any>;
	isLoading: boolean;
	onNext: () => void;
	onPrev: () => void;
	isPolicyDocsLocked?: boolean;
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

/** Helper component for Date and Time selection using Shadcn components */
function DateTimePicker({
	dateName,
	timeName,
	label,
	form,
	disabled,
}: {
	dateName: string;
	timeName: string;
	label: string;
	form: UseFormReturn<any>;
	disabled?: boolean;
}) {
	const timeOptions = React.useMemo(() => {
		const options = [];
		for (let hour = 0; hour < 24; hour++) {
			for (const min of ['00', '30']) {
				options.push(`${hour.toString().padStart(2, '0')}:${min}`);
			}
		}
		return options;
	}, []);

	return (
		<Field>
			<FieldLabel>{label}</FieldLabel>
			<div className="flex flex-col sm:flex-row gap-3">
				{/* Date Selection */}
				<Controller
					name={dateName}
					control={form.control}
					render={({ field }) => (
						<Popover>
							<PopoverTrigger asChild>
								<Button
									variant="outline"
									disabled={disabled}
									className={cn(
										'flex-1 justify-start text-left font-normal border-input/50 bg-muted/20',
										!field.value && 'text-muted-foreground'
									)}
								>
									<CalendarIcon className="mr-2 h-4 w-4 text-primary" />
									{field.value ? format(parseISO(field.value), 'PPP') : <span>Pick a date</span>}
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0" align="start">
								<Calendar
									mode="single"
									captionLayout="dropdown"
									selected={field.value ? parseISO(field.value) : undefined}
									onSelect={date => {
										if (date) {
											field.onChange(format(date, 'yyyy-MM-dd'));
										}
									}}
								/>
							</PopoverContent>
						</Popover>
					)}
				/>

				{/* Time Selection */}
				<Controller
					name={timeName}
					control={form.control}
					render={({ field }) => (
						<Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
							<SelectTrigger className="w-full sm:w-[140px] h-11 border-input/50 bg-muted/20">
								<div className="flex items-center gap-2">
									<Clock className="h-4 w-4 text-primary" />
									<SelectValue placeholder="Time" />
								</div>
							</SelectTrigger>
							<SelectContent className="max-h-[300px]">
								{timeOptions.map(time => (
									<SelectItem key={time} value={time}>
										{time}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					)}
				/>
			</div>
		</Field>
	);
}

export function SitePolicyForm({ form, isLoading, onNext, onPrev, isPolicyDocsLocked, globalDisabled }: SitePolicyFormProps) {
	const isPermanent = form.watch('isPermanentActivation');

	return (
		<Card className="shadow-md border-border/60">
			<CardHeader className="relative overflow-hidden pb-6 border-b">
				<div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />
				<div className="relative z-10">
					<CardTitle className="text-xl font-bold flex items-center gap-2">
						<ShieldCheck className="h-5 w-5 text-primary" />
						Operational Policy
					</CardTitle>
					<CardDescription className="mt-1">
						When is it open, and what are the rules?
					</CardDescription>
				</div>
			</CardHeader>

			<CardContent className="pt-8">
				<div className="space-y-8">
					{/* ─── Availability Window ───────────────────────────────── */}
					<FieldSection
						title="Availability Window"
						description="Set the activation dates for your site"
					>
						<fieldset disabled={globalDisabled}>
						<FieldGroup className="gap-6">
							<Controller
								name="isPermanentActivation"
								control={form.control}
								render={({ field }) => (
									<div className="flex items-center space-x-2 bg-muted/30 p-4 rounded-xl border border-border/50">
										<Checkbox
											id="permanent"
											checked={field.value}
											onCheckedChange={field.onChange}
											disabled={isLoading}
										/>
										<div className="grid gap-1.5 leading-none">
											<label
												htmlFor="permanent"
												className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
											>
												Permanent Activation
											</label>
											<p className="text-xs text-muted-foreground">
												Site remains active until further notice. No end date required.
											</p>
										</div>
									</div>
								)}
							/>

							<div className="space-y-6">
								<DateTimePicker
									label="Activation Start"
									dateName="activationStartDate"
									timeName="activationStartTime"
									form={form}
									disabled={isLoading}
								/>

								{!isPermanent && (
									<DateTimePicker
										label="Activation End"
										dateName="activationEndDate"
										timeName="activationEndTime"
										form={form}
										disabled={isLoading}
									/>
								)}
							</div>
						</FieldGroup>
						</fieldset>
					</FieldSection>

					<Separator />

					{/* ─── Booking Approval Model ────────────────────────────── */}
					<FieldSection
						title="Booking Approval Model"
						description="How are bookings handled for this site?"
					>
						<fieldset disabled={globalDisabled}>
						<Controller
							name="bookingApprovalModel"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel>Approval Workflow *</FieldLabel>
									<Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
										<SelectTrigger className="h-12! border-input/50 bg-muted/20">
											<div className="flex items-center gap-2">
												<CheckSquare className="h-3.5 w-3.5 text-primary shrink-0" />
												<SelectValue placeholder="Select approval model..." />
											</div>
										</SelectTrigger>
										<SelectContent className="">
											<SelectItem value="auto">
												<div className="flex flex-col w-full items-start">
													<span className="font-medium">Auto Approval (Instant)</span>
													<span className="text-[10px] text-muted-foreground">
														Bookings are confirmed immediately upon payment.
													</span>
												</div>
											</SelectItem>
											<SelectItem value="manual">
												<div className="flex flex-col items-start">
													<span className="font-medium">Manual Approval (Review)</span>
													<span className="text-[10px] text-muted-foreground">
														You must review and approve each booking request.
													</span>
												</div>
											</SelectItem>
										</SelectContent>
									</Select>
									{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
								</Field>
							)}
						/>
						</fieldset>
					</FieldSection>

					<Separator />

					{/* ─── Documents Upload ──────────────────────────────────── */}
					<FieldSection
						title="Policy & Operational Documents"
						description={isPolicyDocsLocked ? "Uploaded policy documents." : "Upload site rules, insurance, or ID documents"}
					>
						{isPolicyDocsLocked && (
							<div className="mb-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 flex gap-3 text-amber-800 dark:text-amber-200">
								<Info className="h-5 w-5 shrink-0 mt-0.5 text-amber-500" />
								<div>
									<h4 className="font-bold text-sm">Documents Locked</h4>
									<p className="text-xs mt-1 opacity-80">
										For safety and compliance, operational documents cannot be edited after approval. Please contact support if you need to update these.
									</p>
								</div>
							</div>
						)}
						<fieldset disabled={isPolicyDocsLocked || globalDisabled}>
						<Controller
							name="policyDocuments"
							control={form.control}
							render={({ field }) => (
								<Field>
									<FieldLabel className="flex items-center gap-2">
										<FileText className="h-3.5 w-3.5 text-primary" />
										{isPolicyDocsLocked ? "Uploaded Documents" : "Upload Documents"}
									</FieldLabel>
									{!isPolicyDocsLocked && (
										<FileUploader
											accept=".pdf,image/jpeg,image/png,image/webp"
											maxSize={10}
											onUploadComplete={urls => {
												field.onChange(urls);
											}}
										/>
									)}
									{Array.isArray(field.value) && field.value.length > 0 && (
										<div className="flex flex-col gap-2 mt-2">
											{field.value.map((url, i) => (
												<div key={i} className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100 w-fit">
													<ShieldCheck className="h-4 w-4" />
													<a href={url} target="_blank" rel="noreferrer" className="hover:underline font-medium">Document #{i + 1}</a>
												</div>
											))}
										</div>
									)}
								</Field>
							)}
						/>
						</fieldset>
					</FieldSection>

					{/* ─── Footer Actions ────────────────────────────────────── */}
					<div className="flex items-center justify-between pt-6 border-t">
						<Button
							variant="ghost"
							type="button"
							onClick={onPrev}
							disabled={isLoading}
							className="text-muted-foreground hover:text-foreground"
						>
							<ArrowLeft className="h-4 w-4 mr-2" />
							Back to Location
						</Button>
						<Button
							type="button"
							onClick={onNext}
							disabled={isLoading}
							className="gap-2 font-semibold shadow-md shadow-primary/20 min-w-[140px]"
							size="lg"
						>
							{isLoading ? 'Saving...' : 'Review Site Details'}
							{!isLoading && <ArrowRight className="h-4 w-4" />}
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
