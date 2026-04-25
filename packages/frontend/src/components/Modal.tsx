import { X } from 'lucide-react';
import * as React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogOverlay,
} from './ui/dialog';
import { cn } from './ui/utils';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
            <DialogOverlay className="bg-black/40 backdrop-blur-xl z-[100]" />
            <DialogContent 
                className={cn(
                    "bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-0 gap-0 border-none z-[100] isolation-isolate",
                    "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]"
                )}
            >
                <DialogHeader className="p-6 border-b border-border rounded-t-3xl flex flex-row items-center justify-between space-y-0">
                    <DialogTitle className="text-xl font-semibold m-0">{title}</DialogTitle>
                    {/* The close button is handled by DialogContent's internal Close primitive, 
                        but we can customize its position or icon if needed. 
                        In this case, DialogContent already includes a Close button. */}
                </DialogHeader>
                <div className="p-6 rounded-b-3xl">
                    {children}
                </div>
            </DialogContent>
        </Dialog>
    );
}
