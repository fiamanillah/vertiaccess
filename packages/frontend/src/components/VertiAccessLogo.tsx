export function VertiAccessLogo({ className = "text-2xl font-bold" }: { className?: string }) {
  return (
    <span className={`${className} tracking-tight`}>
      <span className="text-primary">Verti</span>
      <span className="text-foreground">Access</span>
    </span>
  );
}
