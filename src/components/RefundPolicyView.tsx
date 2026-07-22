import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, FileText, ArrowLeft, Printer, ExternalLink, RefreshCw, AlertTriangle, Clock, CheckCircle2, Building2, HelpCircle } from 'lucide-react';

interface RefundPolicyViewProps {
  onBackToHome?: () => void;
}

export function RefundPolicyView({ onBackToHome }: RefundPolicyViewProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 print:hidden">
        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-sea-green active:scale-95"
        >
          <ArrowLeft size={16} />
          Back to Home
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 transition-all hover:bg-slate-200 active:scale-95"
          >
            <Printer size={16} />
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-slate-900 p-8 text-white shadow-xl relative overflow-hidden"
      >
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-sea-green/20 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-sea-green/20 px-3.5 py-1.5 text-xs font-bold text-sea-green-light border border-sea-green/30">
            <RefreshCw size={14} />
            Official Platform Policy
          </div>
          <h1 className="text-3xl font-black tracking-tight sm:text-5xl">
            Refund & Cancellation Policy
          </h1>
          <p className="max-w-2xl text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            This policy outlines how you can cancel or seek a refund for a product or service purchased through our Platform.
          </p>

          <div className="pt-4 flex flex-wrap gap-6 text-xs text-slate-400 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <Building2 size={14} className="text-sea-green" />
              <span>Platform: <strong className="text-slate-200">A D Professional Solution</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <ExternalLink size={14} className="text-sea-green" />
              <span>Website: <a href="https://www.adprosol.in/" target="_blank" rel="noopener noreferrer" className="text-sea-green-light hover:underline font-mono">https://www.adprosol.in/</a></span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-sea-green" />
              <span>Refund Timeframe: <strong className="text-slate-200">15 Days Processing</strong></span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Highlights Grid */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid gap-4 sm:grid-cols-3"
      >
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sea-green-light text-sea-green font-bold">
            <Clock size={18} />
          </div>
          <h3 className="font-extrabold text-slate-900 text-sm">7 Days Cancellation Window</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Cancellation requests are considered within 7 days of placing the order, provided shipping/delivery hasn't initiated.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sea-green-light text-sea-green font-bold">
            <AlertTriangle size={18} />
          </div>
          <h3 className="font-extrabold text-slate-900 text-sm">Defective / Damaged Items</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Report damaged or defective items to customer service within 7 days of receipt for review and determination.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sea-green-light text-sea-green font-bold">
            <RefreshCw size={18} />
          </div>
          <h3 className="font-extrabold text-slate-900 text-sm">15 Days Processing</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Once a refund request is verified and approved by 8777561824, funds will be processed within 15 days.
          </p>
        </div>
      </motion.div>

      {/* Main Content Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm space-y-8 text-slate-800 text-sm sm:text-base leading-relaxed"
      >
        <div className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Refund and Cancellation Policy
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
            This refund and cancellation policy outlines how you can cancel or seek a refund for a product / service that you have purchased through the Platform. Under this policy:
          </p>
        </div>

        <div className="space-y-4">
          {[
            {
              num: 1,
              title: "Order Cancellation Conditions",
              text: "Cancellations will only be considered if the request is made 7 days of placing the order. However, cancellation requests may not be entertained if the orders have been communicated to such sellers / merchant(s) listed on the Platform and they have initiated the process of shipping them, or the product is out for delivery. In such an event, you may choose to reject the product at the doorstep."
            },
            {
              num: 2,
              title: "Perishable Items Exception",
              text: "8777561824 does not accept cancellation requests for perishable items like flowers, eatables, etc. However, the refund / replacement can be made if the user establishes that the quality of the product delivered is not good."
            },
            {
              num: 3,
              title: "Damaged or Defective Items & Expectations",
              text: "In case of receipt of damaged or defective items, please report to our customer service team. The request would be entertained once the seller/ merchant listed on the Platform, has checked and determined the same at its own end. This should be reported within 7 days of receipt of products. In case you feel that the product received is not as shown on the site or as per your expectations, you must bring it to the notice of our customer service within 7 days of receiving the product. The customer service team after looking into your complaint will take an appropriate decision."
            },
            {
              num: 4,
              title: "Manufacturer Warranty",
              text: "In case of complaints regarding the products that come with a warranty from the manufacturers, please refer the issue to them."
            },
            {
              num: 5,
              title: "Refund Timeline",
              text: "In case of any refunds approved by 8777561824, it will take 15 days for the refund to be processed to you."
            }
          ].map((item) => (
            <div key={item.num} className="flex gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:bg-slate-50/80">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sea-green text-white font-extrabold text-sm">
                {item.num}
              </span>
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">{item.title}</h3>
                <p className="text-slate-700 text-xs sm:text-sm leading-relaxed">{item.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Support & Contact Card */}
        <div className="rounded-2xl bg-sea-green-light/40 border border-sea-green/20 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-extrabold text-sea-green-dark text-sm sm:text-base flex items-center gap-2">
              <HelpCircle size={18} /> Need Assistance with a Refund or Cancellation?
            </h4>
            <p className="text-xs sm:text-sm text-slate-700">
              Contact our customer support team with your order details and invoice number.
            </p>
          </div>
          <a
            href="mailto:adprofessionalsolution@gmail.com"
            className="shrink-0 rounded-xl bg-sea-green px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-sea-green-dark transition-all active:scale-95"
          >
            Contact Customer Service
          </a>
        </div>

        {/* Footer info inside Card */}
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <div>
            Registered Office: North 24 Parganas, West Bengal, India, 743145
          </div>
          <div>
            © A D Professional Solution. All Rights Reserved.
          </div>
        </div>
      </motion.div>
    </div>
  );
}
