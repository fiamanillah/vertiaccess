import { useState } from 'react';
import { Mail, Lock, ArrowLeft } from 'lucide-react';
import { VertiAccessLogo } from './VertiAccessLogo';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from './ui/button';

interface LoginViewProps {
    onBack: () => void;
    onSignup: () => void;
    onLoginSuccess: () => void;
    onForgotPassword: () => void;
    onRequireEmailVerification: (email: string) => void;
}

export function LoginView({
    onBack,
    onSignup,
    onLoginSuccess,
    onForgotPassword,
    onRequireEmailVerification,
}: LoginViewProps) {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await login(email.trim().toLowerCase(), password);
            toast.success('Login successful!');
            onLoginSuccess();
        } catch (error: any) {
            const message = error?.message || 'Login failed. Please try again.';
            const errorCode = error?.code || error?.name || '';

            if (
                message.includes('User is not confirmed') ||
                errorCode === 'UserNotConfirmedException'
            ) {
                toast.error('Your email is not verified. Enter the OTP to verify your account.');
                onRequireEmailVerification(email);
            } else if (message.includes('Incorrect username or password')) {
                toast.error('Invalid email or password.');
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
                    Back to Home
                </button>

                <div className="mb-10 text-center">
                    <VertiAccessLogo className="size-10 mx-auto mb-6" />
                    <h1 className="text-2xl font-bold">Welcome Back</h1>
                    <p className="text-muted-foreground mt-2">Log in to your VertiAccess account</p>
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
                            onChange={e => setEmail(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <Lock className="size-4 text-muted-foreground" />
                            Password
                        </label>
                        <input
                            required
                            type="password"
                            className="w-full h-12 px-4 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-muted/5"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>

                    <Button
                        type="submit"
                        loading={isLoading}
                        className="h-14 w-full text-lg font-bold shadow-lg shadow-primary/20 mt-4"
                    >
                        Login to Dashboard
                    </Button>

                    <div className="pt-6 border-t border-border flex flex-col items-center gap-4">
                        <button
                            type="button"
                            onClick={onForgotPassword}
                            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                        >
                            Forgot your password?
                        </button>
                        <button
                            type="button"
                            onClick={() => onSignup()}
                            className="text-sm font-medium text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                        >
                            Don't have an account?{' '}
                            <span className="text-primary font-bold">Sign up</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
