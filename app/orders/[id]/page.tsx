'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Order, SystemSettings } from '@/lib/types';
import { Navbar } from '@/components/Navbar';
import { AuthModal } from '@/components/AuthModal';
import { OrderTimeline } from '@/components/OrderTimeline';
import { PaymentSection } from '@/components/PaymentSection';
import { SafeImage } from '@/components/SafeImage';
import { useThemeLang } from '@/lib/theme-lang-context';
import { getClientOrders, saveClientOrder } from '@/lib/order-storage';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  ArrowLeft,
  ArrowRight,
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
  const { dir, lang, t } = useThemeLang();
  const isRtl = dir === 'rtl';

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
      <div className="min-h-screen bg-[#FBFBFC] dark:bg-[#0c0a0f] flex items-center justify-center transition-colors">
        <div className="text-center space-y-3">
          <div className="w-9 h-9 border-3 border-[#8B5CF6] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            {isRtl ? `جاري تحميل تفاصيل الطلب #${id}...` : `Loading SHEIN Order #${id}...`}
          </p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#FBFBFC] dark:bg-[#0c0a0f] flex flex-col text-neutral-900 dark:text-white transition-colors">
        <Navbar onOpenAuth={() => setAuthOpen(true)} />
        <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-purple-100/70 dark:bg-purple-950/40 text-[#8B5CF6] flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-neutral-950 dark:text-white">
            {isRtl ? 'لم يتم العثور على الطلب' : 'Order Not Located'}
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {isRtl
              ? `تعذر العثور على الطلب رقم #${id}. قد يكون تم إنشاؤه في جلسة أخرى.`
              : `We couldn't find order #${id}. It may have been created in another browser session.`}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-2xl text-xs font-black shadow-md shadow-purple-500/20"
          >
            {isRtl ? 'استخراج سلة جديدة' : 'Extract a New Cart'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFC] dark:bg-[#0c0a0f] text-neutral-900 dark:text-white pb-24 transition-colors relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-80 bg-gradient-to-b from-purple-400/8 to-transparent dark:from-purple-600/10 dark:to-transparent pointer-events-none blur-3xl -z-10" />

      <Navbar onOpenAuth={() => setAuthOpen(true)} />

      <motion.main
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6"
      >
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/orders"
            className="w-10 h-10 rounded-full border border-neutral-200/80 dark:border-[#2a243a] bg-white/90 dark:bg-[#151120] flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-[#201a2e] transition-colors shadow-xs"
            title={isRtl ? 'الرجوع إلى كل الطلبات' : 'Back to all orders'}
          >
            {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          </Link>

          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchOrder}
              className="w-10 h-10 rounded-full border border-neutral-200/80 dark:border-[#2a243a] bg-white/90 dark:bg-[#151120] flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white transition-colors shadow-xs cursor-pointer"
              title={isRtl ? 'تحديث حالة الطلب' : 'Refresh order status'}
            >
              <RefreshCw className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Master Status & Timeline Card (Liquid Glass) */}
        <div className="bg-white/90 dark:bg-[#13101c]/90 backdrop-blur-2xl rounded-[32px] p-6 sm:p-8 border border-neutral-200/70 dark:border-[#2a243a] shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-6 border-b border-neutral-100 dark:border-[#201a2d]">
            <div className="space-y-1.5 text-start">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-2xl sm:text-3xl font-black text-neutral-950 dark:text-white tracking-tight">
                  {order.id}
                </span>

                {order.status === 'PENDING_APPROVAL' && (
                  <span className="px-3.5 py-1 rounded-full text-xs font-black bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    {t.statusPending}
                  </span>
                )}
                {order.status === 'APPROVED_PENDING_PAYMENT' && (
                  <span className="px-3.5 py-1 rounded-full text-xs font-black bg-purple-50 dark:bg-purple-950/40 text-[#7C3AED] dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    {t.statusApproved}
                  </span>
                )}
                {order.status === 'PAYMENT_UNDER_REVIEW' && (
                  <span className="px-3.5 py-1 rounded-full text-xs font-black bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    {t.statusPaymentReview}
                  </span>
                )}
                {order.status === 'PAID' && (
                  <span className="px-3.5 py-1 rounded-full text-xs font-black bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {t.statusPaid}
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400 dark:text-neutral-500">
                {isRtl ? 'تم الإنشاء في' : 'Created on'} {new Date(order.createdAt).toLocaleDateString()} • {order.userName}
              </p>
            </div>

            <div className="text-start sm:text-end bg-neutral-50 dark:bg-[#1a1626] sm:bg-transparent p-4 sm:p-0 rounded-2xl">
              <span className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block">
                {t.totalCashLabel}
              </span>
              <span className="text-2xl sm:text-3xl font-black text-neutral-950 dark:text-white tracking-tight font-mono">
                {order.totalCash > 0 ? (
                  <>
                    {order.totalCash.toLocaleString()}{' '}
                    <span className="text-xs font-black text-[#8B5CF6]">EGP</span>
                  </>
                ) : (
                  <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                    {isRtl ? 'قيد تسعير المشرف' : 'Pending Admin Pricing'}
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Stepper Timeline */}
          <OrderTimeline status={order.status} />

          {/* Live Notice Banners */}
          {order.status === 'PENDING_APPROVAL' && (
            <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-950 dark:text-amber-200 text-xs flex items-start gap-3">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-start">
                <p className="font-black text-xs">
                  {isRtl ? 'الطلب قيد مراجعة وتدقيق المشرف' : 'Cart is with Admin for Verification'}
                </p>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed font-normal">
                  {isRtl
                    ? 'يقوم المشرف حالياً بالتأكد من توفر جميع المنتجات والمقاسات على شي إن. بمجرد الموافقة، سيتم فتح خيارات الدفع عبر فودافون كاش أو انستاباي.'
                    : 'Our concierge supervisor is verifying stock and pricing on SHEIN. Once approved, you can pay using InstaPay or Vodafone Cash.'}
                </p>
              </div>
            </div>
          )}

          {order.status === 'PAYMENT_UNDER_REVIEW' && (
            <div className="p-4 rounded-2xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-950 dark:text-purple-200 text-xs flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-[#8B5CF6] shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-start">
                <p className="font-black text-xs text-[#6D28D9] dark:text-purple-300">
                  {isRtl ? 'تم استلام إيصال الدفع بنجاح' : 'Payment Receipt Received'}
                </p>
                <p className="text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed font-normal">
                  {isRtl
                    ? `لقد قمت بإرسال إيصال التحويل عبر ${order.payment?.method === 'instapay' ? 'InstaPay' : 'Vodafone Cash'}. المشرف يقوم بمراجعته وسيتم تأكيد الطلب فوراً.`
                    : `You submitted payment proof via ${order.payment?.method === 'instapay' ? 'InstaPay' : 'Vodafone Cash'}. The admin is checking the screenshot and will confirm shortly.`}
                </p>
              </div>
            </div>
          )}

          {/* Admin Order Comment */}
          {order.adminComment && (
            <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/60 text-xs text-neutral-900 dark:text-neutral-100 space-y-1 text-start">
              <div className="flex items-center gap-1.5 font-black text-[#6D28D9] dark:text-purple-300 text-[11px]">
                <MessageSquare className="w-3.5 h-3.5 text-[#8B5CF6]" />
                <span>{isRtl ? 'ملاحظة المشرف:' : 'Admin Supervisor Note:'}</span>
              </div>
              <p className="text-xs text-neutral-700 dark:text-neutral-300 italic pl-5">
                &ldquo;{order.adminComment}&rdquo;
              </p>
            </div>
          )}
        </div>

        {/* PAYMENT SECTION */}
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
        <div className="bg-white/90 dark:bg-[#13101c]/90 backdrop-blur-2xl rounded-[32px] p-6 sm:p-8 border border-neutral-200/70 dark:border-[#2a243a] shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-[#201a2d]">
            <h3 className="font-black text-neutral-950 dark:text-white text-base">
              {isRtl ? `المنتجات المستخرجة (${order.items.length})` : `Extracted Goods (${order.items.length})`}
            </h3>
            <span className="text-xs text-neutral-400 dark:text-neutral-500 font-mono">
              {isRtl ? 'المجموع:' : 'Subtotal:'} {order.itemsSubtotal.toLocaleString()} EGP
            </span>
          </div>

          <div className="space-y-3.5">
            {order.items.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-neutral-200/70 dark:border-[#241e33] bg-[#FAFAFC] dark:bg-[#181423] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-16 h-20 rounded-xl overflow-hidden bg-white dark:bg-[#1f1a2d] shrink-0 border border-neutral-100 dark:border-[#2b243b]">
                    <SafeImage
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-0.5 text-start">
                    <h4 className="font-black text-neutral-950 dark:text-white text-xs sm:text-sm line-clamp-1">
                      {item.name}
                    </h4>
                    <div className="flex flex-wrap gap-2 text-[11px] text-neutral-500 dark:text-neutral-400">
                      {item.color && (
                        <span>
                          {isRtl ? 'اللون:' : 'Color:'} <strong>{item.color}</strong>
                        </span>
                      )}
                      {item.size && (
                        <span>
                          {isRtl ? 'المقاس:' : 'Size:'} <strong>{item.size}</strong>
                        </span>
                      )}
                    </div>
                    {item.adminComment && (
                      <p className="text-[11px] text-[#7C3AED] dark:text-purple-300 font-bold pt-1">
                        ✓ {item.adminComment}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-end shrink-0">
                  <span className="text-xs text-neutral-400 dark:text-neutral-500 block font-mono">
                    {item.quantity} x {item.originalPrice} EGP
                  </span>
                  <span className="font-black text-sm text-neutral-950 dark:text-white font-mono">
                    {item.subtotal.toLocaleString()} EGP
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Math Bar */}
          <div className="p-4 rounded-2xl bg-neutral-100/70 dark:bg-[#181423] border border-neutral-200/60 dark:border-[#2f2742] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4 text-neutral-600 dark:text-neutral-300">
              <span>
                {isRtl ? 'إجمالي المنتجات:' : 'Items:'}{' '}
                <strong className="font-mono">{order.itemsSubtotal.toLocaleString()} EGP</strong>
              </span>
              <span>•</span>
              <span className="text-[#7C3AED] dark:text-purple-300">
                {isRtl ? 'رسوم الخدمة' : 'Concierge Fee'} ({order.dynamicFeePercent}%):{' '}
                <strong className="font-mono">+{order.dynamicFeeAmount.toLocaleString()} EGP</strong>
              </span>
            </div>
            <div className="font-black text-sm text-neutral-950 dark:text-white font-mono">
              {isRtl ? 'المبلغ الإجمالي:' : 'Total Cash:'} {order.totalCash.toLocaleString()} EGP
            </div>
          </div>
        </div>
      </motion.main>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
