'use client';

import * as React from 'react';
import { MessageVisibility } from '@/app/dashboard/components/resolution/types';
import { Button } from '@workspace/ui/components/button';
import { Textarea } from '@workspace/ui/components/textarea';
import { 
    Send, 
    Paperclip, 
    ChevronDown, 
    FileText, 
    Lock,
    User,
    Building2,
    Command,
    Bold,
    Italic,
    List,
    ListOrdered,
    Type
} from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from '@workspace/ui/components/dropdown-menu';
import { toast } from 'sonner';

interface AdminComposerProps {
    channel: MessageVisibility;
}

export function AdminComposer({ channel }: AdminComposerProps) {
    const [content, setContent] = React.useState('');
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const isInternal = channel === 'internal';
    const isTarget = channel === 'target';

    const getBgColor = () => {
        if (isInternal) return "bg-indigo-50/80";
        if (isTarget) return "bg-amber-50/50";
        return "bg-background";
    };

    const getBorderColor = () => {
        if (isInternal) return "border-indigo-200 shadow-indigo-100";
        if (isTarget) return "border-amber-200 shadow-amber-100";
        return "border-border/50 shadow-sm";
    };

    const getButtonColor = () => {
        if (isInternal) return "bg-indigo-700 hover:bg-indigo-800";
        if (isTarget) return "bg-amber-600 hover:bg-amber-700";
        return "bg-primary hover:bg-primary/90";
    };

    const handleSend = (statusAction?: string) => {
        if (!content.trim()) return;
        setIsSubmitting(true);
        setTimeout(() => {
            toast.success(isInternal ? 'Internal note added' : 'Official message sent');
            setContent('');
            setIsSubmitting(false);
        }, 1000);
    };

    return (
        <div className={cn(
            "p-6 border-t transition-all duration-500",
            getBgColor()
        )}>
            <div className="max-w-4xl mx-auto space-y-4">
                {/* Safety Label */}
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                        {isInternal ? <Lock className="h-3 w-3 text-indigo-700" /> : 
                         isTarget ? <Building2 className="h-3 w-3 text-amber-700" /> : 
                         <User className="h-3 w-3 text-primary" />}
                        <span className={cn(
                            "text-[9px] font-black uppercase tracking-[0.2em]",
                            isInternal ? "text-indigo-700" : isTarget ? "text-amber-700" : "text-primary"
                        )}>
                            {isInternal ? 'PRIVATE INTERNAL NOTE: HIDDEN FROM USERS' : 
                             isTarget ? 'DIRECT RESPONSE TO TARGET (LANDOWNER)' : 
                             'DIRECT RESPONSE TO REPORTER (OPERATOR)'}
                        </span>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 gap-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:bg-background">
                                <Command className="h-3 w-3" />
                                Insert Template
                                <ChevronDown className="h-3 w-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 font-bold uppercase text-[10px] tracking-widest">
                            <DropdownMenuItem onClick={() => setContent("We have reviewed the evidence and find the claim valid...")}>Legal: Claim Validated</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setContent("Insufficient evidence provided for this claim...")}>Legal: Insufficient Evidence</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setContent("A full refund has been initiated for booking...")}>Billing: Refund Initiated</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Textarea Area with Toolbar */}
                <div className={cn(
                    "rounded-2xl border-2 transition-all duration-300 shadow-lg focus-within:ring-4 focus-within:ring-primary/5",
                    getBorderColor(),
                    "bg-background"
                )}>
                    {/* Toolbar */}
                    <div className="flex items-center gap-1 p-2 border-b bg-muted/10">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-background">
                            <Bold className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-background">
                            <Italic className="h-4 w-4" />
                        </Button>
                        <div className="w-px h-4 bg-border mx-1" />
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-background">
                            <List className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-background">
                            <ListOrdered className="h-4 w-4" />
                        </Button>
                    </div>

                    <Textarea 
                        placeholder={isInternal ? "Draft internal assessment..." : "Type official communication..."}
                        className="min-h-[120px] border-none focus-visible:ring-0 bg-transparent resize-none p-5 font-medium leading-relaxed"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />
                    
                    <div className="flex items-center justify-between p-3 border-t bg-muted/20">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-background">
                            <Paperclip className="h-4 w-4" />
                        </Button>

                        <div className="flex items-center gap-2">
                            {isInternal ? (
                                <Button 
                                    className={cn("h-10 px-6 font-black text-[10px] uppercase tracking-widest gap-2", getButtonColor())}
                                    onClick={() => handleSend()}
                                    disabled={!content.trim() || isSubmitting}
                                >
                                    Add Internal Note
                                </Button>
                            ) : (
                                <div className="flex items-center shadow-lg rounded-xl overflow-hidden border border-white/20 divide-x divide-white/10">
                                    <Button 
                                        className={cn("h-10 px-6 font-black text-[10px] uppercase tracking-widest gap-2 rounded-none", getButtonColor())}
                                        onClick={() => handleSend()}
                                        disabled={!content.trim() || isSubmitting}
                                    >
                                        <Send className="h-4 w-4" />
                                        {isSubmitting ? 'Sending...' : 'Send as Open'}
                                    </Button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button 
                                                className={cn("h-10 px-3 rounded-none", getButtonColor())}
                                                disabled={!content.trim() || isSubmitting}
                                            >
                                                <ChevronDown className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56 p-1.5 font-bold uppercase text-[10px] tracking-widest rounded-xl">
                                            <DropdownMenuItem 
                                                onClick={() => handleSend('resolved')}
                                                className="rounded-lg h-9 gap-2 focus:bg-emerald-50 focus:text-emerald-700"
                                            >
                                                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                                Send as Resolved
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                                onClick={() => handleSend('pending')}
                                                className="rounded-lg h-9 gap-2 focus:bg-amber-50 focus:text-amber-700"
                                            >
                                                <div className="h-2 w-2 rounded-full bg-amber-500" />
                                                Send as Pending User
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                                onClick={() => handleSend('escalated')}
                                                className="rounded-lg h-9 gap-2 focus:bg-red-50 focus:text-red-700"
                                            >
                                                <div className="h-2 w-2 rounded-full bg-red-500" />
                                                Send as Escalated
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
