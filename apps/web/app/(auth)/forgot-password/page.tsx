import ForgotPasswordForm from '@/app/(auth)/AuthComponents/ForgotPasswordForm';
import AuthCardLayout from '@/app/(auth)/AuthComponents/AuthCardLayout';

export default function ForgotPassword() {
    return (
        <AuthCardLayout
            title="Recover Password"
            subtitle="Let's verify your identity and restore access to your account."
            quote={{
                text: "Our account recovery system is designed with multi-layered security to ensure your data remains protected even when you lose access.",
                author: "David Chen, Security Architect",
            }}
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
