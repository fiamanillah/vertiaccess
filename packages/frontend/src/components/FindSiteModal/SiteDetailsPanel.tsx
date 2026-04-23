import type { Site } from "../../types";
import { MapPin, AlertTriangle, Globe, Download } from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { ReadOnlySiteMap } from "../ReadOnlySiteMap";

interface SiteDetailsPanelProps {
  site: Site;
  activeWorkflow?: "toal" | "clz" | null;
  paymentCompleted?: boolean;
  onDownloadTOAL?: () => void;
  onDownloadEmergency?: () => void;
}

export function SiteDetailsPanel({
  site,
  activeWorkflow,
  paymentCompleted,
  onDownloadTOAL,
  onDownloadEmergency,
}: SiteDetailsPanelProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="size-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
          <MapPin className="size-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-3xl font-black text-slate-800 leading-none tracking-tight">
            {site.name}
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-2">
            {site.address}
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-8">
        <div>
          <h3 className="text-xs font-bold text-blue-600 uppercase tracking-[0.15em] mb-6">
            Site Details
          </h3>
          <div className="grid grid-cols-2 gap-y-8">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                Geometry
              </p>
              <p className="text-base font-bold text-slate-800 capitalize">
                {site.geometry?.type || "Circle"}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                Size
              </p>
              <p className="text-base font-bold text-slate-800">
                {site.geometry?.radius || 25}m radius
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                Auto-Approve
              </p>
              <p className="text-base font-bold text-slate-800">
                {site.autoApprove ? "Yes" : "No"}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                Exclusive Use
              </p>
              <p className="text-base font-bold text-slate-800">
                {site.exclusiveUse ? "Yes" : "No"}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                Emergency & Recovery Enabled
              </p>
              <p className="text-base font-bold text-slate-800">
                {site.clzEnabled ? "Yes" : "No"}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                Validity
              </p>
              <p className="text-base font-bold text-slate-800">UFN</p>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-50 space-y-3">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Information & Hazards
          </p>
          <p className="text-sm text-slate-600 leading-relaxed font-medium italic">
            {site.siteInformation ||
              "Premium rooftop helipad overlooking the Thames. Accessible via elevator A. Short grass/turf landing surface with reinforced base."}
          </p>
        </div>

        <div className="pt-8 border-t border-slate-50 space-y-4">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Site Photos
          </p>
          <div className="flex flex-wrap gap-2">
            {site.sitePhotos && site.sitePhotos.length > 0 ? (
              site.sitePhotos.map((photo, i) => (
                <div
                  key={i}
                  className="size-20 bg-slate-100 rounded-xl overflow-hidden border border-slate-200"
                >
                  <ImageWithFallback
                    src={photo}
                    alt={`Site view ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))
            ) : (
              <div className="size-20 bg-slate-100 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400 text-center px-2">
                Site view 1
              </div>
            )}
          </div>
        </div>

        {site.exclusiveUse && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3">
            <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed font-medium">
              <span className="font-bold">Exclusive Use TOAL:</span> Only one
              operator can book this site at a time. Check the availability
              calendar carefully.
            </p>
          </div>
        )}
      </div>

      {/* {paymentCompleted && ( */}
      <div className="bg-green-50 border border-green-100 rounded-3xl p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-xs font-bold text-green-700 uppercase tracking-[0.15em] mb-6">
            Download Geometry Data
          </h3>
          <p className="text-sm text-green-600 font-medium mb-6">
            Your payment has been processed. You can now download GeoJSON files
            for your operational area.
          </p>
          <div className="flex flex-wrap gap-3">
            {(activeWorkflow === "toal" || !activeWorkflow) && (
              <button
                onClick={onDownloadTOAL}
                className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:underline uppercase tracking-widest bg-white px-4 py-2 rounded-lg border border-slate-100 shadow-sm hover:shadow-md transition-all"
              >
                <Download className="size-4" />
                TOAL GeoJSON
              </button>
            )}
            {site.clzEnabled &&
              (activeWorkflow === "clz" || !activeWorkflow) && (
                <button
                  onClick={onDownloadEmergency}
                  className="flex items-center gap-2 text-xs font-bold text-emerald-600 hover:underline uppercase tracking-widest bg-white px-4 py-2 rounded-lg border border-emerald-200 shadow-sm hover:shadow-md transition-all"
                >
                  <Download className="size-4" />
                  Emergency & Recovery GeoJSON
                </button>
              )}
          </div>
        </div>
      </div>
      {/* )} */}

      <div className="rounded-3xl overflow-hidden border border-slate-100 h-64 shadow-sm relative group">
        <ReadOnlySiteMap
          geometry={site.geometry}
          clzGeometry={site.clzGeometry}
          highlightMode={
            activeWorkflow === "toal"
              ? "toal"
              : activeWorkflow === "clz"
                ? "clz"
                : "both"
          }
        />
        <div className="absolute top-4 left-4">
          <button className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-lg border border-slate-100 flex items-center gap-2 text-xs font-bold text-slate-800 shadow-lg">
            <Globe className="size-4 text-blue-600" />
            Satellite
          </button>
        </div>
        <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg border border-slate-100 text-[9px] font-bold text-slate-400 uppercase tracking-widest shadow-lg">
          Map Legend
        </div>
      </div>
    </div>
  );
}
