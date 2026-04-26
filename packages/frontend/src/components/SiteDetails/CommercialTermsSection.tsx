import type { Site } from '../../types';
import { SectionTitle } from './SectionTitle';
import { LabelValue } from './LabelValue';

export function CommercialTermsSection({ site }: { site: Site }) {
    return (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <SectionTitle>Commercial Terms</SectionTitle>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                <LabelValue
                    label="TOAL Access Fee"
                    value={`£${Number(site.toalAccessFee || 0).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    })}`}
                />
                <LabelValue
                    label="Emergency Access Fee"
                    value={`£${Number(site.clzAccessFee || 0).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    })}`}
                />
                <LabelValue
                    label="Primary Function"
                    value={site.siteType === 'emergency' ? 'Emergency' : 'Take-off & Landing'}
                />
                <LabelValue
                    label="Includes Emergency Landing"
                    value={site.clzEnabled ? 'Yes' : 'No'}
                />
                <LabelValue
                    label="Booking Approval"
                    value={site.autoApprove ? 'Auto Approval' : 'Manual Approval'}
                />
            </div>
        </div>
    );
}
