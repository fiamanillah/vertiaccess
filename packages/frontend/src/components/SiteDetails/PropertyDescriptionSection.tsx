import type { Site } from '../../types';
import { SectionTitle } from './SectionTitle';

interface PropertyDescriptionSectionProps {
    site: Site;
    isEditing: boolean;
    siteInformation: string;
    setSiteInformation: (val: string) => void;
}

export function PropertyDescriptionSection({
    site,
    isEditing,
    siteInformation,
    setSiteInformation,
}: PropertyDescriptionSectionProps) {
    return (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <SectionTitle>Property Description</SectionTitle>
            {isEditing ? (
                <textarea
                    value={siteInformation}
                    onChange={e => setSiteInformation(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none min-h-30 bg-slate-50 text-sm"
                    placeholder="Detail any specific hazards, ground surface, and access instructions."
                />
            ) : (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <p className="text-sm text-slate-600 leading-relaxed italic">
                        {site.siteInformation || 'No description provided.'}
                    </p>
                </div>
            )}
        </div>
    );
}
