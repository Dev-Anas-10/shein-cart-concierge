'use client';

import React, { useState } from 'react';
import { Order, SystemSettings } from '@/lib/types';
import { saveClientOrder } from '@/lib/order-storage';
import {
  CreditCard,
  Copy,
  Check,
  Upload,
  QrCode,
  Phone,
  FileCheck,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Zap,
  ExternalLink,
} from 'lucide-react';

interface PaymentSectionProps {
  order: Order;
  settings: SystemSettings;
  onPaymentSubmitted: () => void;
}

export function PaymentSection({ order, settings, onPaymentSubmitted }: PaymentSectionProps) {
  const [method, setMethod] = useState<'instapay' | 'vodafone_cash'>('instapay');
  const [senderIdentifier, setSenderIdentifier] = useState(order.userPhone || '');
  const [transactionReference, setTransactionReference] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderIdentifier.trim()) {
      setError('يرجى إدخال رقم الهاتف أو عنوان إنستاباي المحول منه.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/orders/${order.id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method,
          senderIdentifier: senderIdentifier.trim(),
          transactionReference: transactionReference.trim() || undefined,
        }),
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || 'فشل إرسال بيانات الدفع');
      }

      if (resJson.data) {
        saveClientOrder(resJson.data);
      }

      onPaymentSubmitted();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative group">
      {/* Decorative ambient glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-purple-500/20 rounded-3xl blur-xl opacity-75 pointer-events-none" />

      <div className="relative bg-white rounded-3xl p-7 sm:p-10 shadow-2xl border-2 border-emerald-500/30">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-neutral-100">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-black uppercase tracking-wider border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Order Approved by Admin — Payment Unlocked
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-neutral-950 tracking-tight">
              Pay with InstaPay or Vodafone Cash
            </h3>
            <p className="text-xs text-neutral-500 font-normal">
              Select your payment method below, transfer the approved total, and upload your screenshot receipt.
            </p>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-2xl border border-emerald-200/80 text-left sm:text-right shadow-xs">
            <span className="text-[11px] uppercase font-bold text-emerald-800 tracking-wider block">
              Approved Total Cash
            </span>
            <div className="text-3xl font-black text-emerald-900 tracking-tight">
              {order.totalCash.toLocaleString()}{' '}
              <span className="text-xs font-bold text-emerald-700">EGP</span>
            </div>
          </div>
        </div>

        {/* Payment Channels Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-7">
          {/* InstaPay Option */}
          <button
            type="button"
            onClick={() => setMethod('instapay')}
            className={`p-5 rounded-3xl border-2 transition-all duration-200 flex items-center gap-4 text-left cursor-pointer ${
              method === 'instapay'
                ? 'border-purple-600 bg-purple-50/60 shadow-lg shadow-purple-600/10 ring-2 ring-purple-600/20'
                : 'border-neutral-200/80 bg-neutral-50/50 hover:bg-neutral-100/70'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-white p-1.5 border border-purple-200 shadow-md shadow-purple-600/10 flex items-center justify-center shrink-0">
              <img src="/images/instapay.png" alt="InstaPay" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-black text-neutral-950 text-base">InstaPay</span>
                <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                  Instant EBC
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">Direct Egyptian Bank Transfer</p>
            </div>
          </button>

          {/* Vodafone Cash Option */}
          <button
            type="button"
            onClick={() => setMethod('vodafone_cash')}
            className={`p-5 rounded-3xl border-2 transition-all duration-200 flex items-center gap-4 text-left cursor-pointer ${
              method === 'vodafone_cash'
                ? 'border-rose-600 bg-rose-50/60 shadow-lg shadow-rose-600/10 ring-2 ring-rose-600/20'
                : 'border-neutral-200/80 bg-neutral-50/50 hover:bg-neutral-100/70'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-white p-1 border border-rose-200 shadow-md shadow-rose-600/10 flex items-center justify-center shrink-0">
              <img src="/images/vodafone-cash.png" alt="Vodafone Cash" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-black text-neutral-950 text-base">Vodafone Cash</span>
                <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                  Mobile Wallet
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">Instant Mobile Wallet Transfer</p>
            </div>
          </button>
        </div>

        {/* Selected Channel Interactive Details Card */}
        <div className="mt-6 p-6 rounded-3xl bg-neutral-50 border border-neutral-200/80 space-y-4">
          {method === 'instapay' ? (
            <div className="space-y-4">
              {/* Direct InstaPay Link Button */}
              <a
                href={settings.instapayPaymentUrl || 'https://ipn.eg/S/anasashraf10/instapay/6OaEAR'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 px-5 bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-black rounded-2xl shadow-lg shadow-purple-600/25 hover:shadow-xl transition-all flex items-center justify-between group active:scale-[0.99] border border-purple-400/30"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white p-1.5 flex items-center justify-center shrink-0 shadow-md">
                    <img src="/images/instapay.png" alt="InstaPay" className="w-full h-full object-contain" />
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className="block text-sm sm:text-base font-black">اضغط الرابط لإرسال نقود عبر إنستاباي</span>
                      <span className="text-[9px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        Direct Link
                      </span>
                    </div>
                    <span className="text-[11px] text-purple-100 font-medium block mt-0.5">
                      فتح تطبيق InstaPay مباشرة على هاتفك للتحويل فوراً
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-xl text-xs font-bold border border-white/30 transition-all shrink-0">
                  <span>فتح التطبيق</span>
                  <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </a>

              {/* InstaPay IPA Details Card */}
              <div className="p-4 rounded-2xl bg-white border border-purple-100/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-purple-50 p-1 flex items-center justify-center">
                      <img src="/images/instapay.png" alt="InstaPay" className="w-full h-full object-contain" />
                    </div>
                    <span className="text-xs font-bold text-neutral-700">عنوان الدفع اللحظي (IPA):</span>
                  </div>
                  <span className="text-[10px] font-black tracking-wide text-purple-700 bg-purple-50 border border-purple-200/60 px-2.5 py-0.5 rounded-full">
                    Powered by InstaPay
                  </span>
                </div>

                <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200 font-mono text-base sm:text-lg font-black text-neutral-900 tracking-tight flex items-center justify-between shadow-inner">
                  <span dir="ltr">{settings.instapayAddress || 'anasashraf10@instapay'}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(settings.instapayAddress || 'anasashraf10@instapay', 'ipa')}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                  >
                    {copiedField === 'ipa' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'ipa' ? 'تم النسخ ✓' : 'نسخ العنوان'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs text-neutral-600 pt-1 border-t border-neutral-100">
                  <span>اسم صاحب الحساب:</span>
                  <strong className="text-neutral-950 font-bold">{settings.instapayAccountName || 'anasashraf10'}</strong>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-white p-0.5 border border-rose-200 shadow-2xs flex items-center justify-center">
                    <img src="/images/vodafone-cash.png" alt="Vodafone Cash" className="w-full h-full object-contain" />
                  </div>
                  <span className="text-xs font-bold text-neutral-700">Vodafone Cash Wallet Number:</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(settings.vodafoneCashNumber, 'vfc')}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                >
                  {copiedField === 'vfc' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedField === 'vfc' ? 'Copied Number' : 'Copy Number'}</span>
                </button>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-neutral-200 font-mono text-2xl font-black text-rose-600 tracking-tight flex items-center justify-between shadow-inner">
                <span>{settings.vodafoneCashNumber}</span>
                <span className="text-xs font-normal text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md font-sans">
                  Active Wallet
                </span>
              </div>

              {/* USSD Dialing shortcut */}
              <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200 text-xs text-rose-900 flex items-start gap-3">
                <Phone className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-black text-rose-950">Quick USSD Dialing Guide:</p>
                  <p className="text-[11px] text-rose-800 leading-relaxed">
                    Dial: <code className="bg-white px-2 py-0.5 rounded font-bold font-mono text-neutral-900 border border-rose-200">*9*7*{settings.vodafoneCashNumber}*{order.totalCash}#</code> on your mobile phone, confirm with your Vodafone PIN, and capture the receipt.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Proof Submission Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="flex items-center gap-2 pb-1 border-b border-neutral-100">
            <FileCheck className="w-4 h-4 text-emerald-600" />
            <h4 className="text-sm font-black text-neutral-950 uppercase tracking-wider">
              Upload Transfer Receipt
            </h4>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Sender Mobile / InstaPay ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={senderIdentifier}
                onChange={(e) => setSenderIdentifier(e.target.value)}
                placeholder={method === 'instapay' ? 'name@instapay' : '010XXXXXXXX'}
                className="w-full px-4 py-3 text-sm bg-neutral-50 border border-neutral-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-950 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Transaction ID (from SMS or app)
              </label>
              <input
                type="text"
                value={transactionReference}
                onChange={(e) => setTransactionReference(e.target.value)}
                placeholder="e.g. TXN-1928301"
                className="w-full px-4 py-3 text-sm bg-neutral-50 border border-neutral-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-950 font-mono"
              />
            </div>
          </div>

          {/* No Image Upload Reassurance Badge */}
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-black text-emerald-950 dark:text-emerald-200">
                لا حاجة لرفع صورة إيصال أو لقطة شاشة
              </p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                يكتفي المشرف برقم الهاتف المحول منه أو كود العملية للتحقق من وصول المبلغ وتأكيد الطلب فوراً.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-sm rounded-2xl shadow-xl shadow-emerald-600/20 hover:shadow-2xl transition-all flex items-center justify-center gap-2.5 active:scale-[0.98] cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>تأكيد إرسال بيانات الدفع للمشرف</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
