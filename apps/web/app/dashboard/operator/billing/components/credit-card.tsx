'use client';

import * as React from 'react';
import { MoreHorizontal, Star, Wifi, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  onEdit?: (id: string) => void;
  onRemove?: (id: string) => void;
  className?: string;
}

// Minimal SVG chip
function ChipIcon() {
  return (
    <svg viewBox="0 0 50 40" width="42" height="32" fill="none">
      <rect x="1" y="1" width="48" height="38" rx="6" fill="rgba(255,255,255,0.25)" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
      <rect x="17" y="1" width="16" height="38" fill="rgba(255,255,255,0.12)" />
      <rect x="1" y="13" width="48" height="14" fill="rgba(255,255,255,0.12)" />
      <rect x="17" y="13" width="16" height="14" fill="rgba(255,255,255,0.22)" />
    </svg>
  );
}

function NetworkLogo({ type }: { type: string }) {
  const t = type.toLowerCase();
  if (t === 'visa') {
    return (
      <span className="text-white font-black text-[22px] italic tracking-tighter drop-shadow-lg">
        VISA
      </span>
    );
  }
  if (t === 'mastercard') {
    return (
      <div className="flex items-center">
        <div className="w-7 h-7 rounded-full bg-[#EB001B] opacity-90" />
        <div className="w-7 h-7 rounded-full bg-[#F79E1B] -ml-3.5 opacity-90" />
      </div>
    );
  }
  if (t === 'amex' || t === 'american express') {
    return <span className="text-white font-black text-[16px] tracking-widest drop-shadow-lg">AMEX</span>;
  }
  return <span className="text-white font-bold text-sm uppercase tracking-widest">{type}</span>;
}

export function CreditCard({
  id,
  type,
  lastFour,
  name,
  expiry,
  isDefault,
  onMakeDefault,
  onEdit,
  onRemove,
  className,
}: CreditCardProps) {
  return (
    <div
      className={`relative w-full rounded-3xl overflow-hidden text-white shadow-2xl ${className}`}
      style={{ aspectRatio: '1.586 / 1' }}
    >
      {/* --- Background layers --- */}
      {/* Base gradient */}
      <div
        className="absolute inset-0 z-0"
        style={
          isDefault
            ? {
              background:
                'linear-gradient(135deg, var(--color-primary) 0%, oklch(from var(--color-primary) calc(l - 0.12) c h) 60%, oklch(from var(--color-primary) calc(l - 0.22) c h) 100%)',
            }
            : {
              background:
                'linear-gradient(135deg, #1a1a2e 0%, #16213e 45%, #0f3460 100%)',
            }
        }
      />

      {/* Subtle noise/grain texture via a repeating pattern */}
      <div
        className="absolute inset-0 z-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Glossy highlight at top */}
      <div className="absolute inset-0 z-0" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 50%)' }} />

      {/* Circular glow accent */}
      <div
        className="absolute -right-16 -top-16 z-0 w-56 h-56 rounded-full opacity-25 blur-3xl"
        style={{ background: isDefault ? 'rgba(255,255,255,0.6)' : 'rgba(99,179,237,0.5)' }}
      />
      <div
        className="absolute -left-10 -bottom-12 z-0 w-44 h-44 rounded-full opacity-20 blur-2xl"
        style={{ background: isDefault ? 'rgba(255,255,255,0.4)' : 'rgba(49,130,206,0.6)' }}
      />

      {/* --- Content --- */}
      <div className="relative z-10 h-full flex flex-col justify-between p-6">
        {/* Top row: chip + menu */}
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Wifi size={16} className="opacity-60 rotate-90" />
              {isDefault && (
                <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest text-white/70">
                  <Star size={9} className="fill-white/70" /> Default
                </span>
              )}
            </div>
            <ChipIcon />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 hover:bg-white/15 rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/50 text-white/80 hover:text-white">
                <MoreHorizontal size={18} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {!isDefault && onMakeDefault && (
                <DropdownMenuItem onClick={() => onMakeDefault(id)} className="cursor-pointer gap-2">
                  <Star size={14} className="text-muted-foreground" /> Make Default
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(id)} className="cursor-pointer gap-2">
                  <Pencil size={14} className="text-muted-foreground" /> Edit Card
                </DropdownMenuItem>
              )}
              {onRemove && (
                <>
                  {(onMakeDefault || onEdit) && <DropdownMenuSeparator />}
                  <DropdownMenuItem
                    onClick={() => onRemove(id)}
                    className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer gap-2"
                  >
                    <Trash2 size={14} /> Remove Card
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Card number */}
        <div>
          <div className="font-mono text-[18px] tracking-[0.22em] flex justify-between text-white/90">
            <span>••••</span>
            <span>••••</span>
            <span>••••</span>
            <span className="text-white font-semibold">{lastFour}</span>
          </div>
        </div>

        {/* Bottom row: holder + expiry + network */}
        <div className="flex justify-between items-end">
          <div className="space-y-0.5">
            <p className="text-[9px] uppercase tracking-[0.18em] text-white/50 font-medium">
              Card Holder
            </p>
            <p className="text-sm font-semibold tracking-wide truncate max-w-[140px]">{name}</p>
          </div>
          <div className="space-y-0.5 text-center">
            <p className="text-[9px] uppercase tracking-[0.18em] text-white/50 font-medium">
              Expires
            </p>
            <p className="text-sm font-semibold tracking-widest">{expiry}</p>
          </div>
          <NetworkLogo type={type} />
        </div>
      </div>
    </div>
  );
}
