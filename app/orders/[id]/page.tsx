'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Order, SystemSettings } from '@/lib/types';
import { Navbar } from '@/components/Navbar';
import { AuthModal } from '@/components/AuthModal';
import { OrderTimeline } from '@/components/OrderTimeline';
import { PaymentSection } from '@/components/PaymentSection';
import { SafeImage } from '@/components/SafeImage';
import { getClientOrders, saveClientOrder } from '@/lib/order-storage';
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
  Receipt,
  FileCheck,
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

      if (orderJson.success) {
        setOrder(orderJson.data);
        saveClientOrder(orderJson.data);
      } else {
        // Fallback to client localStorage so orders never get lost!
        const local = getClientOrders().find((o) => o.id === id);
        if (local) {
          setOrder(local);
          // Try to sync it back to server in background
          fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(local),
          }).catch(() => {});
        }
      }

      if (settingsJson.success) setSettings(settingsJson.data);
    } catch (err) {
      console.warn('Order fetch error, checking local storage:', err);
      const local = getClientOrders().find((o) => o.id === id);
      if (local) setOrder(local);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-9 h-9 border-3 border-[#8B5CF6] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            Loading SHEIN Order #{id}...
          </p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col">
        <Navbar onOpenAuth={() => setAuthOpen(true)} />
        <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-[#F5EDFF] text-[#8B5CF6] flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-neutral-900">Order Not Located</h2>
          <p className="text-xs text-neutral-500">
            We couldn&apos;t find order #{id}. It may have been created in another browser session.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#8B5CF6] text-white rounded-2xl text-xs font-bold shadow-sm"
          >
            Extract a New Cart
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-20">
      <Navbar onOpenAuth={() => setAuthOpen(true)} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Navigation Bar (Inspired by Screen 3 top buttons) */}
        <div className="flex items-center justify-between">
          <Link
            href="/orders"
            className="w-10 h-10 rounded-full border border-neutral-200 bg-white flex items-center justify-center text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50 transition-colors shadow-xs"
            title="Back to all orders"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchOrder}
              className="w-10 h-10 rounded-full border border-neutral-200 bg-white flex items-center justify-center text-neutral-600 hover:text-neutral-950 transition-colors shadow-xs cursor-pointer"
              title="Refresh order status"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Master Status & Timeline Card */}
        <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-neutral-100 shadow-[0_4px_24px_rgb(0,0,0,0.03)] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-6 border-b border-neutral-100">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
                  {order.id}
                </span>

                {order.status === 'PENDING_APPROVAL' && (
                  <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    Pending Admin Review
                  </span>
                )}
                {order.status === 'APPROVED_PENDING_PAYMENT' && (
                  <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-[#7C3AED] border border-purple-200">
                    Approved — Payment Unlocked
                  </span>
                )}
                {order.status === 'PAYMENT_UNDER_REVIEW' && (
                  <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                    Payment Under Review
                  </span>
                )}
                {order.status === 'PAID' && (
                  <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Paid &amp; Processing
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400">
                Created on {new Date(order.createdAt).toLocaleDateString()} at{' '}
                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Customer: {order.userName}
              </p>
            </div>

            <div className="text-left sm:text-right bg-neutral-50 sm:bg-transparent p-4 sm:p-0 rounded-2xl">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                Total Cash Due
              </span>
              <span className="text-2xl sm:text-3xl font-black text-neutral-950 tracking-tight">
                {order.totalCash.toLocaleString()}{' '}
                <span className="text-xs font-bold text-neutral-500">EGP</span>
              </span>
            </div>
          </div>

          {/* Stepper Timeline */}
          <OrderTimeline status={order.status} />

          {/* Live Notice Banners */}
          {order.status === 'PENDING_APPROVAL' && (
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-950 text-xs flex items-start gap-3">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold text-xs text-amber-950">Cart is with Admin for Verification</p>
                <p className="text-[11px] text-amber-800 leading-relaxed font-normal">
                  Our concierge supervisor is verifying stock and pricing on SHEIN. Once approved, you can pay using <strong>InstaPay</strong> or <strong>Vodafone Cash</strong>.
                </p>
              </div>
            </div>
          )}

          {order.status === 'PAYMENT_UNDER_REVIEW' && (
            <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80 text-purple-950 text-xs flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-[#8B5CF6] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold text-xs text-[#6D28D9]">Payment Receipt Received</p>
                <p className="text-[11px] text-neutral-600 leading-relaxed font-normal">
                  You submitted payment proof via <strong>{order.payment?.method === 'instapay' ? 'InstaPay' : 'Vodafone Cash'}</strong>. The admin is checking the screenshot and will confirm shortly.
                </p>
              </div>
            </div>
          )}

          {/* Admin Order Comment */}
          {order.adminComment && (
            <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200 text-xs text-neutral-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[#6D28D9] text-[11px]">
                <MessageSquare className="w-3.5 h-3.5 text-[#8B5CF6]" />
                <span>Admin Supervisor Note:</span>
              </div>
              <p className="text-xs text-neutral-700 italic pl-5">
                &ldquo;{order.adminComment}&rdquo;
              </p>
            </div>
          )}
        </div>

        {/* PAYMENT SECTION (Visible when approved or reviewing receipt) */}
        {(order.status === 'APPROVED_PENDING_PAYMENT' ||
          order.status === 'PAYMENT_UNDER_REVIEW' ||
          order.status === 'PAID') &&
          settings && (
            <PaymentSection
              order={order}
              settings={settings}
              onPaymentSubmitted={() => fetchOrder()}
            />
          )}

        {/* Item-by-Item Breakdown */}
        <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-neutral-100 shadow-[0_4px_24px_rgb(0,0,0,0.03)] space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <h3 className="font-extrabold text-neutral-900 text-base">
              Extracted Goods ({order.items.length})
            </h3>
            <span className="text-xs text-neutral-400">
              Subtotal: {order.itemsSubtotal.toLocaleString()} EGP
            </span>
          </div>

          <div className="space-y-3.5">
            {order.items.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-neutral-100 bg-[#FBFBFC] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-16 h-20 rounded-xl overflow-hidden bg-white shrink-0 border border-neutral-100">
                    <SafeImage
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-extrabold text-neutral-900 text-xs sm:text-sm line-clamp-1">
                      {item.name}
                    </h4>
                    <div className="flex flex-wrap gap-2 text-[11px] text-neutral-500">
                      {item.color && <span>Color: <strong>{item.color}</strong></span>}
                      {item.size && <span>Size: <strong>{item.size}</strong></span>}
                    </div>
                    {item.adminComment && (
                      <p className="text-[11px] text-[#7C3AED] font-semibold pt-1">
                        ✓ Note: {item.adminComment}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs text-neutral-400 block">
                    {item.quantity} x {item.originalPrice} EGP
                  </span>
                  <span className="font-extrabold text-sm text-neutral-900">
                    {item.subtotal.toLocaleString()} EGP
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Math Bar */}
          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4 text-neutral-600">
              <span>Items: <strong>{order.itemsSubtotal.toLocaleString()} EGP</strong></span>
              <span>•</span>
              <span className="text-[#7C3AED]">
                Concierge Fee ({order.dynamicFeePercent}%): <strong>+{order.dynamicFeeAmount.toLocaleString()} EGP</strong>
              </span>
            </div>
            <div className="font-black text-sm text-neutral-950">
              Total Cash: {order.totalCash.toLocaleString()} EGP
            </div>
          </div>
        </div>
      </main>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
