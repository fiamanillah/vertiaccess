interface StepProps {
  icon: any;
  number: string;
  title: string;
  text: string;
  darkBackground?: boolean;
}

export function Step({
  icon: Icon,
  number,
  title,
  text,
  darkBackground,
}: StepProps) {
  return (
    <div className="flex flex-col items-center text-center group">
      <div className="relative mb-8">
        <div
          className={`size-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${darkBackground ? "bg-white/10" : "bg-primary/10"}`}
        >
          <Icon
            className={`size-8 ${darkBackground ? "text-white" : "text-primary"}`}
          />
        </div>
        <div
          className={`absolute -top-3 -right-3 size-8 rounded-full border-2 flex items-center justify-center font-bold text-sm shadow-sm ${darkBackground ? "bg-blue-600 border-white text-white" : "bg-white border-primary text-primary"}`}
        >
          {number}
        </div>
      </div>
      <h3
        className={`text-lg font-semibold mb-4 ${darkBackground ? "text-white" : ""}`}
      >
        {title}
      </h3>
      <p
        className={`text-sm leading-relaxed max-w-[280px] ${darkBackground ? "text-white/70" : "text-muted-foreground"}`}
      >
        {text}
      </p>
    </div>
  );
}
