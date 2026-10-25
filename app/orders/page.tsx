'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Order } from '@/lib/types';
import { Navbar } from '@/components/Navbar';
import { AuthModal } from '@/components/AuthModal';
import { SafeImage } from '@/components/SafeImage';
import { getClientOrders, mergeAndDeduplicateOrders } from '@/lib/order-storage';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  CreditCard,
  FileCheck,
  ChevronRight,
  ArrowRight,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export default function UserOrdersPage() {
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    const clientSaved = getClientOrders();
    try {
      let url = '/api/orders';
      if (user?.id) {
        url = `/api/orders?userId=${encodeURIComponent(user.id)}&userEmail=${encodeURIComponent(user.email || '')}`;
      }
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        const merged = mergeAndDeduplicateOrders(json.data, clientSaved);
        setOrders(merged);
      } else {
        setOrders(clientSaved);
      }
    } catch (err) {
      console.warn('API fetch orders error, falling back to client storage:', err);
      setOrders(clientSaved);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-20">
      <Navbar onOpenAuth={() => setAuthOpen(true)} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div className="space-y-1">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">
              Customer Hub
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
              My Orders &amp; Carts
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500">
              Track approval status, review admin item notes, and settle via InstaPay or Vodafone Cash.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchOrders}
              className="p-3 bg-white border border-neutral-200/80 text-neutral-600 rounded-2xl hover:bg-neutral-50 transition-colors shadow-xs cursor-pointer"
              title="Refresh orders"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Link
              href="/"
              className="px-5 py-3 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-extrabold text-xs rounded-2xl shadow-sm transition-all inline-flex items-center gap-2 active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Extract New Cart</span>
            </Link>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-3.5">
          {loading ? (
            <div className="bg-white rounded-[32px] p-14 text-center border border-neutral-100 shadow-[0_4px_24px_rgb(0,0,0,0.03)] text-neutral-500">
              <div className="w-8 h-8 border-3 border-[#8B5CF6] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Loading your orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-[32px] p-14 text-center border border-neutral-100 shadow-[0_4px_24px_rgb(0,0,0,0.03)] space-y-5">
              <div className="w-16 h-16 rounded-3xl bg-[#F5EDFF] text-[#8B5CF6] flex items-center justify-center mx-auto">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-neutral-900">No Orders Saved Yet</h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  Paste any SHEIN cart share link on the home page to extract your goods and submit your order.
                </p>
              </div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-2xl text-xs font-bold shadow-sm transition-all active:scale-95"
              >
                Extract SHEIN Cart Now
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            orders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block bg-white rounded-3xl p-5 sm:p-6 border border-neutral-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:border-purple-200 transition-all duration-200 group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {/* Item preview thumbnails with SafeImage */}
                    <div className="flex -space-x-3 overflow-hidden p-1 shrink-0">
                      {order.items.slice(0, 3).map((it, idx) => (
                        <div
                          key={idx}
                          className="h-16 w-14 rounded-2xl overflow-hidden ring-2 ring-white shadow-xs bg-purple-50 shrink-0"
                        >
                          <SafeImage
                            src={it.image}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-base sm:text-lg text-neutral-900 group-hover:text-[#8B5CF6] transition-colors">
                          {order.id}
                        </span>
                        <span className="text-xs text-neutral-400 font-bold">
                          • {order.items.length} goods
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400">
                        Placed on {new Date(order.createdAt).toLocaleDateString()} at{' '}
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5 pt-3 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
                    <div className="text-left sm:text-right">
                      <div className="text-lg font-black text-neutral-900">
                        {order.totalCash.toLocaleString()}{' '}
                        <span className="text-xs font-bold text-neutral-500">EGP</span>
                      </div>
                      <div className="text-[11px] text-neutral-400">
                        Fee: {order.dynamicFeePercent}% ({order.dynamicFeeAmount} EGP)
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-3">
                      <OrderSimpleBadge status={order.status} />
                      <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-[#8B5CF6] transition-colors" />
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </main>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}

function OrderSimpleBadge({ status }: { status: string }) {
  if (status === 'PENDING_APPROVAL') {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
        <Clock className="w-3 h-3 text-amber-600" />
        Pending Review
      </span>
    );
  }
  if (status === 'APPROVED_PENDING_PAYMENT') {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-[#7C3AED] border border-purple-200">
        <CreditCard className="w-3 h-3 text-[#8B5CF6]" />
        Pay Now
      </span>
    );
  }
  if (status === 'PAYMENT_UNDER_REVIEW') {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
        <FileCheck className="w-3 h-3 text-indigo-600" />
        Receipt Sent
      </span>
    );
  }
  if (status === 'PAID') {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        Paid &amp; Processing
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-neutral-100 text-neutral-700">
      {status.replace(/_/g, ' ')}
    </span>
  );
}
