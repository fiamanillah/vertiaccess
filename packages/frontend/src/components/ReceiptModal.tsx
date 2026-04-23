import { X, FileText } from 'lucide-react';
import type { BookingRequest } from '../types';
import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';

interface ReceiptModalProps {
  booking: BookingRequest;
  onClose: () => void;
}

export function ReceiptModal({ booking, onClose }: ReceiptModalProps) {
  const toalCost = booking.toalCost || 50.00;
  const platformFee = booking.platformFee || 0.00;
  const total = toalCost + platformFee;

  const receiptRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: `VertiAccess_Receipt_${booking.operationReference || booking.id.slice(0, 8)}`,
    pageStyle: `
      @page { size: auto; margin: 10mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `,
  });

  return (
    <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="size-11 bg-[#EAF2FF] rounded-xl flex items-center justify-center">
              <FileText className="size-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Payment Receipt</h2>
          </div>
          <button
            onClick={onClose}
            className="size-10 flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded-full transition-all"
          >
            <X className="size-5" />
          </button>
        </div>

        <div ref={receiptRef}>
          {/* Content */}
          <div className="p-8 space-y-8">
          {/* Receipt Header Info */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500 font-medium">Site Name:</span>
              <span className="text-sm font-bold text-slate-600">{booking.siteName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500 font-medium">Operation Ref:</span>
              <span className="text-sm font-mono font-bold text-slate-400 uppercase">{booking.operationReference}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500 font-medium">Booking Date:</span>
              <span className="text-sm font-bold text-slate-600">{new Date(booking.createdAt).toLocaleDateString('en-GB')}</span>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <h3 className="text-lg font-black text-slate-800 mb-5 tracking-tight">Cost Breakdown</h3>
            
            {/* Line Items */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500 font-medium">TOAL Site Access</span>
                <span className="text-sm font-bold text-slate-600">£{toalCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500 font-medium">Compliance & Certification Fee (VertiAccess)</span>
                <span className="text-sm font-bold text-slate-500">£{platformFee.toFixed(2)}</span>
              </div>
            </div>

            {/* Total */}
            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-base font-bold text-slate-800">Total Paid</span>
                <span className="text-lg font-black text-slate-800">£{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Status */}
          <div className="bg-slate-50 border border-slate-100 rounded-[18px] p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 font-medium">Payment Status:</span>
              <span className={`inline-flex px-3 py-1 text-xs font-black uppercase tracking-wider rounded-lg ${
                booking.paymentStatus === 'charged' ? 'bg-[#DCFCE7] text-[#15803D]' :
                booking.paymentStatus === 'pending' ? 'bg-amber-100 text-amber-700' :
                'bg-slate-200 text-slate-700'
              }`}>
                {booking.paymentStatus === 'charged' ? 'Paid' : booking.paymentStatus === 'pending' ? 'Pending' : booking.paymentStatus || 'Unknown'}
              </span>
            </div>
          </div>

          {/* Time Window */}
          <div className="pt-6 border-t border-slate-100">
            <h3 className="text-lg font-black text-slate-800 mb-4 tracking-tight">Booking Period</h3>
            <div className="space-y-2">
              <p className="text-sm text-slate-500 font-medium">
                From: <span className="text-slate-800 font-bold">{new Date(booking.startTime).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              </p>
              <p className="text-sm text-slate-500 font-medium">
                To: <span className="text-slate-800 font-bold">{new Date(booking.endTime).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              </p>
            </div>
          </div>
        </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 h-12 border border-slate-200 text-slate-800 rounded-xl font-bold hover:bg-white transition-all text-sm"
          >
            Close
          </button>
          <button
            onClick={() => handleDownloadPDF()}
            className="flex-1 h-12 bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700 transition-all text-sm shadow-lg shadow-blue-500/10"
          >
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}
