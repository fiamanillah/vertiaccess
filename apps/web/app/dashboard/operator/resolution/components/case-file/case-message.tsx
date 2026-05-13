'use client';

import * as React from 'react';
import { Message } from '@/app/dashboard/components/resolution/types';
import { cn } from '@workspace/ui/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/avatar';
import { Button } from '@workspace/ui/components/button';
import { format } from 'date-fns';
import { Paperclip, Command, FileText, ExternalLink, ZoomIn } from 'lucide-react';
import { ImageLightbox } from './image-lightbox';

interface CaseMessageProps {
    message: Message;
    showAdminName?: boolean;
}

export function CaseMessage({ message, showAdminName = false }: CaseMessageProps) {
    const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
    const isAdmin = message.sender === 'admin';

    return (
        <div className={cn(
            "group w-full rounded-2xl border bg-card shadow-sm overflow-hidden transition-all duration-300",
            isAdmin ? "border-primary/20 shadow-primary/5" : "border-border/50"
        )}>
            <div className={cn(
                "px-6 py-4 border-b flex items-center justify-between gap-4",
                isAdmin ? "bg-primary/5" : "bg-muted/10"
            )}>
                <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border-2 border-background shadow-sm">
                        {isAdmin ? (
                            <div className="h-full w-full bg-primary flex items-center justify-center text-primary-foreground">
                                <Command className="h-4 w-4" />
                            </div>
                        ) : (
                            <>
                                <AvatarImage src={message.senderAvatar} />
                                <AvatarFallback className="bg-muted text-muted-foreground font-black text-xs uppercase">
                                    {message.senderName.charAt(0)}
                                </AvatarFallback>
                            </>
                        )}
                    </Avatar>
                    <div className="space-y-0.5">
                        <div className="text-sm font-black text-foreground tracking-tight flex items-center gap-2">
                            {isAdmin ? (showAdminName ? message.senderName : 'VertiAccess Support Team') : 'You'}
                            {isAdmin && <span className="text-[8px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-black uppercase tracking-widest">Official</span>}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                            {format(new Date(message.timestamp), 'MMMM d, yyyy @ HH:mm')}
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="p-6">
                <div className="prose prose-sm max-w-none text-foreground font-medium leading-relaxed whitespace-pre-wrap">
                    {message.content}
                </div>

                {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-dashed space-y-4">
                        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <Paperclip className="h-3 w-3" /> Submitted Evidence & Documents
                        </div>
                        
                        {/* Thumbnail Grid for Images */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {message.attachments.map((url, i) => (
                                <div 
                                    key={i} 
                                    className="group/thumb relative aspect-square rounded-xl border overflow-hidden bg-muted/40 cursor-zoom-in"
                                    onClick={() => setSelectedImage(url)}
                                >
                                    <img 
                                        src={url} 
                                        alt={`Evidence ${i+1}`}
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover/thumb:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                                        <ZoomIn className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* File List for Non-Images (optional) */}
                        <div className="flex flex-col gap-2">
                            {message.attachments.map((url, i) => (
                                <div 
                                    key={i} 
                                    className="flex items-center justify-between p-3 rounded-xl border bg-muted/20 hover:bg-muted/30 transition-colors group/file"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-background border flex items-center justify-center text-muted-foreground group-hover/file:text-primary transition-colors">
                                            <FileText className="h-4 w-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-foreground">attachment_{i+1}.png</span>
                                            <span className="text-[9px] text-muted-foreground uppercase font-black tracking-tighter">1.2 MB • Image</span>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" asChild>
                                        <a href={url} target="_blank" rel="noreferrer">
                                            <ExternalLink className="h-4 w-4" />
                                        </a>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <ImageLightbox 
                isOpen={!!selectedImage} 
                onClose={() => setSelectedImage(null)} 
                src={selectedImage} 
            />
        </div>
    );
}
