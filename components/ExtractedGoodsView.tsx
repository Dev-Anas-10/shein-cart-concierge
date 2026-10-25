'use client';

import React, { useState } from 'react';
import { ExtractedCartResult, GoodItem } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import {
  Trash2,
  Plus,
  Minus,
  ExternalLink,
  CheckCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Percent,
  Receipt,
  User,
  Phone,
  MapPin,
  Sparkles,
  ShoppingBag,
  BadgeAlert,
  Layers,
  ChevronRight,
  X,
} from 'lucide-react';

interface ExtractedGoodsViewProps {
  data: ExtractedCartResult;
  onOrderCreated: (orderId: string) => void;
  onReset: () => void;
  onOpenAuth: () => void;
}

export function ExtractedGoodsView({
  data,
  onOrderCreated,
  onReset,
  onOpenAuth,
}: ExtractedGoodsViewProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<GoodItem[]>(data.items);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  // Customer contact info
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [shippingAddress, setShippingAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculations
  const itemsSubtotal = items.reduce((sum, it) => sum + it.subtotal, 0);
  const dynamicFeeAmount = Math.round(itemsSubtotal * (data.dynamicFeePercent / 100));
  const totalCash = itemsSubtotal + dynamicFeeAmount;

  const handleQuantityChange = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id === id) {
          const newQty = Math.max(1, it.quantity + delta);
          return {
            ...it,
            quantity: newQty,
            subtotal: newQty * it.originalPrice,
          };
        }
        return it;
      })
    );
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      alert('Your cart must contain at least one item.');
      return;
    }
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }

    if (!customerPhone.trim()) {
      setError('Please provide your phone number for InstaPay / Vodafone Cash contact.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        userId: user.id,
        userName: customerName.trim() || user.name,
        userEmail: user.email,
        userPhone: customerPhone.trim(),
        shippingAddress: shippingAddress.trim(),
        rawInput: data.rawInput,
        extractedLink: data.extractedLink,
        cartShareCode: data.shareCode,
        cartGroupId: data.groupId,
        cartCoverImage: data.coverImage,
        items,
        dynamicFeePercent: data.dynamicFeePercent,
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || 'Failed to submit order');
      }

      onOrderCreated(resJson.data.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Extracted Header Banner - High Fashion Luxury Dark */}
      <div className="bg-dark-mesh rounded-3xl p-7 sm:p-10 text-white shadow-2xl relative overflow-hidden border border-white/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-black uppercase tracking-wider border border-emerald-500/30 backdrop-blur">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                Live SHEIN Session Scraped
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 text-rose-300 text-[11px] font-mono border border-white/10">
                Code: {data.shareCode}
              </span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-black tracking-tight">{data.title}</h3>
            <p className="text-neutral-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              {data.description}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono">
              <span className="text-neutral-400">
                Group ID: <strong className="text-white">{data.groupId}</strong>
              </span>
              <span className="text-neutral-500">•</span>
              <a
                href={data.extractedLink}
                target="_blank"
                rel="noreferrer"
                className="text-rose-400 hover:text-rose-300 font-bold underline inline-flex items-center gap-1"
              >
                Inspect Original SHEIN Cart <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <button
            onClick={onReset}
            className="self-start md:self-center px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold transition-all border border-white/15 backdrop-blur cursor-pointer active:scale-95 whitespace-nowrap"
          >
            Extract Different Cart
          </button>
        </div>
      </div>

      {/* Main Grid: Goods on left, Dynamic Pricing on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Extracted Goods Lookbook Cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-1">
            <h4 className="text-xl font-black text-neutral-950 flex items-center gap-2.5 tracking-tight">
              <span>Extracted Goods</span>
              <span className="text-xs font-black bg-rose-100 text-rose-800 px-3 py-1 rounded-full">
                {items.length} Items Available
              </span>
            </h4>
            <span className="text-xs text-neutral-400 font-medium hidden sm:inline">
              Adjust quantities or remove items before admin review
            </span>
          </div>

          <div className="space-y-3.5">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className="group bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs hover:shadow-lg hover:border-neutral-300 transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
              >
                {/* Image & Description */}
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="relative w-20 h-26 rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200/60 flex-shrink-0 shadow-xs group-hover:shadow-md transition-shadow">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-xs text-white text-[10px] font-black px-1.5 py-0.5 rounded-md">
                      #{idx + 1}
                    </span>
                  </div>

                  <div className="space-y-2 min-w-0 flex-1">
                    <h5 className="font-extrabold text-neutral-950 text-sm sm:text-base leading-snug line-clamp-2">
                      {item.name}
                    </h5>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {item.color && (
                        <span className="bg-neutral-100 px-2.5 py-1 rounded-lg font-bold text-neutral-700">
                          Color: {item.color}
                        </span>
                      )}
                      {item.size && (
                        <span className="bg-neutral-100 px-2.5 py-1 rounded-lg font-bold text-neutral-700">
                          Size: {item.size}
                        </span>
                      )}
                      {item.sku && (
                        <span className="text-[11px] text-neutral-400 font-mono">
                          {item.sku}
                        </span>
                      )}
                    </div>

                    <div className="text-xs font-extrabold text-neutral-700 sm:hidden">
                      {item.originalPrice.toLocaleString()} EGP
                    </div>
                  </div>
                </div>

                {/* Counter & Subtotal */}
                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-neutral-100">
                  {/* Stepper */}
                  <div className="flex items-center border border-neutral-200 rounded-2xl bg-neutral-50/80 p-1 shadow-inner">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(item.id, -1)}
                      className="w-7 h-7 rounded-xl hover:bg-white text-neutral-600 flex items-center justify-center transition-colors cursor-pointer"
                      title="Decrease"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3.5 text-xs font-black text-neutral-900 font-mono">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(item.id, 1)}
                      className="w-7 h-7 rounded-xl hover:bg-white text-neutral-600 flex items-center justify-center transition-colors cursor-pointer"
                      title="Increase"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Line Total */}
                  <div className="text-right min-w-[100px]">
                    <div className="text-lg font-black text-neutral-950 tracking-tight">
                      {item.subtotal.toLocaleString()}{' '}
                      <span className="text-xs font-bold text-neutral-500">EGP</span>
                    </div>
                    <div className="text-[11px] text-neutral-400 hidden sm:block">
                      {item.originalPrice} EGP × {item.quantity}
                    </div>
                  </div>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-2.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-colors cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Dynamic Pricing Breakdown & Submission Box */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl shadow-neutral-950/5 border border-neutral-200/80 sticky top-28">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <h4 className="text-lg font-black text-neutral-950 tracking-tight">
                Cash Breakdown
              </h4>
              <span className="text-[11px] font-black text-rose-700 bg-rose-50 border border-rose-200/60 px-2.5 py-1 rounded-full flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                Dynamic Pricing
              </span>
            </div>

            {/* Price lines */}
            <div className="py-5 space-y-4 text-xs">
              <div className="flex items-center justify-between text-neutral-600">
                <span className="font-medium">Goods Subtotal ({items.length} items)</span>
                <span className="font-extrabold text-neutral-900 text-sm">
                  {itemsSubtotal.toLocaleString()} EGP
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200/60 text-rose-800">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-rose-600 text-white flex items-center justify-center font-black text-[10px]">
                    %
                  </div>
                  <div>
                    <span className="font-extrabold block text-xs">Dynamic Service Fee</span>
                    <span className="text-[10px] text-rose-600 block">Markup ({data.dynamicFeePercent}%)</span>
                  </div>
                </div>
                <span className="font-black text-sm">+{dynamicFeeAmount.toLocaleString()} EGP</span>
              </div>

              <div className="flex items-center justify-between text-neutral-500 text-[11px]">
                <span>Shipping & Handling</span>
                <span className="font-bold text-emerald-600">Free Concierge Dispatch</span>
              </div>
            </div>

            {/* Total Cash Header */}
            <div className="pt-5 border-t border-neutral-200/80">
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-sm font-black text-neutral-900 uppercase tracking-wider">
                  Total Cash to Pay
                </span>
                <div className="text-right">
                  <span className="text-3xl sm:text-4xl font-black text-neutral-950 tracking-tight">
                    {totalCash.toLocaleString()}
                  </span>
                  <span className="text-xs font-extrabold text-neutral-500 ml-1.5">EGP</span>
                </div>
              </div>
              <p className="text-[11px] text-neutral-400">
                Calculated dynamically: items + {data.dynamicFeePercent}% service & customs.
              </p>
            </div>

            {/* Workflow Explainer Cards */}
            <div className="mt-6 p-4 rounded-2xl bg-neutral-50 border border-neutral-200/60 space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-neutral-600 leading-relaxed">
                  <strong className="text-neutral-900">Step 1 — Pending Review:</strong> Your order will appear as <span className="text-amber-700 font-bold">Pending Approval</span> while admin reviews your goods.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-neutral-600 leading-relaxed">
                  <strong className="text-neutral-900">Step 2 — Egyptian Gateways:</strong> When approved, transfer via <strong className="text-neutral-900">InstaPay</strong> or <strong className="text-neutral-900">Vodafone Cash</strong>.
                </p>
              </div>
            </div>

            {/* Submission CTA Button */}
            <button
              type="button"
              onClick={() => {
                if (!user) {
                  onOpenAuth();
                } else {
                  setShowCheckoutModal(true);
                }
              }}
              className="mt-6 w-full py-4 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-black text-sm rounded-2xl shadow-xl shadow-rose-600/20 hover:shadow-2xl transition-all flex items-center justify-center gap-2.5 active:scale-[0.98] cursor-pointer"
            >
              <span>Submit Cart for Admin Review</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden">
            <div className="p-6 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-neutral-950">Confirm Order Submission</h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Your order will be sent to the admin dashboard for accurate review.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                className="p-2 text-neutral-400 hover:text-neutral-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitOrder} className="p-6 space-y-4">
              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Customer Name</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Sara Ahmed"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-950"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Egyptian Mobile Phone (for InstaPay / Vodafone Cash match)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="010XXXXXXXX"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-950"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Delivery Address in Egypt (Optional)
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3.5 top-3 text-neutral-400" />
                  <textarea
                    rows={2}
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="e.g. Building 12, Road 9, Maadi, Cairo"
                    className="w-full pl-10 pr-3.5 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-950 resize-none"
                  />
                </div>
              </div>

              {/* Order total recap */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 text-xs space-y-1.5">
                <div className="flex justify-between text-neutral-600">
                  <span>Goods Subtotal:</span>
                  <span className="font-bold">{itemsSubtotal.toLocaleString()} EGP</span>
                </div>
                <div className="flex justify-between text-rose-600 font-bold">
                  <span>Dynamic Fee ({data.dynamicFeePercent}%):</span>
                  <span>+{dynamicFeeAmount.toLocaleString()} EGP</span>
                </div>
                <div className="pt-2 border-t border-neutral-200 flex justify-between text-sm font-black text-neutral-950">
                  <span>Total Cash:</span>
                  <span>{totalCash.toLocaleString()} EGP</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCheckoutModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-neutral-600 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-neutral-950 hover:bg-neutral-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  {submitting ? 'Submitting...' : 'Confirm & Send Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
