'use client';

import * as React from 'react';
import { MoreHorizontal, Star } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';

export interface CreditCardProps {
  id: string;
  type: string;
  lastFour: string;
  name: string;
  expiry: string;
  isDefault?: boolean;
  onMakeDefault?: (id: string) => void;
  onRemove?: (id: string) => void;
  className?: string;
}

export function CreditCard({
  id,
  type,
  lastFour,
  name,
  expiry,
  isDefault,
  onMakeDefault,
  onRemove,
  className,
}: CreditCardProps) {
  return (
    <div
      className={`relative w-full max-w-[350px] aspect-[1.6/1] rounded-2xl p-6 text-white shadow-xl overflow-hidden group ${className}`}
    >
      {/* Background Gradient & Pattern */}
      <div
        className={`absolute inset-0 z-0 ${isDefault
          ? 'bg-gradient-to-br from-primary via-primary/90 to-primary/70'
          : 'bg-gradient-to-br from-neutral-800 via-neutral-900 to-black'
          }`}
      />
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.2),transparent)] z-0" />

      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 backdrop-blur-[2px] z-0" />

      <div className="relative z-10 h-full flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <span className="text-xl font-bold tracking-widest italic uppercase">
              {type}
            </span>
            {isDefault && (
              <span className="flex items-center gap-1 text-md uppercase font-bold tracking-wider text-primary-foreground/80">
                <Star size={16} className="fill-current" /> Default Card
              </span>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 hover:bg-white/10 rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/50">
                <MoreHorizontal size={20} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!isDefault && onMakeDefault && (
                <DropdownMenuItem onClick={() => onMakeDefault(id)}>
                  Make Default
                </DropdownMenuItem>
              )}
              {onRemove && (
                <DropdownMenuItem
                  onClick={() => onRemove(id)}
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                >
                  Remove Card
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-1">
          <div className="text-2xl font-mono  flex gap-4">
            <span>••••</span>
            <span>••••</span>
            <span>••••</span>
            <span>{lastFour}</span>
          </div>
        </div>

        <div className="flex justify-between items-end">
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase opacity-60 tracking-wider">
              Card Holder
            </p>
            <p className="text-sm font-medium tracking-wide">{name}</p>
          </div>
          <div className="space-y-0.5 text-right">
            <p className="text-[10px] uppercase opacity-60 tracking-wider">
              Valid Thru
            </p>
            <p className="text-sm font-medium tracking-wide">{expiry}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
