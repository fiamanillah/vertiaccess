function normalizeBaseUrl(baseUrl: string): string {
    const trimmed = baseUrl.replace(/\/+$/, '');

    if (/\.execute-api\.[^.]+\.amazonaws\.com$/.test(trimmed)) {
        const stage = (import.meta as any).env.VITE_API_STAGE;

        // Only append a stage when explicitly configured.
        if (stage && stage.trim()) {
            return `${trimmed}/${stage.trim()}`;
        }
    }

    return trimmed;
}

export function getApiBaseUrl(): string {
    const baseUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:3000';
    return normalizeBaseUrl(baseUrl);
}
