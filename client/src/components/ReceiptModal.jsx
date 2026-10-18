import React from 'react';
import { X, Printer, ExternalLink } from 'lucide-react';
import { useWallet } from '../context/WalletContext.jsx';

export default function ReceiptModal() {
  const { viewReceiptId, closeReceipt } = useWallet();

  if (!viewReceiptId) return null;

  const receiptUrl = `/api/payments/receipt/${viewReceiptId}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-cyan-400">KNOVERA</span>
            <span className="text-xs text-slate-400">| Tax Invoice & Verified Receipt</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1 transition-colors"
              title="Open full page"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={closeReceipt}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Embedded Iframe */}
        <div className="flex-1 overflow-auto bg-slate-50">
          <iframe
            src={receiptUrl}
            title="Knovera Payment Receipt"
            className="w-full h-[650px] border-none"
          />
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex justify-between items-center text-xs text-slate-600">
          <span>Official 1 Credit = 1 Minute Knovera Tax Invoice</span>
          <button
            onClick={() => {
              const iframe = document.querySelector('iframe');
              if (iframe) iframe.contentWindow.print();
            }}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg flex items-center gap-2 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}
