'use client';

import * as React from 'react';
import { Button } from '@workspace/ui/components/button';
import { Textarea } from '@workspace/ui/components/textarea';
import { 
    Paperclip, 
    Send, 
    FileText,
    ShieldCheck,
    CloudUpload
} from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import { toast } from 'sonner';
import { FileUploader } from '@/components/file-uploader';

export function ResolutionEditor() {
    const [content, setContent] = React.useState('');
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const handleSubmit = () => {
        if (!content.trim()) return;
        setIsSubmitting(true);
        // Simulate submission
        setTimeout(() => {
            toast.success('Official reply submitted to the Safety Team');
            setContent('');
            setIsSubmitting(false);
        }, 1500);
    };

    return (
        <div className="bg-card border-2 border-border/50 rounded-2xl overflow-hidden shadow-xl focus-within:border-primary/30 transition-all duration-300">

            {/* Main Input Area */}
            <div className="p-1">
                <Textarea
                    placeholder="Provide a detailed, professional response for the investigation..."
                    className="min-h-[200px] border-none focus-visible:ring-0 resize-none bg-transparent font-medium leading-relaxed p-6"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />
            </div>

            {/* Upload Zone */}
            <div className="px-6 pb-6 space-y-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1 flex items-center gap-2">
                        <Paperclip className="h-3 w-3" />
                        Attachments
                    </label>
                    <FileUploader
                        maxSize={15}
                        className="bg-muted/10 border-border/40 w-full"
                    />
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-dashed">
                    <div className="flex items-center gap-2 text-indigo-600">
                        <ShieldCheck className="h-4 w-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Formal Legal Declaration Flow Enabled</span>
                    </div>
                    <Button 
                        className="w-full sm:w-auto h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs uppercase tracking-[0.1em] gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
                        disabled={!content.trim() || isSubmitting}
                        onClick={handleSubmit}
                    >
                        {isSubmitting ? 'Submitting...' : (
                            <>
                                <Send className="h-4 w-4" />
                                Submit Official Reply
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
