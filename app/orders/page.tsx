'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useThemeLang } from '@/lib/theme-lang-context';
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
  ChevronLeft,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Lock,
  User,
  ShieldCheck,
} from 'lucide-react';

export default function UserOrdersPage() {
  const { user } = useAuth();
  const { t, dir } = useThemeLang();
  const [authOpen, setAuthOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    // Strict multi-user privacy: Never fetch or show orders if not logged in!
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const clientSaved = getClientOrders(user.id, user.email);
    try {
      const url = `/api/orders?userId=${encodeURIComponent(user.id)}&userEmail=${encodeURIComponent(user.email || '')}`;
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_APPROVAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Clock className="w-3.5 h-3.5" />
            {t.statusPending}
          </span>
        );
      case 'APPROVED_PENDING_PAYMENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 dark:bg-purple-950/40 text-[#7C3AED] dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <CreditCard className="w-3.5 h-3.5" />
            {t.statusApproved}
          </span>
        );
      case 'PAYMENT_UNDER_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <FileCheck className="w-3.5 h-3.5" />
            {t.statusPaymentReview}
          </span>
        );
      case 'PAID':
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {status === 'PAID' ? t.statusPaid : t.statusProcessing}
          </span>
        );
      case 'SHIPPED':
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {status === 'SHIPPED' ? t.statusShipped : t.statusCompleted}
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <XCircle className="w-3.5 h-3.5" />
            {t.statusRejected}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
            {status.replace(/_/g, ' ')}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#0c0a0f] text-neutral-900 dark:text-white pb-20 transition-colors">
      <Navbar onOpenAuth={() => setAuthOpen(true)} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div className="space-y-1 text-center sm:text-start">
            <span className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block">
              {t.customerHub}
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              {t.myOrdersTitle}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
              {t.myOrdersDesc}
            </p>
          </div>

          <div className="flex items-center justify-center sm:justify-end gap-3">
            <button
              onClick={fetchOrders}
              className="p-3 bg-white dark:bg-[#14121a] border border-neutral-200/80 dark:border-[#2a2538] text-neutral-600 dark:text-neutral-300 rounded-2xl hover:bg-neutral-50 dark:hover:bg-[#221e2d] transition-colors shadow-xs cursor-pointer"
              title={t.refresh}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Link
              href="/"
              className="px-5 py-3 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-extrabold text-xs rounded-2xl shadow-sm transition-all inline-flex items-center gap-2 active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{t.extractNewCart}</span>
            </Link>
          </div>
        </div>

        {/* Orders List / Login Gate */}
        <div className="space-y-3.5">
          {!user ? (
            <div className="bg-white dark:bg-[#14121a] rounded-[32px] p-10 sm:p-14 text-center border border-neutral-100 dark:border-[#2a2538] shadow-[0_4px_24px_rgb(0,0,0,0.03)] space-y-6 max-w-lg mx-auto">
              <div className="w-18 h-18 rounded-3xl bg-[#F5EDFF] dark:bg-purple-950/40 text-[#8B5CF6] flex items-center justify-center mx-auto shadow-xs">
                <Lock className="w-9 h-9" />
              </div>
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F5EDFF] dark:bg-purple-950/60 text-[#8B5CF6] dark:text-purple-300 text-[11px] font-black uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{t.privacyBadge}</span>
                </div>
                <h3 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
                  {t.loginRequiredTitle}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto leading-relaxed">
                  {t.loginRequiredDesc}
                </p>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => setAuthOpen(true)}
                  className="w-full sm:w-auto px-7 py-3.5 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-2xl text-xs font-black shadow-md shadow-purple-500/20 transition-all active:scale-95 cursor-pointer inline-flex items-center justify-center gap-2"
                >
                  <User className="w-4 h-4" />
                  <span>{t.signInOrRegister}</span>
                </button>
                <Link
                  href="/"
                  className="w-full sm:w-auto px-6 py-3.5 bg-neutral-100 dark:bg-[#221e2d] hover:bg-neutral-200 dark:hover:bg-[#2e293d] text-neutral-700 dark:text-neutral-300 rounded-2xl text-xs font-bold transition-all text-center"
                >
                  {t.homeBtn}
                </Link>
              </div>
            </div>
          ) : loading ? (
            <div className="bg-white dark:bg-[#14121a] rounded-[32px] p-14 text-center border border-neutral-100 dark:border-[#2a2538] shadow-[0_4px_24px_rgb(0,0,0,0.03)] text-neutral-500 dark:text-neutral-400">
              <div className="w-8 h-8 border-3 border-[#8B5CF6] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                {t.loadingOrders}
              </p>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white dark:bg-[#14121a] rounded-[32px] p-14 text-center border border-neutral-100 dark:border-[#2a2538] shadow-[0_4px_24px_rgb(0,0,0,0.03)] space-y-5">
              <div className="w-16 h-16 rounded-3xl bg-[#F5EDFF] dark:bg-purple-950/40 text-[#8B5CF6] flex items-center justify-center mx-auto">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-neutral-900 dark:text-white">
                  {t.noOrdersTitle}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
                  {t.noOrdersDesc}
                </p>
              </div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-2xl text-xs font-bold shadow-sm transition-all active:scale-95"
              >
                <span>{t.extractNowBtn}</span>
                {dir === 'rtl' ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </Link>
            </div>
          ) : (
            orders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block bg-white dark:bg-[#14121a] rounded-3xl p-5 sm:p-6 border border-neutral-100 dark:border-[#2a2538] shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:border-purple-200 dark:hover:border-purple-800 transition-all duration-200 group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {/* Item preview thumbnails with SafeImage */}
                    <div className="flex -space-x-3 overflow-hidden p-1 shrink-0">
                      {order.items.slice(0, 3).map((it, idx) => (
                        <div
                          key={idx}
                          className="h-16 w-14 rounded-2xl overflow-hidden ring-2 ring-white dark:ring-[#14121a] shadow-xs bg-purple-50 dark:bg-purple-950/40 shrink-0"
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
                        <span className="font-mono font-black text-base sm:text-lg text-neutral-900 dark:text-white group-hover:text-[#8B5CF6] transition-colors">
                          {order.id}
                        </span>
                        <span className="text-xs text-neutral-400 dark:text-neutral-500">
                          • {order.items.length} {t.goodsCount}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                        <span>
                          {t.placedOn} {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                        <span>•</span>
                        <span>
                          {t.feeLabel} {order.dynamicFeePercent}% ({order.dynamicFeeAmount} EGP)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5 pt-3 sm:pt-0 border-t sm:border-t-0 border-neutral-100 dark:border-[#2a2538]">
                    <div className="text-start sm:text-end">
                      <span className="text-[11px] text-neutral-400 dark:text-neutral-500 block">
                        {t.totalCashLabel}
                      </span>
                      <div className="font-black text-lg sm:text-xl text-neutral-900 dark:text-white">
                        {order.totalCash.toLocaleString()}{' '}
                        <span className="text-xs font-extrabold text-[#8B5CF6]">EGP</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {getStatusBadge(order.status)}
                      <div className="text-neutral-400 group-hover:text-[#8B5CF6] transition-colors">
                        {dir === 'rtl' ? (
                          <ChevronLeft className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                      </div>
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
