import { motion } from "motion/react";
import {
  Plane,
  Landmark,
  Shield,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

interface RoleSelectionProps {
  onBack: () => void;
  onSelectRole: (role: "operator" | "landowner" | "admin") => void;
  onLogin: () => void;
}

export function RoleSelection({
  onBack,
  onSelectRole,
  onLogin,
}: RoleSelectionProps) {
  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-[1000px] w-full bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col md:flex-row min-h-[700px]"
      >
        {/* Left Side: Context */}
        <div className="md:w-[380px] bg-blue-600 p-12 md:p-14 text-white flex flex-col justify-between">
          <div>
            <div className="mb-14">
              <p className="text-xl font-bold tracking-tight text-[#f6faff]">
                VertiAccess
              </p>
            </div>
            <h2 className="text-[48px] font-bold leading-[1.1] mb-10 text-[#fbfcff]">
              Join the VertiAccess network
            </h2>
            <p className="text-white/70 text-lg leading-relaxed mb-8">
              Choose how you want to use VertiAccess
            </p>
          </div>

          <div className="pt-8">
            <p className="text-xs text-white/50 leading-relaxed">
              © 2026 VertiAccess. Professional ground access coordination for
              drone operations.
            </p>
          </div>
        </div>

        {/* Right Side: Options */}
        <div className="flex-1 p-12 md:p-16 flex flex-col">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors mb-12 self-start"
          >
            <ArrowLeft className="size-4" />
            Back to Home
          </button>

          <div className="mb-12">
            <h1 className="text-3xl font-bold mb-3 text-slate-900">
              Create your account
            </h1>
            <p className="text-base text-slate-500">
              Select how you intend to use the platform.
            </p>
          </div>

          <div className="space-y-4 flex-1">
            <button
              onClick={() => onSelectRole("operator")}
              className="w-full flex items-center gap-6 p-6 border border-slate-200 rounded-3xl hover:border-blue-600 hover:bg-slate-50 transition-all text-left group bg-white shadow-sm hover:shadow-md"
            >
              <div className="size-16 rounded-2xl bg-[#EFF6FF] flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0 shadow-sm">
                <Plane className="size-7 text-blue-600 group-hover:text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-900 text-lg mb-1">
                  Drone Operator
                </h4>
                <p className="text-sm text-slate-500 leading-snug">
                  Discover and book TOAL & Emergency and Recovery sites for
                  BVLOS missions.
                </p>
              </div>
              <ArrowRight className="size-5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </button>

            <button
              onClick={() => onSelectRole("landowner")}
              className="w-full flex items-center gap-6 p-6 border border-slate-200 rounded-3xl hover:border-[#059669] hover:bg-[#F0FDF4] transition-all text-left group bg-white shadow-sm hover:shadow-md"
            >
              <div className="size-16 rounded-2xl bg-[#F0FDF4] flex items-center justify-center group-hover:bg-[#059669] group-hover:text-white transition-all shrink-0 shadow-sm">
                <Landmark className="size-7 text-[#059669] group-hover:text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h4 className="font-bold text-slate-900 text-lg">
                    Landowner
                  </h4>
                  <span className="text-[10px] font-bold bg-[#DCFCE7] text-[#166534] px-2 py-0.5 rounded uppercase tracking-wider">
                    Free
                  </span>
                </div>
                <p className="text-sm text-slate-500 leading-snug">
                  Monetize your land and control site access permissions.
                </p>
              </div>
              <ArrowRight className="size-5 text-slate-300 group-hover:text-[#059669] group-hover:translate-x-1 transition-all" />
            </button>

            {/* Internal Access Section */}
            <div className="relative py-8">
              <div
                className="absolute inset-0 flex items-center"
                aria-hidden="true"
              >
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <span className="bg-white px-6">Internal Access Only</span>
              </div>
            </div>

            <button
              onClick={() => onSelectRole("admin")}
              className="w-full flex items-center gap-6 p-6 border border-slate-200 border-dashed rounded-3xl hover:border-slate-800 hover:bg-slate-50 transition-all text-left group bg-white shadow-sm"
            >
              <div className="size-16 rounded-2xl bg-slate-100 flex items-center justify-center group-hover:bg-slate-800 group-hover:text-white transition-all shrink-0 shadow-sm">
                <Shield className="size-7 text-slate-500 group-hover:text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-900 text-lg mb-1">
                  Authority / Admin
                </h4>
                <p className="text-sm text-slate-500 leading-snug">
                  National oversight and regulatory governance portal.
                </p>
              </div>
              <ArrowRight className="size-5 text-slate-300 group-hover:text-slate-800 group-hover:translate-x-1 transition-all" />
            </button>
          </div>

          <div className="mt-12 pt-10 border-t border-slate-200 text-center">
            <button
              onClick={onLogin}
              className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-all"
            >
              Already have an account?{" "}
              <span className="text-blue-600 font-black ml-1 hover:underline">
                Log in
              </span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
