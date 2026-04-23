import { useState } from "react";
import { ArrowLeft, Mail, KeyRound, Loader2 } from "lucide-react";
import { VertiAccessLogo } from "./VertiAccessLogo";
import { toast } from "sonner";
import { Button } from "./ui/button";

interface ConfirmEmailViewProps {
  email: string;
  onConfirm: (email: string, code: string) => Promise<void>;
  onResendCode: (email: string) => Promise<void>;
  onBack: () => void;
  onLoginAfterConfirm: () => void;
}

export function ConfirmEmailView({
  email,
  onConfirm,
  onResendCode,
  onBack,
  onLoginAfterConfirm,
}: ConfirmEmailViewProps) {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await onConfirm(email, code);
      setIsConfirmed(true);
      toast.success("Email verified successfully!");
    } catch (error: any) {
      const message =
        error?.message || "Failed to verify code. Please try again.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await onResendCode(email);
      toast.success("A new verification code has been sent to your email.");
    } catch (error: any) {
      const message = error?.message || "Failed to resend code.";
      toast.error(message);
    } finally {
      setIsResending(false);
    }
  };

  if (isConfirmed) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-muted/10 flex items-center justify-center p-6">
        <div className="max-w-[450px] w-full bg-white p-8 md:p-10 rounded-3xl border border-border shadow-xl shadow-primary/5 text-center">
          <VertiAccessLogo className="h-10 mx-auto mb-6" />
          <div className="w-16 h-16 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Email Verified!</h1>
          <p className="text-muted-foreground mb-8">
            Your account has been verified successfully. You can now log in.
          </p>
          <Button
            onClick={onLoginAfterConfirm}
            className="h-14 w-full text-lg font-bold shadow-lg shadow-primary/20"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-muted/10 flex items-center justify-center p-6">
      <div className="max-w-[450px] w-full bg-white p-8 md:p-10 rounded-3xl border border-border shadow-xl shadow-primary/5">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft className="size-4" />
          Back
        </button>

        <div className="mb-10 text-center">
          <VertiAccessLogo className="h-10 mx-auto mb-6" />
          <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Verify Your Email</h1>
          <p className="text-muted-foreground mt-2">
            We've sent a 6-digit verification code to
          </p>
          <p className="text-foreground font-semibold mt-1">{email}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <KeyRound className="size-4 text-muted-foreground" />
              Verification Code
            </label>
            <input
              required
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              className="w-full h-14 px-4 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-muted/5 text-center text-2xl font-mono tracking-[0.5em]"
              placeholder="000000"
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
            />
          </div>

          <Button
            type="submit"
            loading={isLoading}
            disabled={code.length !== 6}
            className="h-14 w-full text-lg font-bold shadow-lg shadow-primary/20 mt-4"
          >
            Verify Email
          </Button>

          <div className="pt-4 border-t border-border text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Didn't receive the code?
            </p>
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
            >
              {isResending ? "Sending..." : "Resend verification code"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
