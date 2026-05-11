export default function AdminSitesVerificationPage() {
    return (
        <div className="flex flex-col gap-4 p-8">
            <h1 className="text-2xl font-bold tracking-tight">Site Verifications</h1>
            <p className="text-muted-foreground">Manage and verify landing sites across the network.</p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="h-40 rounded-xl border border-dashed flex items-center justify-center">
                    Placeholder: Sites Table
                </div>
            </div>
        </div>
    );
}
