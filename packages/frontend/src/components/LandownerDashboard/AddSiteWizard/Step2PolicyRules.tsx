import {
  FileText,
  Info,
  Upload,
  X,
  CheckCircle,
  ShieldCheck,
} from "lucide-react";
import { getMinimumAllowedDate } from "../../../utils/dateValidation";
import { DateTimePicker } from "../../DateTimePicker";

interface Step2PolicyRulesProps {
  validityStart: string;
  setValidityStart: (value: string) => void;
  validityStartTime: string;
  setValidityStartTime: (value: string) => void;
  validityEnd: string;
  setValidityEnd: (value: string) => void;
  validityEndTime: string;
  setValidityEndTime: (value: string) => void;
  untilFurtherNotice: boolean;
  setUntilFurtherNotice: (value: boolean) => void;
  policyDocuments: string[];
  setPolicyDocuments: (value: string[]) => void;
  autoApprove: boolean;
  setAutoApprove: (value: boolean) => void;
  emergencyRecoveryEnabled: boolean;
  setEmergencyRecoveryEnabled: (value: boolean) => void;
  siteType: "toal" | "emergency";
  handleFileUpload: (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "policy" | "authority",
  ) => void;
}

export function Step2PolicyRules({
  validityStart,
  setValidityStart,
  validityStartTime,
  setValidityStartTime,
  validityEnd,
  setValidityEnd,
  validityEndTime,
  setValidityEndTime,
  untilFurtherNotice,
  setUntilFurtherNotice,
  policyDocuments,
  setPolicyDocuments,
  autoApprove,
  setAutoApprove,
  emergencyRecoveryEnabled,
  setEmergencyRecoveryEnabled,
  siteType,
  handleFileUpload,
}: Step2PolicyRulesProps) {
  return (
    <div className="space-y-10">
      <div className="flex items-center gap-3">
        <div className="size-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
          <FileText className="size-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Policy & Rules</h2>
          <p className="text-sm text-slate-500">
            Define access window and operational requirements.
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Validity Period */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              Availability window
            </label>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
            <Info className="size-5 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-900 leading-relaxed">
              Activation must be scheduled at least 5 working days from today
              (earliest:{" "}
              {new Date(
                getMinimumAllowedDate() + "T00:00:00",
              ).toLocaleDateString("en-GB", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
              ). Weekends and UK bank holidays are excluded.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <DateTimePicker
              dateValue={validityStart}
              timeValue={validityStartTime}
              onDateChange={setValidityStart}
              onTimeChange={setValidityStartTime}
              label="Activation Start"
              required
              minimumDate={getMinimumAllowedDate()}
            />
            {!untilFurtherNotice && (
              <DateTimePicker
                dateValue={validityEnd}
                timeValue={validityEndTime}
                onDateChange={setValidityEnd}
                onTimeChange={setValidityEndTime}
                label="Activation End"
                required
                minimumDate={getMinimumAllowedDate()}
              />
            )}
          </div>

          <label className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-blue-600/30 transition-all group">
            <input
              type="checkbox"
              checked={untilFurtherNotice}
              onChange={(e) => setUntilFurtherNotice(e.target.checked)}
              className="size-5 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
            />
            <div>
              <p className="text-sm font-bold text-slate-700">
                Permanent Activation
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Available until further notice - no fixed end date.
              </p>
            </div>
          </label>
        </div>

        {/* New Section: Policy Documents */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <div className="size-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
              <FileText className="size-4" />
            </div>
            <p className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              Policy & Operational Documents
            </p>
          </div>

          <div className="p-5 bg-blue-50 border border-blue-100 rounded-2xl">
            <p className="text-sm text-blue-900 leading-relaxed">
              Attach your property rules, policy documents, operational ID, or
              insurance liability certificates. This information helps operators
              understand your requirements.
            </p>
          </div>

          <label className="flex flex-col items-center justify-center w-full p-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 hover:bg-blue-50/50 hover:border-blue-600/40 transition-all group cursor-pointer">
            <div className="size-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Upload className="size-6 text-blue-600" />
            </div>
            <p className="text-sm font-bold text-slate-900 mb-1">
              Upload Policy Documents
            </p>
            <p className="text-xs text-slate-500">Rules, Insurance, ID, etc.</p>
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => handleFileUpload(e, "policy")}
              className="hidden"
            />
          </label>

          {policyDocuments.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {policyDocuments.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="size-4 text-slate-400" />
                    <span className="text-xs font-medium text-slate-700 truncate">
                      {doc}
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      setPolicyDocuments(
                        policyDocuments.filter((_, i) => i !== idx),
                      )
                    }
                    className="p-1 hover:bg-slate-100 rounded text-slate-400"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Booking Policy Selection Cards */}
        <div className="space-y-4">
          <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">
            Booking Approval Model
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setAutoApprove(true)}
              className={`flex flex-col text-left p-6 rounded-2xl border-2 transition-all ${
                autoApprove
                  ? "border-blue-600 bg-blue-50 ring-4 ring-blue-500/10"
                  : "border-slate-100 bg-slate-50/50 hover:border-slate-200"
              }`}
            >
              <div
                className={`size-10 rounded-full flex items-center justify-center mb-4 ${autoApprove ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-400"}`}
              >
                <CheckCircle className="size-5" />
              </div>
              <p
                className={`font-bold ${autoApprove ? "text-blue-600" : "text-slate-900"}`}
              >
                Auto Approval
              </p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Bookings are approved instantly without landowner intervention.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setAutoApprove(false)}
              className={`flex flex-col text-left p-6 rounded-2xl border-2 transition-all ${
                !autoApprove
                  ? "border-blue-600 bg-blue-50 ring-4 ring-blue-500/10"
                  : "border-slate-100 bg-slate-50/50 hover:border-slate-200"
              }`}
            >
              <div
                className={`size-10 rounded-full flex items-center justify-center mb-4 ${!autoApprove ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-400"}`}
              >
                <ShieldCheck className="size-5" />
              </div>
              <p
                className={`font-bold ${!autoApprove ? "text-blue-600" : "text-slate-900"}`}
              >
                Manual Approval
              </p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                You review and approve each individual operation request.
              </p>
            </button>
          </div>
        </div>

        {/* Emergency/Recovery Feature Card */}
        {siteType !== "emergency" && (
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <div className="size-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                <Info className="size-4" />
              </div>
              <p className="text-sm font-bold text-slate-700">
                Contingency Support
              </p>
            </div>

            <div className="p-5 bg-blue-50 border border-blue-100 rounded-2xl">
              <p className="text-sm text-blue-900 leading-relaxed">
                Enabling emergency support makes your site accomodate both TOAL
                and emergency recovery landings.
              </p>
            </div>

            <label
              className={`flex items-start gap-4 p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                emergencyRecoveryEnabled
                  ? "border-blue-600 bg-blue-50 shadow-lg shadow-blue-500/5"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <input
                type="checkbox"
                checked={emergencyRecoveryEnabled}
                onChange={(e) => setEmergencyRecoveryEnabled(e.target.checked)}
                className="mt-1 size-5 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
              />
              <div>
                <p className="font-bold text-slate-900">
                  Allow emergency recovery landings
                </p>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                  Emergency use only. No prior approval required. Operators only
                  use this for safety-critical contingency situations.
                </p>
              </div>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
