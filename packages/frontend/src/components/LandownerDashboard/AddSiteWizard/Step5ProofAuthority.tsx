import { Shield, Upload, FileText, X, Image as ImageIcon } from 'lucide-react';

interface Step5ProofAuthorityProps {
  authorityDocuments: string[];
  setAuthorityDocuments: (value: string[]) => void;
  authorised: boolean;
  setAuthorised: (value: boolean) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, type: 'policy' | 'authority') => void;
}

export function Step5ProofAuthority({
  authorityDocuments,
  setAuthorityDocuments,
  authorised,
  setAuthorised,
  handleFileUpload,
}: Step5ProofAuthorityProps) {
  return (
    <div className="space-y-10">
      <div className="flex items-center gap-3">
        <div className="size-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
          <Shield className="size-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Proof of Authority</h2>
          <p className="text-sm text-slate-500">Verify your legal authority to manage operations on this site.</p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Drag & Drop Upload Card */}
        <div className="space-y-4">
          <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Ownership Evidence</label>
          <label className="flex flex-col items-center justify-center w-full p-12 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 hover:bg-blue-50/50 hover:border-blue-600/40 transition-all group cursor-pointer">
            <div className="size-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Upload className="size-8 text-blue-600" />
            </div>
            <p className="text-lg font-bold text-slate-900 mb-1">Upload Ownership Document</p>
            <p className="text-sm text-slate-500 mb-6">Drag & drop or click to browse files</p>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-400">
                <FileText className="size-3" /> PDF
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-400">
                <ImageIcon className="size-3" /> JPG / PNG
              </div>
            </div>
            <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileUpload(e, 'authority')} className="hidden" />
          </label>

          {authorityDocuments.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {authorityDocuments.map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="size-5 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700 truncate">{doc}</span>
                  </div>
                  <button onClick={() => setAuthorityDocuments(authorityDocuments.filter((_, i) => i !== idx))} className="p-1 hover:bg-slate-100 rounded text-slate-400">
                    <X className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Styled Declaration Card */}
        <label className={`flex items-start gap-4 p-6 rounded-2xl border-2 transition-all cursor-pointer ${
          authorised 
            ? 'border-blue-600 bg-blue-50 shadow-lg shadow-blue-500/5' 
            : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'
        }`}>
          <input
            type="checkbox"
            checked={authorised}
            onChange={(e) => setAuthorised(e.target.checked)}
            className="mt-1 size-6 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-600"
          />
          <div>
            <p className="text-base font-bold text-slate-900">I confirm I have legal authority to grant access</p>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">
              I declare that I hold the necessary legal rights, as owner or authorised representative, to permit drone operations at this location.
            </p>
          </div>
        </label>
      </div>
    </div>
  );
}
