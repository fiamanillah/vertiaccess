import { Loader } from 'lucide-react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    message?: string;
}

export function LoadingSpinner({ size = 'md', message }: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: 'size-5',
        md: 'size-8',
        lg: 'size-12',
    };

    const textSizeClasses = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
    };

    return (
        <div className="flex flex-col items-center justify-center gap-3 py-8">
            <div className="relative">
                {/* Background circle */}
                <div className={`${sizeClasses[size]} rounded-full bg-blue-100/50`} />
                {/* Spinner icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <Loader className={`${sizeClasses[size]} text-blue-600 animate-spin`} />
                </div>
            </div>
            {message && (
                <p className={`${textSizeClasses[size]} font-medium text-slate-600`}>{message}</p>
            )}
        </div>
    );
}
