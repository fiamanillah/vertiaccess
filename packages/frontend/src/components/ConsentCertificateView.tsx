import type { ConsentCertificate } from '../types';
import { 
  X, CheckCircle, MapPin, User, Calendar, Shield, Globe, 
  Copy, ShieldCheck, AlertCircle, Printer, CheckSquare, Square
} from 'lucide-react';
import { CertificateMapSnapshot } from './CertificateMapSnapshot';
import { VertiAccessLogo } from './VertiAccessLogo';
import { motion } from 'motion/react';

import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';

interface ConsentCertificateViewProps {
  certificate: ConsentCertificate;
  onClose: () => void;
}

export function ConsentCertificateView({ certificate, onClose }: ConsentCertificateViewProps) {
  // Prefer backend-assigned certId (VA-CERT-XXXXX) over UUID fallback
  const formattedCertId = certificate.certId
    ? certificate.certId
    : certificate.id.startsWith('VA-CERT-') 
      ? certificate.id 
      : `VA-CERT-${certificate.id.slice(0, 5).toUpperCase()}`;
  
  // Use provided booking human ID or fallback to bookingId
  const bookingRef = (certificate as any).bookingHumanId || certificate.bookingId || `VA-BKG-${certificate.id.slice(0, 6).toUpperCase()}`;
  const siteId = `VA-${certificate.siteId.slice(0, 6).toUpperCase()}`;
  const siteStatus = certificate.siteStatusAtIssue || 'ACTIVE';
  
  // Calculate duration
  const start = new Date(certificate.startTime);
  const end = new Date(certificate.endTime);
  const durationHours = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60));

  const certificateRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = useReactToPrint({
    contentRef: certificateRef,
    documentTitle: `VertiAccess_Certificate_${formattedCertId}`,
    pageStyle: `
      @page { size: auto; margin: 10mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `,
  });

  const handleCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Verification link copied to clipboard');
    } catch (err) {
      console.error('Failed to copy text: ', err);
      // Fallback: prompt the user to copy manually if blocked
      window.prompt("Copy to clipboard: Ctrl+C, Enter", text);
    }
  };

  const formatSiteType = (type: string) => {
    const types: Record<string, string> = {
      'private_land': 'Private Land',
      'helipad': 'Helipad',
      'vertiport': 'Vertiport',
      'temporary_landing_site': 'Temporary Landing Site'
    };
    return types[type] || type;
  };



  return (
    <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[95vh] flex flex-col overflow-hidden border border-white/20"
      >
        {/* Modal Header */}
        <div className="px-8 py-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-4">
            <div className="size-10 bg-[#EAF2FF] rounded-xl flex items-center justify-center">
              <ShieldCheck className="size-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">Operational Consent Certificate</h2>
              <p className="text-xs text-slate-500">Ref: {formattedCertId}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleDownloadPDF()}
              className="h-9 px-4 bg-slate-100 text-slate-700 rounded-lg font-bold text-xs hover:bg-slate-200 transition-all flex items-center gap-2"
            >
              <Printer className="size-4" />
              Print / Save
            </button>
            <button
              onClick={onClose}
              className="size-9 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Certificate Content */}
        <div className="overflow-y-auto flex-1 bg-slate-50 p-8 custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-6 pb-12">
            
            {/* The Actual Certificate Document */}
            <div 
              ref={certificateRef}
              className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden"
            >
              <div className="p-12 space-y-12">
                
                {/* Official Header */}
                <div className="text-center space-y-8">
                  <div className="flex justify-center">
                    <VertiAccessLogo className="h-10" />
                  </div>
                  <div className="space-y-2">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Digital Land Access Consent</h1>
                    <p className="text-xs text-slate-500 font-bold tracking-widest uppercase">Issued by the VertiAccess Trusted Platform</p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-12 pt-4 max-w-3xl mx-auto">
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Date of Issue</p>
                      <p className="text-base font-bold text-slate-900">{new Date(certificate.issueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Certificate ID</p>
                      <p className="text-xl font-mono font-black text-blue-600 tracking-tight uppercase">{formattedCertId}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Status at Issue</p>
                      <div className="flex items-center gap-2 justify-center">
                        <div className="size-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                        <p className="text-base font-bold text-green-600 uppercase tracking-tight">{siteStatus}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-slate-100" />

                {/* Legal Consent Statement */}
                <div className="bg-[#F0F7FF] border border-[#D6E4FF] rounded-2xl p-8 text-center">
                  <p className="text-base font-medium text-slate-700 leading-relaxed italic">
                    "This document constitutes a time-limited digital consent granted by the named landowner for drone Take-Off and Landing (TOAL) and/or emergency and recovery site operations within the defined geospatial boundary and access window."
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-x-20 gap-y-12">
                  {/* Access Authority */}
                  <section className="space-y-6">
                    <h3 className="text-xs font-bold text-blue-600 uppercase tracking-[0.15em] flex items-center gap-2">
                      <Shield className="size-4" />
                      Access Authority
                    </h3>
                    <div className="space-y-5">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1.5">Landowner / Agent</p>
                        <p className="text-lg font-bold text-slate-900">{certificate.landownerName}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1.5">Contact Verification</p>
                        <p className="text-sm text-slate-600 font-medium">{certificate.landownerEmail}</p>
                        <p className="text-sm text-slate-600 font-medium">{certificate.landownerPhone}</p>
                      </div>
                      <div className="flex items-center gap-2.5 px-4 py-3 bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl">
                        <div className="size-5 bg-white rounded-full flex items-center justify-center border border-[#DCFCE7]">
                          <CheckCircle className="size-3.5 text-green-600" />
                        </div>
                        <span className="text-xs font-bold text-green-800">Authority to grant access confirmed</span>
                      </div>
                    </div>
                  </section>

                  {/* Operator ID */}
                  <section className="space-y-6">
                    <h3 className="text-xs font-bold text-blue-600 uppercase tracking-[0.15em] flex items-center gap-2">
                      <User className="size-4" />
                      Operator ID
                    </h3>
                    <div className="space-y-5">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1.5">Operator Organisation</p>
                        <p className="text-lg font-bold text-slate-900">{certificate.operatorOrganisation || 'Independent Operator'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1.5">Flyer ID / UAS Reg</p>
                        <p className="text-base font-mono font-bold text-slate-900 uppercase">{certificate.flyerId || 'GBR-RPAS-PENDING'}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1.5">Operation Reference</p>
                          <p className="text-sm font-mono font-bold text-blue-600">{certificate.operationReference}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1.5">Booking ID</p>
                          <p className="text-sm font-mono font-bold text-slate-900">{bookingRef}</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Site Information */}
                  <section className="space-y-6">
                    <h3 className="text-xs font-bold text-blue-600 uppercase tracking-[0.15em] flex items-center gap-2">
                      <MapPin className="size-4" />
                      Site Information
                    </h3>
                    <div className="space-y-6">
                      <div className="border-b border-slate-100 pb-6">
                        <div className="flex justify-between items-start gap-8 mb-4">
                          <div className="flex-1">
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-2">Location Reference</p>
                            <p className="text-lg font-bold text-slate-900 leading-tight">{certificate.siteName}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-2">Site ID</p>
                            <p className="text-sm font-mono font-bold text-slate-900 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                              VA-SITE-{certificate.siteId.slice(-4).toUpperCase()}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-slate-500 leading-relaxed">{certificate.siteAddress}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1.5">Infrastructure Type</p>
                          <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">{formatSiteType(certificate.siteType)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1.5">Geospatial Center</p>
                          <p className="text-sm font-mono font-bold text-slate-900">{certificate.siteCoordinates}</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Access Window */}
                  <section className="space-y-6">
                    <h3 className="text-xs font-bold text-blue-600 uppercase tracking-[0.15em] flex items-center gap-2">
                      <Calendar className="size-4" />
                      Access Window (UTC)
                    </h3>
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden">
                      <div className="divide-y divide-slate-200">
                        <div className="px-6 py-4 flex justify-between items-center">
                          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Start</span>
                          <span className="text-sm font-bold text-slate-900">{new Date(certificate.startTime).toLocaleString('en-GB')}</span>
                        </div>
                        <div className="px-6 py-4 flex justify-between items-center">
                          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">End</span>
                          <span className="text-sm font-bold text-slate-900">{new Date(certificate.endTime).toLocaleString('en-GB')}</span>
                        </div>
                        <div className="px-6 py-4 flex justify-between items-center bg-white">
                          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Total Duration</span>
                          <span className="text-sm font-bold text-blue-600">{durationHours} Hours</span>
                        </div>
                      </div>
                      <div className="px-6 py-5 border-t border-slate-200">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-4">Access Type Granted</p>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="size-5 flex items-center justify-center">
                              {certificate.useCategory === 'planned_toal' ? (
                                <CheckSquare className="size-5 text-blue-600" />
                              ) : (
                                <Square className="size-5 text-slate-200" />
                              )}
                            </div>
                            <span className={`text-sm font-bold ${certificate.useCategory === 'planned_toal' ? 'text-slate-900' : 'text-slate-400'}`}>Planned TOAL</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="size-5 flex items-center justify-center">
                              {certificate.useCategory === 'emergency_recovery' ? (
                                <CheckSquare className="size-5 text-blue-600" />
                              ) : (
                                <Square className="size-5 text-slate-200" />
                              )}
                            </div>
                            <span className={`text-sm font-bold ${certificate.useCategory === 'emergency_recovery' ? 'text-slate-900' : 'text-slate-400'}`}>Emergency Recovery Site</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                <div className="h-px bg-slate-100" />

                {/* Map Section */}
                <div className="space-y-6">
                  <h3 className="text-xs font-bold text-blue-600 uppercase tracking-[0.15em] flex items-center gap-2">
                    <Globe className="size-4" />
                    Geospatial Verification Zone
                  </h3>
                  <div className="rounded-3xl overflow-hidden border border-slate-200 h-[340px] relative">
                    {certificate.siteGeometry ? (
                      <CertificateMapSnapshot
                        toalGeometry={certificate.siteGeometry}
                        clzGeometry={certificate.clzGeometry}
                        siteName={certificate.siteName}
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">Map Unavailable</div>
                    )}
                    <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
                      <div className="size-2 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Live Site Boundary</span>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-slate-100" />

                {/* Cryptographic Proof */}
                <div className="space-y-8">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="size-5 text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Cryptographic Proof of Authenticity</h3>
                  </div>
                  
                  <div className="grid gap-6">
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Digital Signature</p>
                      <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 font-mono text-xs text-slate-600 break-all leading-relaxed shadow-inner">
                        SIGNATURE_BLOCK: {certificate.digitalSignature || 'sig_crypto_generation_pending'}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">SHA256 Certificate Hash</p>
                      <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 font-mono text-xs text-slate-600 break-all leading-relaxed shadow-inner">
                        {certificate.verificationHash || 'hash_pending'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-[#F0F7FF] px-6 py-4 rounded-xl border border-[#D6E4FF]">
                    <p className="text-sm text-blue-600 font-medium truncate pr-8 italic">
                      Verification Link: {certificate.verificationUrl || 'https://vertiaccess.com/verify'}
                    </p>
                    <button 
                      onClick={() => handleCopyToClipboard(certificate.verificationUrl)}
                      className="flex items-center gap-2 text-blue-600 font-bold text-sm hover:underline shrink-0 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-[#D6E4FF]"
                    >
                      <Copy className="size-3.5" />
                      Copy Link
                    </button>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-100">
                  <p className="text-xs text-slate-400 leading-relaxed text-center max-w-2xl mx-auto italic">
                    <span className="font-bold text-slate-600 not-italic">Revocation Clause:</span> This consent may be revoked by the landowner or VertiAccess if safety, regulatory, or security conditions change prior to the access window. The operator remains fully responsible for compliance with CAA regulations, insurance validity, and operational safety.
                  </p>
                </div>
              </div>
            </div>

            {/* Legal Advisory */}
            <div className="bg-white rounded-3xl border border-slate-200 p-10">
              <div className="flex gap-6">
                <div className="size-10 bg-slate-50 rounded-full flex items-center justify-center shrink-0 border border-slate-200">
                  <AlertCircle className="size-5 text-slate-400" />
                </div>
                <div className="space-y-8 flex-1">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest pt-2">Operational Compliance Notice</h3>
                  <div className="grid md:grid-cols-2 gap-x-16 gap-y-8 text-sm text-slate-500 leading-relaxed">
                    <div className="space-y-4">
                      <p className="font-bold text-slate-700">This certificate confirms land access consent only. It does not replace:</p>
                      <ul className="space-y-3">
                        <li className="flex items-center gap-3">
                          <div className="size-1.5 bg-slate-300 rounded-full" />
                          <span>CAA airspace authorisation</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <div className="size-1.5 bg-slate-300 rounded-full" />
                          <span>ATC clearance</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <div className="size-1.5 bg-slate-300 rounded-full" />
                          <span>NOTAM/DROTAM requirements</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <div className="size-1.5 bg-slate-300 rounded-full" />
                          <span>Any SORA or OSC conditions</span>
                        </li>
                      </ul>
                    </div>
                    <div className="pt-1">
                      <p>Landowner consent is time-limited. Operations outside the specified access window are strictly unauthorised and may invalidate operational insurance. Ensure all relevant site policies are adhered to at all times.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
