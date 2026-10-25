'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Order, SystemSettings } from '@/lib/types';
import { Navbar } from '@/components/Navbar';
import { AuthModal } from '@/components/AuthModal';
import { OrderTimeline } from '@/components/OrderTimeline';
import { PaymentSection } from '@/components/PaymentSection';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  ArrowLeft,
  RefreshCw,
  ShoppingBag,
  Percent,
  CreditCard,
  ShieldCheck,
  User,
  Phone,
  Sparkles,
  ChevronRight,
  Receipt,
} from 'lucide-react';
import Link from 'next/link';

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);

  const fetchOrder = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [orderRes, settingsRes] = await Promise.all([
        fetch(`/api/orders/${id}`),
        fetch('/api/settings'),
      ]);

      const orderJson = await orderRes.json();
      const settingsJson = await settingsRes.json();

      if (orderJson.success) setOrder(orderJson.data);
      if (settingsJson.success) setSettings(settingsJson.data);
    } catch (err) {
      console.error('Failed to fetch order:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-black uppercase tracking-wider text-neutral-500">
            Loading SHEIN Order #{id}...
          </p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col">
        <Navbar onOpenAuth={() => setAuthOpen(true)} />
        <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
          <h2 className="text-2xl font-black text-neutral-900">Order Not Found</h2>
          <p className="text-xs text-neutral-500">The requested order could not be located.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-950 text-white rounded-2xl text-xs font-extrabold shadow-sm"
          >
            Extract a New Cart
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100/60 pb-20">
      <Navbar onOpenAuth={() => setAuthOpen(true)} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 text-xs font-black text-neutral-600 hover:text-neutral-950 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to All Orders
          </Link>

          <button
            onClick={fetchOrder}
            className="p-2.5 text-neutral-500 hover:text-neutral-950 bg-white rounded-2xl border border-neutral-200 transition-colors shadow-xs cursor-pointer"
            title="Refresh order status"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Master Status & Timeline Card */}
        <div className="bg-white rounded-3xl p-7 sm:p-10 border border-neutral-200/80 shadow-xs space-y-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-neutral-100">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-2xl sm:text-3xl font-black text-neutral-950 tracking-tight">
                  {order.id}
                </span>

                {order.status === 'PENDING_APPROVAL' && (
                  <span className="px-3.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                    Pending Admin Approval
                  </span>
                )}
                {order.status === 'APPROVED_PENDING_PAYMENT' && (
                  <span className="px-3.5 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-900 border border-blue-300">
                    Approved — Payment Unlocked
                  </span>
                )}
                {order.status === 'PAYMENT_UNDER_REVIEW' && (
                  <span className="px-3.5 py-1 rounded-full text-xs font-black bg-purple-100 text-purple-900 border border-purple-300">
                    Payment Under Review
                  </span>
                )}
                {order.status === 'PAID' && (
                  <span className="px-3.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                    Paid & Confirmed
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400">
                Created on {new Date(order.createdAt).toLocaleDateString()} at{' '}
                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Customer: {order.userName}
              </p>
            </div>

            <div className="text-left sm:text-right bg-neutral-50 sm:bg-transparent p-4 sm:p-0 rounded-2xl border sm:border-0 border-neutral-100">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                Total Cash to Pay
              </span>
              <span className="text-3xl sm:text-4xl font-black text-neutral-950 tracking-tight">
                {order.totalCash.toLocaleString()}{' '}
                <span className="text-sm font-bold text-neutral-500">EGP</span>
              </span>
            </div>
          </div>

          {/* Stepper Timeline */}
          <OrderTimeline status={order.status} />

          {/* Live Notice Banners */}
          {order.status === 'PENDING_APPROVAL' && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-950 text-xs flex items-start gap-3.5">
              <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-black text-sm text-amber-950">Cart is Pending Admin Review</p>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Our concierge team is reviewing every good in your SHEIN cart to verify regional stock availability and confirm the 20% concierge fee. As soon as the admin approves your order, you can pay via <strong>InstaPay</strong> or <strong>Vodafone Cash</strong>.
                </p>
              </div>
            </div>
          )}

          {order.status === 'PAYMENT_UNDER_REVIEW' && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 text-purple-950 text-xs flex items-start gap-3.5">
              <ShieldCheck className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-black text-sm text-purple-950">Payment Receipt Received</p>
                <p className="text-[11px] text-purple-800 leading-relaxed">
                  You submitted payment proof via <strong>{order.payment?.method === 'instapay' ? 'InstaPay' : 'Vodafone Cash'}</strong>. The admin is verifying the transfer screenshot and will update your order to Paid shortly.
                </p>
              </div>
            </div>
          )}

          {/* Overall Admin Order Comment Callout */}
          {order.adminComment && (
            <div className="p-5 rounded-2xl bg-rose-50/80 border border-rose-200 text-xs text-rose-950 space-y-1.5 shadow-xs">
              <div className="flex items-center gap-2 font-black text-rose-800 uppercase tracking-wider text-[11px]">
                <MessageSquare className="w-4 h-4 text-rose-600" />
                <span>Message from Concierge Supervisor:</span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-rose-900 font-medium pl-6">
                &ldquo;{order.adminComment}&rdquo;
              </p>
            </div>
          )}
        </div>

        {/* PAYMENT PANEL (ACTIVE WHEN APPROVED) */}
        {order.status === 'APPROVED_PENDING_PAYMENT' && settings && (
          <PaymentSection
            order={order}
            settings={settings}
            onPaymentSubmitted={fetchOrder}
          />
        )}

        {/* GOODS LIST & SPECIFIC ADMIN COMMENTS */}
        <div className="bg-white rounded-3xl p-7 sm:p-10 border border-neutral-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
            <h3 className="text-xl font-black text-neutral-950 flex items-center gap-2.5">
              <ShoppingBag className="w-5 h-5 text-neutral-700" />
              <span>Extracted Goods & Admin Notes</span>
              <span className="text-xs font-bold text-neutral-500 bg-neutral-100 px-3 py-0.5 rounded-full">
                {order.items.length} goods
              </span>
            </h3>

            <a
              href={order.extractedLink}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-extrabold text-rose-600 hover:underline inline-flex items-center gap-1 font-mono"
            >
              Original SHEIN Cart <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="divide-y divide-neutral-100">
            {order.items.map((item, idx) => (
              <div key={item.id} className="py-5 first:pt-0 last:pb-0 space-y-3">
                <div className="flex items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-22 object-cover rounded-2xl border border-neutral-200 shadow-xs flex-shrink-0"
                    />
                    <div className="space-y-1.5">
                      <h4 className="font-extrabold text-neutral-950 text-sm sm:text-base leading-snug">
                        {item.name}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {item.color && (
                          <span className="bg-neutral-100 px-2.5 py-0.5 rounded-lg font-bold text-neutral-700">
                            Color: {item.color}
                          </span>
                        )}
                        {item.size && (
                          <span className="bg-neutral-100 px-2.5 py-0.5 rounded-lg font-bold text-neutral-700">
                            Size: {item.size}
                          </span>
                        )}
                        <span className="text-neutral-400 font-mono text-[11px]">
                          Qty: {item.quantity}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="text-lg font-black text-neutral-950">
                      {item.subtotal.toLocaleString()} EGP
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      {item.originalPrice} EGP each
                    </div>
                  </div>
                </div>

                {/* Specific Admin Comment for this good */}
                {item.adminComment && (
                  <div className="ml-20 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-start gap-2.5 shadow-xs">
                    <MessageSquare className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-black text-amber-950">Admin Note for this Good:</span>{' '}
                      <span className="font-medium text-amber-900">{item.adminComment}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pricing Breakdown Footer */}
          <div className="pt-6 border-t border-neutral-200/80 space-y-2.5 text-xs">
            <div className="flex justify-between text-neutral-600">
              <span className="font-medium">Items Subtotal:</span>
              <span className="font-black text-neutral-950">{order.itemsSubtotal.toLocaleString()} EGP</span>
            </div>
            <div className="flex justify-between text-rose-600 font-bold">
              <span>Dynamic Concierge Fee ({order.dynamicFeePercent}%):</span>
              <span>+{order.dynamicFeeAmount.toLocaleString()} EGP</span>
            </div>
            <div className="pt-3 border-t border-neutral-200 flex justify-between text-base font-black text-neutral-950">
              <span>Total Cash:</span>
              <span>{order.totalCash.toLocaleString()} EGP</span>
            </div>
          </div>
        </div>
      </main>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
