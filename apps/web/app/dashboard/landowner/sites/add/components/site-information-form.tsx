'use client';

import * as React from 'react';
import { Controller, UseFormReturn } from 'react-hook-form';
import { Field, FieldError, FieldGroup, FieldLabel } from '@workspace/ui/components/field';
import { Button } from '@workspace/ui/components/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui/components/select';
import { Textarea } from '@workspace/ui/components/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Mail, Phone, Building2, Tag, Zap, ArrowRight, ImageIcon } from 'lucide-react';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@workspace/ui/components/input-group';
import { Separator } from '@workspace/ui/components/separator';
import { FileUploader } from '@/components/file-uploader';

interface SiteInformationFormProps {
    form: UseFormReturn<any>;
    isLoading: boolean;
    onNext: () => void;
    onCancel: () => void;
}

function FieldSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
    return (
        <div className="space-y-4">
            <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</p>
                {description && <p className="text-xs text-muted-foreground/70 mt-0.5">{description}</p>}
            </div>
            {children}
        </div>
    );
}

export function SiteInformationForm({ form, isLoading, onNext, onCancel }: SiteInformationFormProps) {
    return (
        <Card className="shadow-md border-border/60">
            <CardHeader className="relative overflow-hidden pb-6 border-b">
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />
                <div className="relative z-10">
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        Site Details
                    </CardTitle>
                    <CardDescription className="mt-1">
                        What is this site, what does it look like, and who is the contact?
                    </CardDescription>
                </div>
            </CardHeader>

            <CardContent className="pt-8">
                <div className="space-y-8">

                    {/* ─── Identity ─────────────────────────────────── */}
                    <FieldSection title="Identity" description="Name and classification of your site">
                        <FieldGroup className="gap-6">
                            {/* Site Name */}
                            <Controller
                                name="name"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel>Site Name *</FieldLabel>
                                        <InputGroup>
                                            <InputGroupAddon>
                                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                            </InputGroupAddon>
                                            <InputGroupInput
                                                {...field}
                                                placeholder="e.g., North Field Landing Zone"
                                                disabled={isLoading}
                                                autoComplete="off"
                                            />
                                        </InputGroup>
                                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                    </Field>
                                )}
                            />

                            {/* Category + Primary Function */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <Controller
                                    name="category"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <FieldLabel>Category *</FieldLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                                disabled={isLoading}
                                            >
                                                <SelectTrigger>
                                                    <div className="flex items-center gap-2">
                                                        <Tag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                        <SelectValue placeholder="Select category..." />
                                                    </div>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="private_land">Private Land / Estate</SelectItem>
                                                    <SelectItem value="helipad">Helipad</SelectItem>
                                                    <SelectItem value="vertiport">Vertiport</SelectItem>
                                                    <SelectItem value="droneport">Droneport</SelectItem>
                                                    <SelectItem value="temporary_landing_site">Temporary Landing Site</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                        </Field>
                                    )}
                                />

                                <Controller
                                    name="siteType"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <FieldLabel>Primary Function *</FieldLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                                disabled={isLoading}
                                            >
                                                <SelectTrigger>
                                                    <div className="flex items-center gap-2">
                                                        <Zap className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                        <SelectValue placeholder="Select function..." />
                                                    </div>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="toal">Take-off &amp; Landing (TOAL)</SelectItem>
                                                    <SelectItem value="emergency">Emergency &amp; Recovery Site</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                        </Field>
                                    )}
                                />
                            </div>
                        </FieldGroup>
                    </FieldSection>

                    <Separator />

                    {/* ─── Description ──────────────────────────────── */}
                    <FieldSection title="Property Description" description="Describe the site's characteristics, access routes, and key features">
                        <Controller
                            name="description"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel>Description</FieldLabel>
                                    <Textarea
                                        {...field}
                                        placeholder="e.g., 4-acre private estate with a maintained grass clearing suitable for TOAL operations. Access via the main estate gate on Ashford Lane. No overhead obstructions within 500m."
                                        disabled={isLoading}
                                        className="min-h-[120px] resize-none"
                                    />
                                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                </Field>
                            )}
                        />
                    </FieldSection>

                    <Separator />

                    {/* ─── Site Photos ───────────────────────────────── */}
                    <FieldSection title="Site Photos" description="Upload photos of the landing area, surroundings, and access points">
                        <Controller
                            name="photoUrls"
                            control={form.control}
                            render={({ field }) => (
                                <Field>
                                    <FieldLabel className="flex items-center gap-2">
                                        <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                        Upload Photos
                                    </FieldLabel>
                                    <FileUploader
                                        accept="image/jpeg,image/png,image/webp"
                                        maxSize={15}
                                        onUploadComplete={(urls) => {
                                            field.onChange(urls);
                                        }}
                                    />
                                    {/* Show count of ready photos */}
                                    {Array.isArray(field.value) && field.value.length > 0 && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {field.value.length} photo{field.value.length !== 1 ? 's' : ''} ready for submission
                                        </p>
                                    )}
                                </Field>
                            )}
                        />
                    </FieldSection>

                    <Separator />

                    {/* ─── Site Contact ──────────────────────────────── */}
                    <FieldSection title="Site Contact" description="Who should operators contact regarding this site?">
                        <FieldGroup className="gap-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <Controller
                                    name="contactEmail"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <FieldLabel>Contact Email *</FieldLabel>
                                            <InputGroup>
                                                <InputGroupAddon>
                                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                                </InputGroupAddon>
                                                <InputGroupInput
                                                    {...field}
                                                    type="email"
                                                    placeholder="admin@estate.co.uk"
                                                    disabled={isLoading}
                                                />
                                            </InputGroup>
                                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                        </Field>
                                    )}
                                />

                                <Controller
                                    name="contactPhone"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <FieldLabel>Contact Phone *</FieldLabel>
                                            <InputGroup>
                                                <InputGroupAddon>
                                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                                </InputGroupAddon>
                                                <InputGroupInput
                                                    {...field}
                                                    placeholder="+44 20 7946 0958"
                                                    disabled={isLoading}
                                                />
                                            </InputGroup>
                                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                        </Field>
                                    )}
                                />
                            </div>
                        </FieldGroup>
                    </FieldSection>

                    {/* ─── Footer Actions ────────────────────────────── */}
                    <div className="flex items-center justify-between pt-4 border-t">
                        <Button
                            variant="ghost"
                            type="button"
                            onClick={onCancel}
                            disabled={isLoading}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={onNext}
                            disabled={isLoading}
                            className="gap-2 font-semibold shadow-md shadow-primary/20 min-w-[140px]"
                            size="lg"
                        >
                            {isLoading ? 'Saving...' : 'Continue'}
                            {!isLoading && <ArrowRight className="h-4 w-4" />}
                        </Button>
                    </div>

                </div>
            </CardContent>
        </Card>
    );
}
