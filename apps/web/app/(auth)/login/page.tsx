import LoginForm from '@/app/(auth)/AuthComponents/LoginForm';
import AuthCardLayout from '@/app/(auth)/AuthComponents/AuthCardLayout';

export default function Login() {
    return (
        <AuthCardLayout
            title="Welcome back to VertiAccess"
            subtitle="Login to manage your drone operations or land access permissions."
            backLink={{
                href: '/',
                label: 'Back',
            }}
        >
            <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
                <LoginForm />
                
                <p className="px-4 text-center text-xs text-muted-foreground leading-normal">
                    By logging in, you agree to our{' '}
                    <a
                        href="/terms"
                        className="underline underline-offset-4 hover:text-primary transition-colors"
                    >
                        Terms of Service
                    </a>{' '}
                    and{' '}
                    <a
                        href="/privacy"
                        className="underline underline-offset-4 hover:text-primary transition-colors"
                    >
                        Privacy Policy
                    </a>
                    .
                </p>
            </div>
        </AuthCardLayout>
    );
}
