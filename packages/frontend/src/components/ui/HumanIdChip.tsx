import { formatDisplayId, type IDPrefix } from '../../utils/idGenerator';
import { Copy } from 'lucide-react';
import { useState } from 'react';

interface HumanIdChipProps {
    /** Raw humanId, legacy VA- id, or UUID — will be normalised to vt-<type>-<6chars> */
    id?: string | null;
    prefix: IDPrefix;
    /** Show an inline copy button */
    copyable?: boolean;
}

/**
 * A tiny mono-font pill that displays a human-readable system ID in the format
 * `vt-<type>-<6chars>`. Completely display-only — never touches the database UUID.
 */
export function HumanIdChip({ id, prefix, copyable = false }: HumanIdChipProps) {
    const [copied, setCopied] = useState(false);
    const display = formatDisplayId(id, prefix);

    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        await navigator.clipboard.writeText(display);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200 tracking-wide select-all group/chip">
            {display}
            {copyable && (
                <button
                    onClick={handleCopy}
                    className="opacity-0 group-hover/chip:opacity-100 transition-opacity text-slate-400 hover:text-slate-700"
                    title="Copy ID"
                >
                    {copied ? (
                        <span className="text-[9px] text-emerald-600 font-bold">✓</span>
                    ) : (
                        <Copy className="size-2.5" />
                    )}
                </button>
            )}
        </span>
    );
}
