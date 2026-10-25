'use client';

import React, { useState } from 'react';
import { ExtractedCartResult, GoodItem } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { SafeImage } from '@/components/SafeImage';
import { saveClientOrder } from '@/lib/order-storage';
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
  ArrowLeft,
  CreditCard,
  X,
} from 'lucide-react';

interface ExtractedGoodsViewProps {
  data: ExtractedCartResult;
  onOrderCreated: (orderId: string) => void;
  onReset?: () => void;
  onBack?: () => void;
  onOpenAuth: () => void;
}

export function ExtractedGoodsView({
  data,
  onOrderCreated,
  onReset,
  onBack,
  onOpenAuth,
}: ExtractedGoodsViewProps) {
  const { user } = useAuth();
  const handleBack = onBack || onReset || (() => {});
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

      // CRITICAL: Save order in client-side storage so it can never be removed or lost
      saveClientOrder(resJson.data);

      onOrderCreated(resJson.data.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner (clean, minimal, matching Screen 2 hero card) */}
      <div className="bg-[#F5EDFF] rounded-[32px] p-6 sm:p-8 border border-purple-200/50 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className="px-3 py-1 rounded-full bg-white text-[#7C3AED] text-[11px] font-bold shadow-xs">
              Extracted Cart
            </span>
            <span className="text-xs font-mono text-neutral-500">
              Code: {data.shareCode}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
            {data.title}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 max-w-xl font-medium">
            {data.description}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="px-4 py-2.5 bg-white hover:bg-neutral-50 text-neutral-700 font-bold text-xs rounded-2xl border border-neutral-200 shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Extract Another
          </button>
          <a
            href={data.extractedLink}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs rounded-2xl shadow-xs flex items-center gap-1.5"
          >
            SHEIN Link <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Main Grid: Goods List (left) + Cost Summary (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Goods Items (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-extrabold text-neutral-900 text-lg">
              Items in Cart ({items.length})
            </h3>
            <span className="text-xs text-neutral-400 font-medium">
              Verified with SHEIN
            </span>
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-5 border border-neutral-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col sm:flex-row items-center justify-between gap-5 hover:border-purple-200 transition-colors"
              >
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="w-20 h-24 rounded-2xl overflow-hidden bg-purple-50 shrink-0 border border-neutral-100">
                    <SafeImage
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-extrabold text-neutral-900 text-sm line-clamp-2">
                      {item.name}
                    </h4>
                    <div className="flex flex-wrap gap-2 text-[11px] text-neutral-500">
                      {item.color && (
                        <span className="bg-neutral-50 px-2 py-0.5 rounded-md border border-neutral-200/60">
                          {item.color}
                        </span>
                      )}
                      {item.size && (
                        <span className="bg-neutral-50 px-2 py-0.5 rounded-md border border-neutral-200/60">
                          Size: {item.size}
                        </span>
                      )}
                      {item.sku && (
                        <span className="font-mono text-neutral-400">{item.sku}</span>
                      )}
                    </div>
                    <div className="text-xs font-black text-neutral-900 pt-1">
                      {item.originalPrice.toLocaleString()} EGP <span className="text-neutral-400 font-normal">/ unit</span>
                    </div>
                  </div>
                </div>

                {/* Right: Quantity & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
                  <div className="flex items-center border border-neutral-200 rounded-xl bg-neutral-50 p-0.5">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(item.id, -1)}
                      className="w-7 h-7 flex items-center justify-center text-neutral-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center text-xs font-black text-neutral-900">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(item.id, 1)}
                      className="w-7 h-7 flex items-center justify-center text-neutral-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="text-right min-w-[80px]">
                    <span className="font-black text-base text-neutral-900">
                      {item.subtotal.toLocaleString()} EGP
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-2 text-neutral-300 hover:text-rose-600 rounded-xl transition-colors cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Cost & Payment Breakdown Card */}
        <div className="space-y-4">
          <div className="bg-white rounded-[32px] p-6 border border-neutral-100 shadow-[0_4px_24px_rgb(0,0,0,0.04)] space-y-6">
            <h3 className="font-extrabold text-neutral-900 text-lg">
              Payment &amp; Fees Summary
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between text-neutral-600">
                <span>Items Subtotal ({items.length} goods)</span>
                <span className="font-bold text-neutral-900">
                  {itemsSubtotal.toLocaleString()} EGP
                </span>
              </div>

              <div className="flex items-center justify-between text-neutral-600">
                <span className="flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-[#8B5CF6]" />
                  Dynamic Concierge Fee ({data.dynamicFeePercent}%)
                </span>
                <span className="font-bold text-[#7C3AED]">
                  +{dynamicFeeAmount.toLocaleString()} EGP
                </span>
              </div>

              <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-neutral-400 block font-medium">Total Cash Required</span>
                  <span className="text-2xl font-black text-neutral-950">
                    {totalCash.toLocaleString()} <span className="text-xs font-bold text-neutral-500">EGP</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Workflow steps badge */}
            <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200/60 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-neutral-800">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Next: Admin Approval</span>
              </div>
              <p className="text-[11px] text-neutral-500 leading-relaxed font-normal">
                Once submitted, your order will be <strong>Pending Approval</strong>. The admin verifies availability and unlocks payment via <strong>InstaPay</strong> or <strong>Vodafone Cash</strong>.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!user) {
                  onOpenAuth();
                } else {
                  setShowCheckoutModal(true);
                }
              }}
              className="w-full py-4 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-extrabold text-sm rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
            >
              <Receipt className="w-4 h-4" />
              <span>Submit Order for Admin Review</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Checkout Contact Drawer / Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-neutral-100 overflow-hidden">
            <div className="p-6 bg-neutral-50/80 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-neutral-950 text-lg">Contact &amp; Delivery</h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Confirm phone number for InstaPay / Vodafone Cash payment.
                </p>
              </div>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="p-2 text-neutral-400 hover:text-neutral-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitOrder} className="p-6 space-y-4 text-xs">
              {error && (
                <div className="p-3 bg-rose-50 text-rose-800 rounded-xl text-xs font-semibold">
                  {error}
                </div>
              )}

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Customer Name</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full pl-10 pr-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Egyptian Mobile Phone (InstaPay / Vodafone Cash)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="010XXXXXXXX"
                    className="w-full pl-10 pr-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Delivery Address in Egypt
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3.5 top-3 text-neutral-400" />
                  <textarea
                    rows={2}
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="e.g. Building 12, Street 9, Maadi, Cairo"
                    className="w-full pl-10 pr-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-neutral-400 block">Total Due</span>
                  <span className="font-black text-lg text-neutral-900">
                    {totalCash.toLocaleString()} EGP
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  {submitting ? 'Submitting...' : 'Confirm Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
