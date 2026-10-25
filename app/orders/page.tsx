'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Order } from '@/lib/types';
import { Navbar } from '@/components/Navbar';
import { AuthModal } from '@/components/AuthModal';
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
    try {
      const url = user?.id ? `/api/orders?userId=${user.id}` : '/api/orders';
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) setOrders(json.data);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  return (
    <div className="min-h-screen bg-neutral-100/60 pb-20">
      <Navbar onOpenAuth={() => setAuthOpen(true)} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                Customer Portal
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-neutral-950 tracking-tight">
              My Orders & Carts
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
              Track your SHEIN cart approval, review admin notes, and settle payments with InstaPay or Vodafone Cash.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchOrders}
              className="p-3 bg-white border border-neutral-200 text-neutral-600 rounded-2xl hover:bg-neutral-50 transition-colors shadow-xs cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Link
              href="/"
              className="px-6 py-3 bg-neutral-950 hover:bg-neutral-800 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-black/10 transition-all inline-flex items-center gap-2 active:scale-95"
            >
              <ShoppingBag className="w-4 h-4 text-rose-400" />
              Extract New Cart
            </Link>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-3xl p-14 text-center border border-neutral-200 text-neutral-500 font-medium">
              <div className="w-8 h-8 border-3 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs uppercase font-black tracking-wider text-neutral-400">Loading your orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-3xl p-14 text-center border border-neutral-200 space-y-5">
              <div className="w-16 h-16 rounded-3xl bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-neutral-900">No Orders Yet</h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  Paste any SHEIN cart share link on the home page to extract your goods and submit your first order.
                </p>
              </div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-black shadow-lg shadow-rose-600/20 transition-all active:scale-95"
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
                className="block bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-xs hover:shadow-xl hover:border-neutral-300 transition-all duration-300 group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-3 overflow-hidden p-1 flex-shrink-0">
                      {order.items.slice(0, 3).map((it, idx) => (
                        <img
                          key={idx}
                          src={it.image}
                          alt=""
                          className="inline-block h-16 w-13 rounded-2xl object-cover ring-2 ring-white shadow-xs group-hover:scale-105 transition-transform"
                        />
                      ))}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-lg text-neutral-950 group-hover:text-rose-600 transition-colors">
                          {order.id}
                        </span>
                        <span className="text-xs text-neutral-400 font-bold">
                          • {order.items.length} goods
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400">
                        {new Date(order.createdAt).toLocaleDateString()} at{' '}
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
                    <div className="text-left sm:text-right">
                      <div className="text-xl font-black text-neutral-950">
                        {order.totalCash.toLocaleString()}{' '}
                        <span className="text-xs font-bold text-neutral-500">EGP</span>
                      </div>
                      <div className="text-[11px] text-neutral-400">
                        Includes {order.dynamicFeePercent}% service fee
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-3">
                      {order.status === 'PENDING_APPROVAL' && (
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-amber-50 text-amber-900 border border-amber-300 animate-pulse">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          Pending Review
                        </span>
                      )}
                      {order.status === 'APPROVED_PENDING_PAYMENT' && (
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-blue-50 text-blue-900 border border-blue-300">
                          <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                          Pay via InstaPay / VF Cash
                        </span>
                      )}
                      {order.status === 'PAYMENT_UNDER_REVIEW' && (
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-purple-50 text-purple-900 border border-purple-300">
                          <FileCheck className="w-3.5 h-3.5 text-purple-600" />
                          Receipt Under Review
                        </span>
                      )}
                      {order.status === 'PAID' && (
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-emerald-50 text-emerald-900 border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Confirmed
                        </span>
                      )}
                      {order.status === 'REJECTED' && (
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-rose-50 text-rose-900 border border-rose-300">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          Rejected
                        </span>
                      )}

                      <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>

                {/* Supervisor comment preview */}
                {order.adminComment && (
                  <div className="mt-4 pt-3.5 border-t border-neutral-100 text-xs text-rose-950 bg-rose-50/70 p-3 rounded-2xl border border-rose-200/60 flex items-start gap-2">
                    <span className="font-black text-rose-900">Admin Note:</span>
                    <span className="font-medium text-rose-950">&ldquo;{order.adminComment}&rdquo;</span>
                  </div>
                )}
              </Link>
            ))
          )}
        </div>
      </main>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
