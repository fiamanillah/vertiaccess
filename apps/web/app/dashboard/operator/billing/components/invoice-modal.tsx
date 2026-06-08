'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import { Button } from '@workspace/ui/components/button';
import { Printer, Download, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import type { Transaction } from '@/services/payments/payment.types';

interface InvoiceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: Transaction | null
}

export function InvoiceModal({ open, onOpenChange, transaction }: InvoiceModalProps) {
  if (!transaction) return null;

  const date = new Date(transaction.createdAt);
  const dateStr = format(date, 'MMM dd, yyyy');
  const symbol = transaction.currency === 'GBP' ? '£' : '$';
  const invoiceNo = `INV-${transaction.id.slice(0, 8).toUpperCase()}`;
  
  const isPayg = transaction.transactionType === 'PAYG_BOOKING';
  const itemDesc = isPayg 
    ? `Landing Access Fee — Site: ${transaction.siteName || 'Landing Site'}`
    : 'VertiAccess Pro Subscription';
  
  const subtotal = transaction.amount;
  const vat = subtotal * 0.2; // 20% inclusive VAT
  const total = subtotal;

  const handlePrintAndDownload = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print/download the invoice.');
      return;
    }
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${invoiceNo}</title>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
          <style>
            @media print {
              body {
                background: white;
                color: black;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body class="bg-gray-50 text-gray-900 p-8 antialiased">
          <div class="max-w-3xl mx-auto bg-white p-8 border border-gray-200 rounded-2xl shadow-sm mt-8">
            <div class="flex justify-between items-start border-b pb-6 mb-6">
              <div>
                <h1 class="text-2xl font-black text-indigo-600">VertiAccess</h1>
                <p class="text-xs text-gray-500 mt-1">Leading Drone Infrastructure Access Platform</p>
              </div>
              <div class="text-right">
                <span class="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-green-100 text-green-800 rounded-full">Paid</span>
                <p class="text-sm font-semibold text-gray-700 mt-2">${invoiceNo}</p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h3 class="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">From</h3>
                <p class="font-bold text-gray-800">VertiAccess Ltd.</p>
                <p class="text-sm text-gray-500">123 Drone Runway Boulevard</p>
                <p class="text-sm text-gray-500">London, EC1A 1BB</p>
                <p class="text-sm text-gray-500">billing@vertiaccess.com</p>
              </div>
              <div class="text-right">
                <h3 class="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Billed To</h3>
                <p class="font-bold text-gray-800">Operator User</p>
                <p class="text-sm text-gray-500">Verified Drone Operator</p>
                <p class="text-sm text-gray-500">Transaction ID: ${transaction.id}</p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-8 mb-8 border-t pt-6">
              <div>
                <h3 class="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Date Issued</h3>
                <p class="text-sm font-semibold text-gray-800">${dateStr}</p>
              </div>
              <div class="text-right">
                <h3 class="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Payment Method</h3>
                <p class="text-sm font-semibold text-gray-800 capitalize">${transaction.cardBrand || 'Card'} •••• ${transaction.cardLast4 || 'XXXX'}</p>
              </div>
            </div>

            <table class="w-full text-left border-collapse mb-8">
              <thead>
                <tr class="border-b bg-gray-50 text-gray-500 text-xs uppercase font-bold tracking-wider">
                  <th class="py-3 px-4">Description</th>
                  <th class="py-3 px-4 text-center">Qty</th>
                  <th class="py-3 px-4 text-right">Unit Price</th>
                  <th class="py-3 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody class="divide-y text-sm">
                <tr>
                  <td class="py-4 px-4 font-medium text-gray-900">
                    ${itemDesc}
                    ${transaction.bookingReference ? `<span class="block text-xs text-gray-400 font-mono">Ref: ${transaction.bookingReference.toUpperCase()}</span>` : ''}
                  </td>
                  <td class="py-4 px-4 text-center text-gray-600">1</td>
                  <td class="py-4 px-4 text-right text-gray-600">${symbol}${(total - vat).toFixed(2)}</td>
                  <td class="py-4 px-4 text-right text-gray-900 font-semibold">${symbol}${(total - vat).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            <div class="flex justify-end border-t pt-6">
              <div class="w-64 space-y-2">
                <div class="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>${symbol}${(total - vat).toFixed(2)}</span>
                </div>
                <div class="flex justify-between text-sm text-gray-600">
                  <span>VAT (20% inclusive)</span>
                  <span>${symbol}${vat.toFixed(2)}</span>
                </div>
                <div class="flex justify-between border-t pt-2 text-base font-bold text-gray-900">
                  <span>Total</span>
                  <span>${symbol}${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div class="border-t mt-12 pt-6 text-center text-xs text-gray-400">
              <p>Thank you for choosing VertiAccess. Safe operations!</p>
              <p class="mt-1">For questions or concerns, please contact support@vertiaccess.com</p>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-background border border-border shadow-xl rounded-2xl p-6">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Receipt className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black tracking-tight">{invoiceNo}</DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Date Issued: {dateStr}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-bold gap-1.5"
                onClick={handlePrintAndDownload}
              >
                <Printer className="h-3.5 w-3.5" />
                Print / PDF
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Invoice Summary content (Modal representation) */}
        <div className="py-6 space-y-6 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">From</p>
              <p className="font-bold text-foreground mt-1">VertiAccess Ltd.</p>
              <p className="text-xs text-muted-foreground mt-0.5">123 Drone Runway Boulevard</p>
              <p className="text-xs text-muted-foreground">London, EC1A 1BB</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Billed To</p>
              <p className="font-bold text-foreground mt-1">Operator User</p>
              <p className="text-xs text-muted-foreground mt-0.5">Verified Drone Operator</p>
              <p className="text-xs text-muted-foreground font-mono mt-1">Tx: {transaction.id.slice(0, 12)}...</p>
            </div>
          </div>

          <div className="border border-border/60 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border/60 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  <th className="p-3">Description</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                <tr>
                  <td className="p-3">
                    <p className="font-bold text-foreground">{itemDesc}</p>
                    {transaction.bookingReference && (
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">Booking Ref: {transaction.bookingReference.toUpperCase()}</p>
                    )}
                  </td>
                  <td className="p-3 text-right font-bold text-foreground">
                    {symbol}{total.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <div className="w-64 space-y-2 border-t pt-4">
              <div className="flex justify-between text-xs text-muted-foreground font-medium">
                <span>Subtotal</span>
                <span>{symbol}{(total - vat).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground font-medium">
                <span>VAT (20% inclusive)</span>
                <span>{symbol}{vat.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-foreground pt-1.5 border-t">
                <span>Total Paid</span>
                <span>{symbol}{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
