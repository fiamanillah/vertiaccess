import type { Site } from '../../types';
import { HumanIdChip } from '../ui/HumanIdChip';
import { LabelValue } from './LabelValue';
import { calculateSiteArea, formatArea } from './utils';

interface BasicInfoSectionProps {
    site: Site;
    isEditing: boolean;
    name: string;
    setName: (val: string) => void;
    postcode: string;
    setPostcode: (val: string) => void;
    address: string;
    setAddress: (val: string) => void;
    contactEmail: string;
    setContactEmail: (val: string) => void;
    contactPhone: string;
    setContactPhone: (val: string) => void;
}

export function BasicInfoSection({
    site,
    isEditing,
    name,
    setName,
    postcode,
    setPostcode,
    address,
    setAddress,
    contactEmail,
    setContactEmail,
    contactPhone,
    setContactPhone,
}: BasicInfoSectionProps) {
    return (
        <div className="grid grid-cols-2 gap-x-8 gap-y-2">
            <LabelValue
                isEditing={isEditing}
                label="Site Name"
                value={site.name}
                editingNode={
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                    />
                }
            />
            <LabelValue
                isEditing={isEditing}
                label="Site ID"
                value={<HumanIdChip id={site.vtId || site.id} prefix="vt-site" copyable />}
            />
            <LabelValue
                isEditing={isEditing}
                label="Site Category"
                value={
                    <span className="capitalize">
                        {(site.siteCategory || '—').replace(/_/g, ' ')}
                    </span>
                }
            />
            <LabelValue
                label="Calculated Area"
                value={formatArea(calculateSiteArea(site.geometry))}
            />
            <LabelValue
                isEditing={isEditing}
                label="Postcode"
                value={site.postcode}
                editingNode={
                    <input
                        type="text"
                        value={postcode}
                        onChange={e => setPostcode(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                    />
                }
            />
            <div className="col-span-2">
                <LabelValue
                    isEditing={isEditing}
                    label="Address"
                    value={site.address}
                    editingNode={
                        <input
                            type="text"
                            value={address}
                            onChange={e => setAddress(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                        />
                    }
                />
            </div>
            <div className="mt-6 pt-6 border-t border-slate-100 col-span-2 grid grid-cols-2 gap-x-8">
                <LabelValue
                    isEditing={isEditing}
                    label="Contact Email"
                    value={site.contactEmail}
                    editingNode={
                        <input
                            type="email"
                            value={contactEmail}
                            onChange={e => setContactEmail(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                        />
                    }
                />
                <LabelValue
                    isEditing={isEditing}
                    label="Contact Phone"
                    value={site.contactPhone}
                    editingNode={
                        <input
                            type="tel"
                            value={contactPhone}
                            onChange={e => setContactPhone(e.target.value.replace(/[^0-9]/g, ''))}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                        />
                    }
                />
            </div>
        </div>
    );
}
