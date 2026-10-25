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
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, WebP) for your payment receipt.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setReceiptImage(reader.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderIdentifier.trim()) {
      setError('Please enter your sender mobile number or InstaPay address.');
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
          receiptImage: receiptImage || undefined,
        }),
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || 'Failed to submit payment proof');
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
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex items-center justify-center font-black text-base shadow-md shadow-purple-600/30 flex-shrink-0">
              IP
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
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-600 to-red-700 text-white flex items-center justify-center font-black text-base shadow-md shadow-rose-600/30 flex-shrink-0">
              VF
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
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-600">InstaPay Payment Address (IPA):</span>
                <button
                  type="button"
                  onClick={() => handleCopy(settings.instapayAddress, 'ipa')}
                  className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                >
                  {copiedField === 'ipa' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedField === 'ipa' ? 'Copied to Clipboard' : 'Copy Address'}</span>
                </button>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-neutral-200 font-mono text-lg font-black text-neutral-900 tracking-tight flex items-center justify-between shadow-inner">
                <span>{settings.instapayAddress}</span>
                <span className="text-xs font-normal text-purple-600 bg-purple-50 px-2 py-1 rounded-md">
                  Verified IPA
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-neutral-600">
                <span>Recipient Account Name:</span>
                <strong className="text-neutral-950">{settings.instapayAccountName}</strong>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-600">Vodafone Cash Wallet Number:</span>
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

          {/* Screenshot Upload Drag Box */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              Receipt Screenshot / Photo Proof
            </label>
            <div className="mt-1 border-2 border-dashed border-neutral-300 hover:border-neutral-400 rounded-3xl p-6 text-center bg-neutral-50/50 transition-colors">
              {receiptImage ? (
                <div className="flex flex-col items-center">
                  <div className="relative max-w-xs rounded-2xl overflow-hidden border border-neutral-200 shadow-md">
                    <img src={receiptImage} alt="Receipt proof" className="max-h-56 object-contain" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setReceiptImage(null)}
                    className="mt-3 text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                  >
                    Remove & Re-upload
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-neutral-200 flex items-center justify-center text-neutral-500 mb-2">
                    <Upload className="w-5 h-5 text-neutral-700" />
                  </div>
                  <span className="text-xs font-black text-neutral-900">
                    Click to select payment screenshot
                  </span>
                  <span className="text-[11px] text-neutral-400 mt-0.5">
                    Supports PNG, JPG, or screenshot from InstaPay / Vodafone Cash
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
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
                <span>Confirm Payment Proof & Send to Admin</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
