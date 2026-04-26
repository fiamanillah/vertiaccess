export const Badge = ({
    children,
    variant,
}: {
    children: string;
    variant: 'amber' | 'blue' | 'green';
}) => {
    const variants = {
        amber: 'bg-[#FFFBEB] text-[#92400E] border-[#FEF3C7]',
        blue: 'bg-[#EFF6FF] text-blue-600 border-[#DBEAFE]',
        green: 'bg-[#ECFDF5] text-[#059669] border-[#D1FAE5]',
    };
    return (
        <span
            className={`inline-flex px-4 py-1.5 rounded-full text-sm font-medium border ${variants[variant]}`}
        >
            {children}
        </span>
    );
};
