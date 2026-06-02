import ForgotPasswordForm from '@/app/(auth)/AuthComponents/ForgotPasswordForm';
import AuthCardLayout from '@/app/(auth)/AuthComponents/AuthCardLayout';

export default function ForgotPassword() {
    return (
        <AuthCardLayout
            title="Recover Password"
            subtitle="Let's verify your identity and restore access to your account."
            backLink={{
                href: '/login',
                label: 'Back',
            }}
        >
            <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
                <ForgotPasswordForm />
            </div>
        </AuthCardLayout>
    );
}
