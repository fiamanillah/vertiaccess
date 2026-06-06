'use client';

import * as React from 'react';
import { Landmark, Plane, ArrowLeft } from 'lucide-react';
import SignUpForm from '@/app/(auth)/AuthComponents/SignUpForm';
import AuthCardLayout from '@/app/(auth)/AuthComponents/AuthCardLayout';

export default function SignUp() {
    const [selectedRole, setSelectedRole] = React.useState<'assetmanager' | 'operator' | null>(null);

    let title = "Join the infrastructure network for autonomous aviation";
    let subtitle = "Register as an infrastructure owner or drone operator and access the VertiAccess network.";

    if (selectedRole === 'operator') {
        title = "Empowering operators to access the infrastructure they need";
        subtitle = "One platform. All infrastructure. Seamless access. Smarter operations.";
    } else if (selectedRole === 'assetmanager') {
        title = "Unlock the value of your infrastructure";
        subtitle = "Manage access, set policies, track usage and generate revenue from your operational infrastructure.";
    }

    return (
        <AuthCardLayout
            title={title}
            subtitle={subtitle}
            backLink={{
                href: '/',
                label: 'Back',
            }}
        >
            <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[420px]">
                {!selectedRole ? (
                    <div className="space-y-4">
                        <div className="text-center space-y-1.5 mb-2">
                            <h2 className="text-2xl font-semibold tracking-tight">Create an Account</h2>
                            <p className="text-sm text-muted-foreground">Select your role to get started</p>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4">
                            <button
                                onClick={() => setSelectedRole('assetmanager')}
                                className="group relative flex items-start gap-4 rounded-xl border p-4 text-left transition-all duration-200 hover:border-primary/50 hover:bg-primary/5 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                            >
                                <div className="rounded-lg bg-primary/10 p-2.5 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200 mt-0.5 animate-in fade-in zoom-in-95">
                                    <Landmark className="h-5 w-5" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">Asset Manager</h4>
                                    <p className="text-xs text-muted-foreground leading-normal">
                                        Manage airspace access requests and coordinate permissions for your assets.
                                    </p>
                                </div>
                            </button>

                            <button
                                onClick={() => setSelectedRole('operator')}
                                className="group relative flex items-start gap-4 rounded-xl border p-4 text-left transition-all duration-200 hover:border-primary/50 hover:bg-primary/5 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                            >
                                <div className="rounded-lg bg-primary/10 p-2.5 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200 mt-0.5 animate-in fade-in zoom-in-95">
                                    <Plane className="h-5 w-5" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">Drone Operator</h4>
                                    <p className="text-xs text-muted-foreground leading-normal">
                                        Request permissions, coordinate ground access, and manage flight zones.
                                    </p>
                                </div>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        <button
                            onClick={() => setSelectedRole(null)}
                            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4 self-start cursor-pointer"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Back to role selection
                        </button>
                        <SignUpForm role={selectedRole} />
                    </div>
                )}

                <p className="px-4 text-center text-xs text-muted-foreground leading-normal">
                    By clicking continue, you agree to our{' '}
                    <a
                        href="/terms"
                        className="underline underline-offset-4 hover:text-primary transition-colors"
                    >
                        Terms of Service
                    </a>{' '}
                    and{' '}
                    <a
                        href="/privacy"
                        className="underline underline-offset-4 hover:text-primary transition-colors"
                    >
                        Privacy Policy
                    </a>
                    .
                </p>
            </div>
        </AuthCardLayout>
    );
}
