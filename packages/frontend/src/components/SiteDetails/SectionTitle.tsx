export const SectionTitle = ({ children }: { children: string }) => (
    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
        <div className="w-1 h-5 bg-blue-600 rounded-full" />
        {children}
    </h3>
);
