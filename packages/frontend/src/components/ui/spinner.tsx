import { cn } from "./utils";

interface SpinnerProps extends React.ComponentProps<"svg"> {
  size?: "sm" | "md" | "lg" | "xl";
}

const sizes = {
  sm: "size-4",
  md: "size-6",
  lg: "size-8",
  xl: "size-12",
};

export function Spinner({ className, size = "md", ...props }: SpinnerProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("animate-spin", sizes[size], className)}
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
