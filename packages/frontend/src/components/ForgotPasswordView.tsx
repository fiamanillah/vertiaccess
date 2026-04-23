import { useState } from "react";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import { VertiAccessLogo } from "./VertiAccessLogo";
import { cognitoForgotPassword } from "../lib/auth";
import { toast } from "sonner";
import { Button } from "./ui/button";

interface ForgotPasswordViewProps {
  onBack: () => void;
  onCodeSent: (email: string) => void;
  onLogin: () => void;
}

export function ForgotPasswordView({
  onBack,
  onCodeSent,
  onLogin,
}: ForgotPasswordViewProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await cognitoForgotPassword(email);
      toast.success("Reset code sent! Check your email inbox.");
      onCodeSent(email);
    } catch (error: any) {
      const message =
        error?.message || "Failed to send reset code. Please try again.";
      if (message.includes("UserNotFoundException")) {
        // Don't reveal whether account exists
        toast.success("If an account with that email exists, a reset code has been sent.");
        onCodeSent(email);
      } else if (message.includes("LimitExceededException")) {
        toast.error("Too many attempts. Please try again later.");
      } else {
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-muted/10 flex items-center justify-center p-6">
      <div className="max-w-[450px] w-full bg-white p-8 md:p-10 rounded-3xl border border-border shadow-xl shadow-primary/5">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft className="size-4" />
          Back to Login
        </button>

        <div className="mb-10 text-center">
          <VertiAccessLogo className="h-10 mx-auto mb-6" />
          <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold">Forgot Password?</h1>
          <p className="text-muted-foreground mt-2">
            Enter your email and we'll send you a code to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Mail className="size-4 text-muted-foreground" />
              Email Address
            </label>
            <input
              required
              type="email"
              className="w-full h-12 px-4 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-muted/5"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            loading={isLoading}
            className="h-14 w-full text-lg font-bold shadow-lg shadow-primary/20 mt-4"
          >
            Send Reset Code
          </Button>

          <div className="pt-6 border-t border-border flex flex-col items-center gap-4">
            <button
              type="button"
              onClick={onLogin}
              className="text-sm font-medium text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
            >
              Remember your password?{" "}
              <span className="text-primary font-bold">Log in</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
