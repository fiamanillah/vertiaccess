import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface AccordionItemProps {
  title: string;
  content: string;
}

export function AccordionItem({ title, content }: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden bg-white">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-6 py-5 flex items-center justify-between ${isOpen ? "bg-muted/30" : "hover:bg-muted/30"} transition-colors`}
      >
        <span className="font-semibold text-foreground text-left">{title}</span>
        <ChevronDown
          className={`size-5 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : "hover:rotate-180"}`}
        />
      </button>
      {isOpen && (
        <div className="px-6 pb-5 animate-in slide-in-from-top-2 duration-200">
          <p className="text-muted-foreground text-sm leading-relaxed">
            {content}
          </p>
        </div>
      )}
    </div>
  );
}
