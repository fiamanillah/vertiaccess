import React from "react";
import { CheckCircle, FileText, Shield, ShieldCheck } from "lucide-react";
import { SiteMap } from "../../SiteMap";
import type { GeometryType } from "../../../types";

interface Step6ReviewSubmitProps {
  name: string;
  siteType: "toal" | "emergency";
  siteCategory: string;
  address: string;
  autoApprove: boolean;
  isClzEnabled: boolean;
  siteInformation: string;
  sitePhotos: string[];
  policyDocuments: string[];
  authorityDocuments: string[];
  accessFee: string;
  clzAccessFee: string;
  geometryType: GeometryType;
  center: { lat: number; lng: number };
  radius: number;
  polygonPoints: [number, number][];
  clzCenter: { lat: number; lng: number };
  clzPolygonPoints: [number, number][];
  clzRadius: number;
  acceptedTerms: boolean;
  setAcceptedTerms: (value: boolean) => void;
  setCurrentStep: React.Dispatch<React.SetStateAction<1 | 2 | 3 | 4 | 5 | 6>>;
}

export function Step6ReviewSubmit({
  name,
  siteType,
  siteCategory,
  address,
  autoApprove,
  isClzEnabled,
  siteInformation,
  sitePhotos,
  policyDocuments,
  authorityDocuments,
  accessFee,
  clzAccessFee,
  geometryType,
  center,
  radius,
  polygonPoints,
  clzCenter,
  clzPolygonPoints,
  clzRadius,
  acceptedTerms,
  setAcceptedTerms,
  setCurrentStep,
}: Step6ReviewSubmitProps) {
  return (
    <div className="space-y-10">
      <div className="flex items-center gap-3">
        <div className="size-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
          <CheckCircle className="size-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Review & Submit</h2>
          <p className="text-sm text-slate-500">
            Verify all information before final network submission.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Left: Summary */}
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                Site Identity
              </h3>
              <button
                onClick={() => setCurrentStep(1)}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                Edit
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-sm text-slate-500">Site Name</span>
                <span className="text-sm font-bold text-slate-900">{name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-sm text-slate-500">Primary Type</span>
                <span className="text-sm font-bold text-slate-900 uppercase">
                  {siteType}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-sm text-slate-500">Category</span>
                <span className="text-sm font-bold text-slate-900 capitalize">
                  {siteCategory.replace("_", " ")}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-sm text-slate-500">Location</span>
                <span className="text-sm font-bold text-slate-900 text-right max-w-[200px] truncate">
                  {address}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                Operational Policy
              </h3>
              <button
                onClick={() => setCurrentStep(2)}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                Edit
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-sm text-slate-500">Approval Model</span>
                <span className="text-sm font-bold text-slate-900">
                  {autoApprove ? "Auto" : "Manual"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-sm text-slate-500">
                  Emergency and Recovery Site Enabled
                </span>
                <span
                  className={`text-sm font-bold ${isClzEnabled ? "text-emerald-600" : "text-slate-400"}`}
                >
                  {isClzEnabled ? "YES" : "NO"}
                </span>
              </div>
            </div>
          </div>

          {/* Property Description */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                Property Description
              </h3>
              <button
                onClick={() => setCurrentStep(3)}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                Edit
              </button>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-sm text-slate-600 leading-relaxed italic">
                {siteInformation || "No description provided."}
              </p>
            </div>
          </div>

          {/* Site Photos */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                Site Photos
              </h3>
              <button
                onClick={() => setCurrentStep(3)}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                Edit
              </button>
            </div>
            {sitePhotos.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {sitePhotos.map((photo, idx) => (
                  <div
                    key={idx}
                    className="aspect-square rounded-lg overflow-hidden border border-slate-200 shadow-sm"
                  >
                    <img
                      src={photo}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                No photos uploaded.
              </p>
            )}
          </div>

          {/* Policy & Documents */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                Policy & Operational Documents
              </h3>
              <button
                onClick={() => setCurrentStep(2)}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                Edit
              </button>
            </div>
            <div className="space-y-2">
              {policyDocuments.length > 0 ? (
                policyDocuments.map((doc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-100"
                  >
                    <FileText className="size-3.5 text-slate-400" />
                    <span className="truncate font-medium">{doc}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">
                  No policy documents provided.
                </p>
              )}
            </div>
          </div>

          {/* Ownership Evidence */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                Ownership Evidence
              </h3>
              <button
                onClick={() => setCurrentStep(5)}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                Edit
              </button>
            </div>
            <div className="space-y-2">
              {authorityDocuments.length > 0 ? (
                authorityDocuments.map((doc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-100"
                  >
                    <Shield className="size-3.5 text-slate-400" />
                    <span className="truncate font-medium">{doc}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic font-bold text-amber-600">
                  No ownership evidence provided.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex justify-between items-center bg-slate-50/80 p-6 rounded-2xl border border-slate-100">
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Site Access Fee
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    £{Number(accessFee || 0).toFixed(2)}
                  </p>
                </div>
                {isClzEnabled && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      Emergency Fee
                    </p>
                    <p className="text-lg font-bold text-slate-700">
                      £{Number(clzAccessFee || 0).toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  You Receive
                </p>
                <div className="flex flex-col items-end">
                  <p className="text-3xl font-bold text-emerald-600">
                    £{Number(accessFee || 0).toFixed(2)}
                  </p>
                  {isClzEnabled && (
                    <p className="text-[10px] text-slate-400 italic mt-1">
                      + £{Number(clzAccessFee || 0).toFixed(2)} if Emergency
                      access utilised
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Map Preview */}
        <div className="space-y-6">
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-lg h-[400px]">
            {/* Debug info */}
            <div className="absolute top-2 right-2 z-50 bg-black/80 text-white text-xs p-2 rounded">
              Debug: geometryType={geometryType}, center=
              {JSON.stringify(center)}, radius={radius}
            </div>
            <SiteMap
              geometryType={geometryType}
              center={center}
              radius={radius}
              polygonPoints={polygonPoints.map(([lat, lng]) => ({ lat, lng }))}
              onCenterChange={() => {}}
              onPolygonPointsChange={() => {}}
              clzEnabled={isClzEnabled}
              clzCenter={clzCenter}
              clzPolygonPoints={clzPolygonPoints.map(([lat, lng]) => ({
                lat,
                lng,
              }))}
              onClzPolygonPointsChange={() => {}}
              clzRadius={clzRadius}
              clzOnly={false}
              readonly
            />
            <div className="absolute top-4 left-4 z-10">
              <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Final Boundary Preview
              </div>
            </div>
          </div>

          <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100/50">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="size-4 text-blue-600" />
              <h4 className="text-sm font-bold text-slate-900">
                Landowner Declaration
              </h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              I confirm that I am responsible for maintaining the safety and
              physical integrity of this TOAL and associated emergency regions.
              I agree to keep the site free from hazards and update status
              promptly.
            </p>
            <label className="flex items-center gap-3 p-4 bg-white border border-blue-600/20 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="size-5 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
              />
              <span className="text-xs font-bold text-slate-700">
                I accept the final declaration and terms *
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
