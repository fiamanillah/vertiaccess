import { useState } from "react";
import { ArrowLeft, KeyRound, Lock, Loader2 } from "lucide-react";
import { VertiAccessLogo } from "./VertiAccessLogo";
import { cognitoResetPassword } from "../lib/auth";
import { toast } from "sonner";
import { Button } from "./ui/button";

interface ResetPasswordViewProps {
  email: string;
  onBack: () => void;
  onLogin: () => void;
}

export function ResetPasswordView({
  email,
  onBack,
  onLogin,
}: ResetPasswordViewProps) {
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);

    try {
      await cognitoResetPassword(email, code, newPassword);
      setIsSuccess(true);
      toast.success("Password reset successfully!");
    } catch (error: any) {
      const message =
        error?.message || "Failed to reset password. Please try again.";
      if (message.includes("CodeMismatchException") || message.includes("Invalid verification code")) {
        toast.error("Invalid or expired verification code.");
      } else if (message.includes("Password did not conform")) {
        toast.error(
          "Password must have uppercase, lowercase, and numbers (min 8 chars)."
        );
      } else if (message.includes("ExpiredCodeException")) {
        toast.error("Code has expired. Please request a new one.");
      } else {
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (isSuccess) {
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
          <h1 className="text-2xl font-bold mb-2">Password Reset!</h1>
          <p className="text-muted-foreground mb-8">
            Your password has been reset successfully. You can now log in with
            your new password.
          </p>
          <Button
            onClick={onLogin}
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
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Reset Password</h1>
          <p className="text-muted-foreground mt-2">
            Enter the code sent to
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
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Lock className="size-4 text-muted-foreground" />
              New Password
            </label>
            <input
              required
              type="password"
              minLength={8}
              className="w-full h-12 px-4 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-muted/5"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Lock className="size-4 text-muted-foreground" />
              Confirm New Password
            </label>
            <input
              required
              type="password"
              minLength={8}
              className="w-full h-12 px-4 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-muted/5"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            loading={isLoading}
            disabled={code.length !== 6}
            className="h-14 w-full text-lg font-bold shadow-lg shadow-primary/20 mt-4"
          >
            Reset Password
          </Button>
        </form>
      </div>
    </div>
  );
}
