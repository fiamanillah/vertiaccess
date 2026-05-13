'use client';

import * as React from 'react';
import {
    Dialog,
    DialogContent,
} from '@workspace/ui/components/dialog';
import { X, Download, Maximize2 } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';

interface ImageLightboxProps {
    src: string | null;
    isOpen: boolean;
    onClose: () => void;
}

export function ImageLightbox({ src, isOpen, onClose }: ImageLightboxProps) {
    if (!src) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 border-none bg-black/90 backdrop-blur-xl shadow-2xl overflow-hidden flex items-center justify-center group">
                <div className="absolute top-4 right-4 z-50 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Button
                        variant="secondary"
                        size="icon"
                        className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 text-white border-white/10 backdrop-blur-md"
                        asChild
                    >
                        <a href={src} download target="_blank" rel="noreferrer">
                            <Download className="h-4 w-4" />
                        </a>
                    </Button>
                    <Button
                        variant="secondary"
                        size="icon"
                        className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 text-white border-white/10 backdrop-blur-md"
                        onClick={onClose}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="relative w-full h-full flex items-center justify-center p-8">
                    <img
                        src={src}
                        alt="Evidence Preview"
                        className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
                    />
                </div>
                
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Maximize2 className="h-3 w-3 text-white/60" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Full Evidence Preview</span>
                </div>
            </DialogContent>
        </Dialog>
    );
}
