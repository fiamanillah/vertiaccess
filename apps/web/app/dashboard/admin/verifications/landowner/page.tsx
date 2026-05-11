export default function AdminLandownerVerificationPage() {
    return (
        <div className="flex flex-col gap-4 p-8">
            <h1 className="text-2xl font-bold tracking-tight">Landowner Verifications</h1>
            <p className="text-muted-foreground">Review and approve landowner account applications.</p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="h-40 rounded-xl border border-dashed flex items-center justify-center">
                    Placeholder: Landowners Table
                </div>
            </div>
        </div>
    );
}
