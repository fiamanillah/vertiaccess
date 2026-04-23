import { Check, X, AlertCircle } from "lucide-react";

interface PricingCardProps {
  title: string;
  price: string;
  unit: string;
  description: string;
  features: (string | { text: string; bold?: boolean; disabled?: boolean })[];
  recommended?: boolean;
  badgeText?: string;
  additionalUsage?: string;
  recommendationNote?: string;
  onSelect?: () => void;
}

export function PricingCard({
  title,
  price,
  unit,
  description,
  features,
  recommended,
  badgeText,
  additionalUsage,
  recommendationNote,
  onSelect,
}: PricingCardProps) {
  return (
    <div
      className={`card-standard flex flex-col h-full relative ${recommended ? "border-primary ring-1 ring-primary/20 bg-primary/[0.02]" : ""}`}
    >
      {recommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider z-10">
          {badgeText || "Recommended"}
        </div>
      )}
      <div className="mb-8">
        <h3 className="text-xl mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-6 h-10">{description}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-foreground">{price}</span>
          <span className="text-muted-foreground font-medium">{unit}</span>
        </div>
      </div>
      <div className="flex-1 space-y-4 mb-8">
        <div className="space-y-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Includes
          </p>
          {features.map((f, i) => {
            const isObject = typeof f === "object";
            const text = isObject ? f.text : f;
            const isBold = isObject ? f.bold : false;
            const isDisabled = isObject ? f.disabled : false;

            return (
              <div key={i} className="flex items-start gap-3">
                {isDisabled ? (
                  <X
                    className={`size-4 shrink-0 mt-0.5 text-muted-foreground`}
                  />
                ) : (
                  <Check
                    className={`size-5 shrink-0 mt-0.5 ${recommended ? "text-accent" : "text-primary"}`}
                  />
                )}
                <span
                  className={`text-sm ${isDisabled ? "text-muted-foreground/60" : "text-muted-foreground"} ${isBold ? "font-bold text-foreground" : ""}`}
                  style={isDisabled ? { textDecoration: "line-through" } : {}}
                >
                  {text}
                </span>
              </div>
            );
          })}
        </div>

        {additionalUsage && (
          <div className="mt-8 pt-6 border-t border-border">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-widest mb-3">
              Additional usage
            </h4>
            <p className="text-sm text-muted-foreground">{additionalUsage}</p>
          </div>
        )}

        {recommendationNote && (
          <div className="mt-6 p-4 bg-accent/10 rounded-xl border border-accent/20 flex gap-3">
            <AlertCircle className="size-5 text-accent shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed text-accent font-medium">
              <span className="font-bold">Why we recommend this tier:</span>{" "}
              {recommendationNote}
            </p>
          </div>
        )}
      </div>
      <button
        onClick={onSelect}
        className={
          recommended
            ? "btn-primary w-full bg-accent hover:bg-accent/90 border-accent"
            : "btn-secondary w-full"
        }
      >
        Get Started
      </button>
    </div>
  );
}
