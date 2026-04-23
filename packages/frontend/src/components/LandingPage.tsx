import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { VertiAccessLogo } from './VertiAccessLogo';
import { RequestDemoView } from './RequestDemoView';
import { LoginView } from './LoginView';
import { SignupView } from './signup/SignupView';
import { ConfirmEmailView } from './ConfirmEmailView';
import { ForgotPasswordView } from './ForgotPasswordView';
import { ResetPasswordView } from './ResetPasswordView';
import { useAuth } from '../context/AuthContext';

import { HomeView } from './landing/HomeView';
import { AboutView } from './landing/AboutView';
import { Footer } from './landing/Footer';

export interface PricingTier {
    name: string;
    price: string;
    unit: string;
    type: 'subscription' | 'payg';
    description: string;
}

type View =
    | 'home'
    | 'about'
    | 'request-demo'
    | 'login'
    | 'signup'
    | 'confirm-email'
    | 'forgot-password'
    | 'reset-password';

interface LandingPageProps {
    onLoginSuccess: () => void;
}

export function LandingPage({ onLoginSuccess }: LandingPageProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { confirmSignUp, resendCode } = useAuth();
    const [selectedTier, setSelectedTier] = useState<PricingTier | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [howItWorksRole, setHowItWorksRole] = useState<'operator' | 'landowner'>('operator');

    const pathToView: Record<string, View> = {
        '/': 'home',
        '/about': 'about',
        '/request-demo': 'request-demo',
        '/login': 'login',
        '/register': 'signup',
        '/confirm-email': 'confirm-email',
        '/forgot-password': 'forgot-password',
        '/reset-password': 'reset-password',
    };

    const viewToPath: Record<View, string> = {
        home: '/',
        about: '/about',
        'request-demo': '/request-demo',
        login: '/login',
        signup: '/register',
        'confirm-email': '/confirm-email',
        'forgot-password': '/forgot-password',
        'reset-password': '/reset-password',
    };

    const currentView: View = pathToView[location.pathname] ?? 'home';
    const pendingEmail = searchParams.get('email') ?? '';

    const setView = (
        view: View,
        options?: { replace?: boolean; query?: Record<string, string | undefined> }
    ) => {
        const params = new URLSearchParams();
        if (options?.query) {
            Object.entries(options.query).forEach(([key, value]) => {
                if (value) params.set(key, value);
            });
        }

        navigate(
            {
                pathname: viewToPath[view],
                search: params.toString() ? `?${params.toString()}` : '',
            },
            { replace: options?.replace ?? false }
        );
    };

    // Scroll to top when view changes
    useEffect(() => {
        window.scrollTo(0, 0);
        setIsMenuOpen(false);
    }, [currentView]);

    useEffect(() => {
        if (currentView === 'confirm-email' && !pendingEmail) {
            navigate('/register', { replace: true });
        }

        if (currentView === 'reset-password' && !pendingEmail) {
            navigate('/forgot-password', { replace: true });
        }
    }, [currentView, pendingEmail, navigate]);

    const handleSelectTier = (tier: PricingTier) => {
        setSelectedTier(tier);
        setView('signup');
    };

    const handleSignupComplete = (email: string) => {
        onLoginSuccess();
    };

    const handleForgotPasswordCodeSent = (email: string) => {
        setView('reset-password', { query: { email } });
    };

    const scrollToSection = (id: string) => {
        if (currentView !== 'home') {
            setView('home');
            setTimeout(() => {
                const element = document.getElementById(id);
                if (element) {
                    const navHeight = 80;
                    const elementPosition =
                        element.getBoundingClientRect().top + window.pageYOffset;
                    window.scrollTo({
                        top: elementPosition - navHeight,
                        behavior: 'smooth',
                    });
                }
            }, 100);
        } else {
            const element = document.getElementById(id);
            if (element) {
                const navHeight = 80;
                const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
                window.scrollTo({
                    top: elementPosition - navHeight,
                    behavior: 'smooth',
                });
            }
        }
        setIsMenuOpen(false);
    };

    const handleSolutionClick = (role: 'operator' | 'landowner') => {
        setHowItWorksRole(role);
        scrollToSection('how-it-works');
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border shadow-sm">
                <div className="max-w-[1200px] mx-auto px-6 h-[80px] flex items-center justify-between">
                    <div className="flex items-center gap-12">
                        <button
                            onClick={() => setView('home')}
                            className="hover:opacity-80 transition-opacity"
                        >
                            <VertiAccessLogo className="h-10" />
                        </button>
                        <div className="hidden lg:flex items-center gap-8">
                            <button
                                onClick={() => setView('about')}
                                className={`text-sm font-medium transition-colors ${currentView === 'about' ? 'text-primary underline underline-offset-8' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                About
                            </button>
                            <button
                                onClick={() => scrollToSection('how-it-works')}
                                className="text-sm font-medium transition-colors text-muted-foreground hover:text-foreground"
                            >
                                How it works
                            </button>
                            <button
                                onClick={() => scrollToSection('pricing')}
                                className="text-sm font-medium transition-colors text-muted-foreground hover:text-foreground"
                            >
                                Choose your Plan
                            </button>
                            <button
                                onClick={() => scrollToSection('faq')}
                                className="text-sm font-medium transition-colors text-muted-foreground hover:text-foreground"
                            >
                                FAQ's
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setView('login')}
                            className="hidden sm:block text-sm font-medium text-muted-foreground hover:text-foreground px-4 py-2 transition-colors"
                        >
                            Login
                        </button>
                        <div className="hidden sm:flex items-center gap-3">
                            <button
                                onClick={() => setView('request-demo')}
                                className="btn-secondary h-11 px-5"
                            >
                                Request Demo
                            </button>
                            <button
                                onClick={() => setView('signup')}
                                className="btn-primary h-11 px-5"
                            >
                                Get Started
                            </button>
                        </div>

                        <button
                            className="lg:hidden p-2 text-foreground"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="lg:hidden absolute top-20 left-0 right-0 bg-white border-b border-border p-6 space-y-4 animate-in slide-in-from-top duration-200">
                        <button
                            onClick={() => setView('about')}
                            className="block w-full text-left text-lg font-medium p-2"
                        >
                            About
                        </button>
                        <button
                            onClick={() => scrollToSection('how-it-works')}
                            className="block w-full text-left text-lg font-medium p-2"
                        >
                            How it works
                        </button>
                        <button
                            onClick={() => scrollToSection('pricing')}
                            className="block w-full text-left text-lg font-medium p-2"
                        >
                            Choose your Plan
                        </button>
                        <button
                            onClick={() => scrollToSection('faq')}
                            className="block w-full text-left text-lg font-medium p-2"
                        >
                            FAQ's
                        </button>
                        <div className="pt-4 flex flex-col gap-3">
                            <button
                                onClick={() => setView('signup')}
                                className="btn-primary w-full"
                            >
                                Get Started
                            </button>
                            <button
                                onClick={() => setView('request-demo')}
                                className="btn-secondary w-full"
                            >
                                Request Demo
                            </button>
                            <button
                                onClick={() => setView('login')}
                                className="w-full py-3 text-center text-muted-foreground"
                            >
                                Login
                            </button>
                        </div>
                    </div>
                )}
            </nav>

            {/* Main Content */}
            <main className="flex-1">
                {currentView === 'home' && (
                    <HomeView
                        onGetStarted={() => {
                            setSelectedTier(null);
                            setView('signup');
                        }}
                        onRequestDemo={() => setView('request-demo')}
                        onSelectTier={handleSelectTier}
                        howItWorksRole={howItWorksRole}
                        setHowItWorksRole={setHowItWorksRole}
                    />
                )}
                {currentView === 'about' && <AboutView />}
                {currentView === 'request-demo' && (
                    <RequestDemoView onSuccess={() => setView('home')} />
                )}
                {currentView === 'login' && (
                    <LoginView
                        onBack={() => setView('home')}
                        onSignup={() => {
                            setSelectedTier(null);
                            setView('signup');
                        }}
                        onLoginSuccess={onLoginSuccess}
                        onForgotPassword={() => setView('forgot-password')}
                        onRequireEmailVerification={email =>
                            setView('confirm-email', { query: { email } })
                        }
                    />
                )}
                {currentView === 'signup' && (
                    <SignupView
                        onSignupComplete={handleSignupComplete}
                        onBack={() => {
                            setSelectedTier(null);
                            setView('home');
                        }}
                        onLogin={() => setView('login')}
                        selectedTier={selectedTier}
                    />
                )}
                {currentView === 'confirm-email' && (
                    <ConfirmEmailView
                        email={pendingEmail}
                        onConfirm={confirmSignUp}
                        onResendCode={resendCode}
                        onBack={() => setView('signup')}
                        onLoginAfterConfirm={() => setView('login')}
                    />
                )}
                {currentView === 'forgot-password' && (
                    <ForgotPasswordView
                        onBack={() => setView('login')}
                        onCodeSent={handleForgotPasswordCodeSent}
                        onLogin={() => setView('login')}
                    />
                )}
                {currentView === 'reset-password' && (
                    <ResetPasswordView
                        email={pendingEmail}
                        onBack={() => setView('forgot-password')}
                        onLogin={() => setView('login')}
                    />
                )}
            </main>

            {/* Footer */}
            <Footer
                onNavigate={view => setView(view as View)}
                onScrollToSection={scrollToSection}
                onRequestDemo={() => setView('request-demo')}
                onSolutionClick={handleSolutionClick}
            />
        </div>
    );
}
