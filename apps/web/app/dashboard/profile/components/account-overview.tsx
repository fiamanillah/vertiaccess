'use client';

import * as React from 'react';
import { User, Edit2, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@workspace/ui/components/card';
import { Label } from '@workspace/ui/components/label';
import { Input } from '@workspace/ui/components/input';
import { toast } from 'sonner';

interface AccountOverviewProps {
    user: {
        name: string;
        email: string;
        organisation: string;
        accountType: string;
        accountId: string;
    };
}

export function AccountOverview({ user: initialUser }: AccountOverviewProps) {
    const [isEditing, setIsEditing] = React.useState(false);
    const [isSaving, setIsSaving] = React.useState(false);
    const [userData, setUserData] = React.useState(initialUser);

    const handleSave = async () => {
        setIsSaving(true);
        // Mock API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsSaving(false);
        setIsEditing(false);
        toast.success('Profile updated successfully');
    };

    const handleCancel = () => {
        setUserData(initialUser);
        setIsEditing(false);
    };

    return (
        <Card className="lg:col-span-2 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 bg-muted/30 p-6">
                <div className="space-y-1">
                    <CardTitle className="text-xl font-black uppercase tracking-tight text-foreground">
                        Account Overview
                    </CardTitle>
                    <CardDescription className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/70">
                        Basic information about your account
                    </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                    {!isEditing ? (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-2 text-xs"
                            onClick={() => setIsEditing(true)}
                        >
                            <Edit2 className="h-3.5 w-3.5" /> Edit Profile
                        </Button>
                    ) : (
                        <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-300">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-2 text-xs"
                                onClick={handleCancel}
                                disabled={isSaving}
                            >
                                <XCircle className="h-3.5 w-3.5" /> Cancel
                            </Button>
                            <Button
                                size="sm"
                                className="h-8 gap-2 text-xs font-bold shadow-sm"
                                onClick={handleSave}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                    <div className="size-8 rounded-full bg-muted flex items-center justify-center shrink-0 border">
                        <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-1">
                    <div className="space-y-2.5">
                        <Label className="text-muted-foreground text-[10px] uppercase tracking-widest font-extrabold opacity-70">
                            Full Name
                        </Label>
                        {isEditing ? (
                            <Input
                                value={userData.name}
                                onChange={e => setUserData({ ...userData, name: e.target.value })}
                                className="h-9 text-sm "
                            />
                        ) : (
                            <p className="font-semibold text-sm tracking-tight">{userData.name}</p>
                        )}
                    </div>

                    <div className="space-y-2.5">
                        <Label className="text-muted-foreground text-[10px] uppercase tracking-widest font-extrabold opacity-70">
                            Email Address
                        </Label>
                        <p className="font-semibold text-sm tracking-tight text-muted-foreground/80">
                            {userData.email}
                        </p>
                    </div>

                    <div className="space-y-2.5">
                        <Label className="text-muted-foreground text-[10px] uppercase tracking-widest font-extrabold opacity-70">
                            Organisation
                        </Label>
                        {isEditing ? (
                            <Input
                                value={userData.organisation}
                                onChange={e =>
                                    setUserData({ ...userData, organisation: e.target.value })
                                }
                                className="h-9 text-sm "
                            />
                        ) : (
                            <p className="font-semibold text-sm tracking-tight">
                                {userData.organisation}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2.5">
                        <Label className="text-muted-foreground text-[10px] uppercase tracking-widest font-extrabold opacity-70">
                            Account Type
                        </Label>
                        <p className="font-semibold text-sm tracking-tight capitalize">
                            {userData.accountType}
                        </p>
                    </div>

                    <div className="space-y-2.5">
                        <Label className="text-muted-foreground text-[10px] uppercase tracking-widest font-extrabold opacity-70">
                            Verification Status
                        </Label>
                        <div className="flex items-center">
                            <Badge
                                variant="outline"
                                className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px] font-bold px-2.5 h-6"
                            >
                                <div className="size-1.5 rounded-full bg-amber-500 animate-pulse mr-2" />
                                Pending Verification
                            </Badge>
                        </div>
                    </div>

                    <div className="space-y-2.5">
                        <Label className="text-muted-foreground text-[10px] uppercase tracking-widest font-extrabold opacity-70">
                            Account ID
                        </Label>
                        <p className="font-mono text-[11px] font-bold bg-muted/60 px-2 py-1 rounded w-fit border border-muted-foreground/10 text-muted-foreground tracking-tighter uppercase">
                            {userData.accountId}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
