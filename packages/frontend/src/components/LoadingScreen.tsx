import { VertiAccessLogo } from './VertiAccessLogo';

export function LoadingScreen() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-6">
                <div className="relative">
                    <div className="absolute -inset-4 bg-primary/10 rounded-full blur-xl animate-pulse"></div>
                    <VertiAccessLogo className="text-4xl font-bold relative z-10 animate-pulse" />
                </div>
                <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
                    <span className="text-sm font-medium text-muted-foreground animate-pulse">
                        Loading...
                    </span>
                </div>
            </div>
        </div>
    );
}
