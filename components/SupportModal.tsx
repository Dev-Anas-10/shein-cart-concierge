'use client';

import React, { useState } from 'react';
import {
  X,
  Phone,
  MessageCircle,
  Copy,
  Check,
  Clock,
  ShieldCheck,
  CreditCard,
  ExternalLink,
} from 'lucide-react';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  supportPhone?: string;
  vodafoneNumber?: string;
  instapayAddress?: string;
}

export function SupportModal({
  isOpen,
  onClose,
  supportPhone = '+20 109 876 5432',
  vodafoneNumber = '01098765432',
  instapayAddress = 'shein.orders@instapay',
}: SupportModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const cleanPhone = supportPhone.replace(/[^0-9]/g, '');
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    'مرحبا، أود الاستفسار بخصوص طلبي من شي إن والدفع عبر إنستاباي أو فودافون كاش.'
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl border border-neutral-100 overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-[#F5EDFF] border-b border-purple-100 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-[#7C3AED] uppercase tracking-wider block">
              Customer Concierge
            </span>
            <h3 className="text-xl font-extrabold text-neutral-900 tracking-tight">
              Support &amp; Contact Hub
            </h3>
            <p className="text-xs text-neutral-600">
              Need help with cart extraction, pricing, or InstaPay / Vodafone Cash payment?
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/80 hover:bg-white text-neutral-500 hover:text-neutral-900 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Channels */}
        <div className="p-6 space-y-3.5 text-xs">
          {/* WhatsApp Direct Chat */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/80 transition-all flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-neutral-900 text-sm">WhatsApp Chat</h4>
                <p className="text-[11px] text-emerald-800">
                  Instant live response for orders &amp; payments
                </p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-emerald-700 group-hover:translate-x-0.5 transition-transform" />
          </a>

          {/* Direct Phone Call */}
          <div className="p-4 rounded-2xl border border-neutral-100 bg-neutral-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#8B5CF6] text-white flex items-center justify-center shrink-0 shadow-sm">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-extrabold text-neutral-900 text-sm">Hotline Call</h4>
                <p className="font-mono text-xs text-neutral-700 font-bold">{supportPhone}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <a
                href={`tel:${supportPhone}`}
                className="px-3 py-1.5 rounded-xl bg-white border border-neutral-200 text-xs font-bold text-neutral-800 hover:bg-neutral-100"
              >
                Call
              </a>
              <button
                type="button"
                onClick={() => handleCopy(supportPhone, 'phone')}
                className="p-1.5 rounded-xl bg-white border border-neutral-200 text-neutral-500 hover:text-neutral-900 cursor-pointer"
                title="Copy phone"
              >
                {copiedField === 'phone' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Payment Accounts Quick Reference */}
          <div className="p-4 rounded-2xl border border-purple-100 bg-purple-50/50 space-y-2.5">
            <span className="font-extrabold text-[#6D28D9] text-xs block">
              Official Payment Targets (Egypt):
            </span>

            <div className="flex items-center justify-between text-[11px] bg-white p-2.5 rounded-xl border border-purple-100">
              <div>
                <span className="text-neutral-400 block font-medium">InstaPay IPA</span>
                <span className="font-mono font-bold text-neutral-900">{instapayAddress}</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(instapayAddress, 'instapay')}
                className="text-[11px] font-bold text-[#7C3AED] hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedField === 'instapay' ? 'Copied ✓' : 'Copy'}
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] bg-white p-2.5 rounded-xl border border-purple-100">
              <div>
                <span className="text-neutral-400 block font-medium">Vodafone Cash Wallet</span>
                <span className="font-mono font-bold text-neutral-900">{vodafoneNumber}</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(vodafoneNumber, 'vodafone')}
                className="text-[11px] font-bold text-[#7C3AED] hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedField === 'vodafone' ? 'Copied ✓' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Operating hours */}
          <div className="flex items-center gap-2 pt-1 text-neutral-500 text-[11px]">
            <Clock className="w-3.5 h-3.5 text-neutral-400" />
            <span>Daily support: 9:00 AM – 11:00 PM (Cairo Time)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
