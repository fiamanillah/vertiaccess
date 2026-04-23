import { MapPin } from 'lucide-react';

interface Step1SiteDetailsProps {
  name: string;
  setName: (value: string) => void;
  siteCategory: string;
  setSiteCategory: (value: string) => void;
  siteType: 'toal' | 'emergency';
  setSiteType: (value: 'toal' | 'emergency') => void;
  address: string;
  setAddress: (value: string) => void;
  postcode: string;
  setPostcode: (value: string) => void;
  contactEmail: string;
  setContactEmail: (value: string) => void;
  contactPhone: string;
  setContactPhone: (value: string) => void;
}

export function Step1SiteDetails({
  name,
  setName,
  siteCategory,
  setSiteCategory,
  siteType,
  setSiteType,
  address,
  setAddress,
  postcode,
  setPostcode,
  contactEmail,
  setContactEmail,
  contactPhone,
  setContactPhone,
}: Step1SiteDetailsProps) {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="size-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
          <MapPin className="size-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Site Information</h2>
          <p className="text-sm text-slate-500">Provide the basic identifying details for your landing infrastructure.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2 space-y-2">
          <label className="text-sm font-bold text-slate-700">Site Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none transition-all placeholder:text-slate-300"
            placeholder="e.g., North Field Landing Zone"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Category *</label>
          <select
            value={siteCategory}
            onChange={(e) => setSiteCategory(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none transition-all appearance-none bg-white"
          >
            <option value="">Select category...</option>
            <option value="private_land">Private Land / Estate</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Primary Function *</label>
            <select
              value={siteType}
              onChange={(e) => setSiteType(e.target.value as 'toal' | 'emergency')}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none transition-all appearance-none bg-white disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="toal">Take-off & Landing (TOAL)</option>
              <option value="emergency">Emergency and Recovery Site</option>
            </select>
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className="text-sm font-bold text-slate-700">Full Address *</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none transition-all placeholder:text-slate-300"
            placeholder="Physical address or precise description"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Postcode *</label>
          <input
            type="text"
            value={postcode}
            onChange={(e) => setPostcode(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none transition-all placeholder:text-slate-300 uppercase"
            placeholder="SW1A 1AA"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2 pt-4 border-t border-slate-100">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Contact Email *</label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none transition-all"
              placeholder="admin@estate.co.uk"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Contact Phone *</label>
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none transition-all"
              placeholder="+44"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
