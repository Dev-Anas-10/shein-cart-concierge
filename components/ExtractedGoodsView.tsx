'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExtractedCartResult, GoodItem } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { useThemeLang } from '@/lib/theme-lang-context';
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
  AlertCircle,
  Code2,
  Copy,
  Check,
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
  const { dir, lang } = useThemeLang();
  const isRtl = dir === 'rtl';

  const handleBack = onBack || onReset || (() => {});
  const [items, setItems] = useState<GoodItem[]>(data.items);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  // Customer contact info
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [shippingAddress, setShippingAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const productsJsonString = JSON.stringify(
    data.sheinProducts ||
      items.map((it) => ({
        goods_id: it.id,
        goods_sn: it.sku || '',
        name: it.name,
        image: it.image,
        original_price: it.sourceOriginalPrice || it.sourcePrice || String(it.originalPrice),
        sale_price: it.sourcePrice || String(it.originalPrice),
        currency: it.sourceCurrency || 'SAR',
        selected_variant: [it.color, it.size].filter(Boolean).join(' / '),
        sku_code: it.sku || '',
        sold_out: it.status === 'out_of_stock',
      })),
    null,
    2
  );

  const handleCopyJson = () => {
    navigator.clipboard.writeText(productsJsonString);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

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
      alert(isRtl ? 'يجب أن تحتوي السلة على منتج واحد على الأقل.' : 'Your cart must contain at least one item.');
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
      setError(
        isRtl
          ? 'يرجى إدخال رقم هاتفك للتواصل وتأكيد الدفع (فودافون كاش أو انستاباي).'
          : 'Please provide your phone number for InstaPay / Vodafone Cash contact.'
      );
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

      // Save order in client-side storage for persistence
      saveClientOrder(resJson.data);

      onOrderCreated(resJson.data.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const listVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
  };

  const itemCardVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const } },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Top Banner (Liquid Glass style) */}
      <div className="relative rounded-[32px] p-6 sm:p-8 bg-gradient-to-br from-purple-100/90 via-purple-50/70 to-pink-50/60 dark:from-[#1b1528] dark:via-[#161222] dark:to-[#1a1322] border border-purple-200/70 dark:border-purple-900/40 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
        <div className="space-y-2 text-center md:text-start relative z-10">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className="px-3 py-1 rounded-full bg-white dark:bg-[#282038] text-[#7C3AED] dark:text-purple-300 text-[11px] font-black uppercase tracking-wider shadow-xs border border-purple-200/50 dark:border-purple-800/50">
              {isRtl ? 'سلة شي إن المستخرجة' : 'Extracted Cart'}
            </span>
            <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
              Code: {data.shareCode}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-neutral-950 dark:text-white tracking-tight">
            {data.title}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 max-w-xl font-medium">
            {data.description}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center md:justify-end gap-2.5 relative z-10">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleBack}
            className="px-3.5 py-2 bg-white dark:bg-[#221c2e] hover:bg-neutral-50 dark:hover:bg-[#2a243a] text-neutral-800 dark:text-neutral-200 font-extrabold text-xs rounded-2xl border border-neutral-200/80 dark:border-[#2f2742] shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            {isRtl ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
            <span>{isRtl ? 'سلة أخرى' : 'Another Cart'}</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowJsonModal(true)}
            className="px-3.5 py-2 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-[#7C3AED] dark:text-purple-300 font-extrabold text-xs rounded-2xl border border-purple-200/80 dark:border-purple-800/80 shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>{isRtl ? 'بيانات JSON' : 'JSON Data'}</span>
          </motion.button>

          <motion.a
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            href={data.landingUrl || data.extractedLink}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#7C3AED] hover:to-[#6D28D9] text-white font-extrabold text-xs rounded-2xl shadow-sm flex items-center gap-1.5"
          >
            <span>{isRtl ? 'فتح في SHEIN' : 'SHEIN Link'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </motion.a>
        </div>
      </div>

      {/* Main Grid: Goods List (left) + Cost Summary (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Goods Items (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-black text-neutral-950 dark:text-white text-lg">
              {isRtl ? `منتجات السلة (${items.length})` : `Items in Cart (${items.length})`}
            </h3>
            <span className="text-xs text-neutral-400 dark:text-neutral-500 font-medium flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>{isRtl ? 'تم التحقق من الأسعار والمقاسات' : 'Verified with SHEIN'}</span>
            </span>
          </div>

          <motion.div
            variants={listVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {items.map((item) => (
              <motion.div
                key={item.id}
                variants={itemCardVariants}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
                className="bg-white/90 dark:bg-[#13101c]/90 backdrop-blur-md rounded-3xl p-5 border border-neutral-200/70 dark:border-[#2a243a] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-5 hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
              >
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="w-20 h-24 rounded-2xl overflow-hidden bg-purple-50 dark:bg-purple-950/40 shrink-0 border border-neutral-100 dark:border-[#2a243a]">
                    <SafeImage
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-black text-neutral-950 dark:text-white text-sm line-clamp-2">
                      {item.name}
                    </h4>
                    <div className="flex flex-wrap gap-2 text-[11px] text-neutral-500 dark:text-neutral-400">
                      {item.color && (
                        <span className="bg-neutral-100 dark:bg-[#1f1a2c] px-2 py-0.5 rounded-md border border-neutral-200/60 dark:border-[#2e263d]">
                          {item.color}
                        </span>
                      )}
                      {item.size && (
                        <span className="bg-neutral-100 dark:bg-[#1f1a2c] px-2 py-0.5 rounded-md border border-neutral-200/60 dark:border-[#2e263d]">
                          {isRtl ? `المقاس: ${item.size}` : `Size: ${item.size}`}
                        </span>
                      )}
                      {item.sku && (
                        <span className="font-mono text-neutral-400 dark:text-neutral-500">
                          {item.sku}
                        </span>
                      )}
                    </div>
                    <div className="pt-2 flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black text-purple-700 dark:text-purple-300 font-mono">
                          {item.originalPrice.toLocaleString()} EGP
                        </span>
                        {item.sourcePrice && (
                          <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 font-mono bg-neutral-100 dark:bg-[#1c1728] px-2 py-0.5 rounded-md border border-neutral-200/50 dark:border-[#2b243b]">
                            {item.sourcePrice} {item.sourceCurrency || 'SAR'}
                            {item.sourceOriginalPrice && item.sourceOriginalPrice !== item.sourcePrice && (
                              <span className="line-through text-neutral-400 mx-1 text-[10px]">
                                {item.sourceOriginalPrice}
                              </span>
                            )}
                          </span>
                        )}
                      </div>

                      {item.originalUrl && (
                        <a
                          href={item.originalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-bold text-[#8B5CF6] hover:text-[#7C3AED] flex items-center gap-0.5 transition-colors"
                        >
                          <span>{isRtl ? 'عرض في شي إن' : 'View on SHEIN'}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Quantity & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-neutral-100 dark:border-[#201a2d]">
                  <div className="flex items-center border border-neutral-200/80 dark:border-[#2f2742] rounded-xl bg-neutral-50 dark:bg-[#181423] p-0.5">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(item.id, -1)}
                      className="w-7 h-7 flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-white dark:hover:bg-[#251f33] rounded-lg transition-colors cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center text-xs font-black text-neutral-950 dark:text-white font-mono">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(item.id, 1)}
                      className="w-7 h-7 flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-white dark:hover:bg-[#251f33] rounded-lg transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="text-right min-w-[80px]">
                    <span className="font-black text-base text-neutral-950 dark:text-white font-mono">
                      {item.subtotal.toLocaleString()} EGP
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-2 text-neutral-300 dark:text-neutral-600 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl transition-colors cursor-pointer"
                    title={isRtl ? 'حذف المنتج' : 'Remove item'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Right: Cost & Payment Breakdown Card (Liquid Glass) */}
        <div className="space-y-4">
          <div className="bg-white/90 dark:bg-[#13101c]/90 backdrop-blur-md rounded-[32px] p-6 border border-neutral-200/70 dark:border-[#2a243a] shadow-xs space-y-6 sticky top-24">
            <h3 className="font-black text-neutral-950 dark:text-white text-lg">
              {isRtl ? 'تفاصيل الحساب والدفع' : 'Payment & Fees Summary'}
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-300">
                <span>{isRtl ? `إجمالي المنتجات (${items.length} قطع)` : `Items Subtotal (${items.length} goods)`}</span>
                <span className="font-black text-neutral-950 dark:text-white font-mono">
                  {itemsSubtotal.toLocaleString()} EGP
                </span>
              </div>

              <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-300">
                <span className="flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-[#8B5CF6]" />
                  <span>{isRtl ? `رسوم خدمة Concierge (${data.dynamicFeePercent}%)` : `Dynamic Concierge Fee (${data.dynamicFeePercent}%)`}</span>
                </span>
                <span className="font-black text-[#7C3AED] dark:text-purple-300 font-mono">
                  +{dynamicFeeAmount.toLocaleString()} EGP
                </span>
              </div>

              <div className="pt-3 border-t border-neutral-100 dark:border-[#221c2d] flex items-center justify-between">
                <div>
                  <span className="text-xs text-neutral-400 dark:text-neutral-500 block font-medium">
                    {isRtl ? 'المبلغ الإجمالي بالجنيه' : 'Total Cash Required'}
                  </span>
                  <span className="text-2xl font-black text-neutral-950 dark:text-white">
                    {totalCash > 0 ? (
                      <>
                        {totalCash.toLocaleString()}{' '}
                        <span className="text-xs font-bold text-neutral-500">EGP</span>
                      </>
                    ) : (
                      <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                        {isRtl ? 'يحدده المشرف بعد فحص الرابط' : 'Set by admin upon review'}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Workflow steps badge */}
            <div className="p-3.5 bg-neutral-50 dark:bg-[#181423] rounded-2xl border border-neutral-200/60 dark:border-[#2f2742] space-y-2 text-xs">
              <div className="flex items-center gap-2 font-black text-neutral-800 dark:text-neutral-200">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>{isRtl ? 'الخطوة التالية: مراجعة المشرف' : 'Next: Admin Approval'}</span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed font-normal">
                {isRtl
                  ? 'بمجرد إرسال طلبك سيكون "قيد المراجعة". يقوم المشرف بالتأكد من توفر مقاساتك وفتح رابط الدفع عبر فودافون كاش أو انستاباي.'
                  : 'Once submitted, your order will be Pending Approval. The admin verifies availability and unlocks payment via InstaPay or Vodafone Cash.'}
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => {
                if (!user) {
                  onOpenAuth();
                } else {
                  setShowCheckoutModal(true);
                }
              }}
              className="w-full py-4 bg-gradient-to-r from-[#8B5CF6] via-[#7C3AED] to-[#6D28D9] hover:from-[#7C3AED] hover:to-[#5B21B6] text-white font-black text-sm rounded-2xl shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Receipt className="w-4 h-4" />
              <span>{isRtl ? 'إرسال الطلب لمراجعة المشرف' : 'Submit Order for Admin Review'}</span>
              {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Checkout Contact Drawer / Modal with AnimatePresence */}
      <AnimatePresence>
        {showCheckoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-md bg-white dark:bg-[#14111d] rounded-3xl shadow-2xl border border-neutral-200/80 dark:border-[#2a243a] overflow-hidden"
            >
              <div className="p-6 bg-neutral-50 dark:bg-[#1a1626] border-b border-neutral-200/60 dark:border-[#292237] flex items-center justify-between">
                <div>
                  <h3 className="font-black text-neutral-950 dark:text-white text-lg">
                    {isRtl ? 'بيانات التواصل والتوصيل' : 'Contact & Delivery'}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {isRtl
                      ? 'أكد رقم هاتفك لإتاحة الدفع عبر فودافون كاش أو انستاباي.'
                      : 'Confirm phone number for InstaPay / Vodafone Cash payment.'}
                  </p>
                </div>
                <button
                  onClick={() => setShowCheckoutModal(false)}
                  className="p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-white rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitOrder} className="p-6 space-y-4 text-xs">
                {error && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 rounded-xl text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="text-start">
                  <label className="block font-black text-neutral-700 dark:text-neutral-300 mb-1">
                    {isRtl ? 'اسم العميل' : 'Customer Name'}
                  </label>
                  <div className="relative">
                    <User className={`w-4 h-4 absolute top-1/2 -translate-y-1/2 text-neutral-400 ${isRtl ? 'right-3.5' : 'left-3.5'}`} />
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder={isRtl ? 'اسمك الكريم' : 'Full Name'}
                      className={`w-full py-2.5 bg-neutral-50 dark:bg-[#1a1626] border border-neutral-200/80 dark:border-[#2f2742] rounded-xl focus:bg-white dark:focus:bg-[#201a2e] focus:outline-none focus:ring-2 focus:ring-purple-600 text-neutral-900 dark:text-white ${
                        isRtl ? 'pr-10 pl-3.5' : 'pl-10 pr-3.5'
                      }`}
                    />
                  </div>
                </div>

                <div className="text-start">
                  <label className="block font-black text-neutral-700 dark:text-neutral-300 mb-1">
                    {isRtl
                      ? 'رقم الموبايل في مصر (InstaPay أو Vodafone Cash)'
                      : 'Egyptian Mobile Phone (InstaPay / Vodafone Cash)'}
                  </label>
                  <div className="relative">
                    <Phone className={`w-4 h-4 absolute top-1/2 -translate-y-1/2 text-neutral-400 ${isRtl ? 'right-3.5' : 'left-3.5'}`} />
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="010XXXXXXXX"
                      className={`w-full py-2.5 bg-neutral-50 dark:bg-[#1a1626] border border-neutral-200/80 dark:border-[#2f2742] rounded-xl focus:bg-white dark:focus:bg-[#201a2e] focus:outline-none focus:ring-2 focus:ring-purple-600 font-mono text-neutral-900 dark:text-white ${
                        isRtl ? 'pr-10 pl-3.5' : 'pl-10 pr-3.5'
                      }`}
                    />
                  </div>
                </div>

                <div className="text-start">
                  <label className="block font-black text-neutral-700 dark:text-neutral-300 mb-1">
                    {isRtl ? 'عنوان التوصيل في مصر' : 'Delivery Address in Egypt'}
                  </label>
                  <div className="relative">
                    <MapPin className={`w-4 h-4 absolute top-3 text-neutral-400 ${isRtl ? 'right-3.5' : 'left-3.5'}`} />
                    <textarea
                      rows={2}
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder={isRtl ? 'مثال: عمارة 12، شارع 9، المعادي، القاهرة' : 'e.g. Building 12, Street 9, Maadi, Cairo'}
                      className={`w-full py-2.5 bg-neutral-50 dark:bg-[#1a1626] border border-neutral-200/80 dark:border-[#2f2742] rounded-xl focus:bg-white dark:focus:bg-[#201a2e] focus:outline-none focus:ring-2 focus:ring-purple-600 text-neutral-900 dark:text-white ${
                        isRtl ? 'pr-10 pl-3.5' : 'pl-10 pr-3.5'
                      }`}
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-100 dark:border-[#241e30] flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-neutral-400 dark:text-neutral-500 block">
                      {isRtl ? 'المجموع المستحق' : 'Total Due'}
                    </span>
                    <span className="font-black text-lg text-neutral-950 dark:text-white font-mono">
                      {totalCash.toLocaleString()} EGP
                    </span>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md shadow-purple-500/20 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>{isRtl ? 'جاري الإرسال...' : 'Submitting...'}</span>
                      </>
                    ) : (
                      <span>{isRtl ? 'تأكيد وإرسال الطلب' : 'Confirm Order'}</span>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* JSON Viewer Modal */}
        {showJsonModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-2xl bg-white dark:bg-[#14101e] rounded-3xl p-6 border border-neutral-200 dark:border-[#2f2742] shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-[#241e30]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-[#7C3AED] dark:text-purple-300 flex items-center justify-center">
                    <Code2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-neutral-900 dark:text-white">
                      {isRtl ? 'بيانات المنتجات المستخرجة (JSON)' : 'Extracted Products JSON'}
                    </h3>
                    <p className="text-[10px] text-neutral-400">
                      {isRtl ? `${items.length} منتجات مهيكلة حسب مواصفات شي إن الرسمية` : `${items.length} products structured per SHEIN specs`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyJson}
                    className="px-3 py-1.5 bg-neutral-100 dark:bg-[#1f192b] hover:bg-neutral-200 dark:hover:bg-[#2b233a] text-xs font-bold text-neutral-700 dark:text-neutral-200 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedJson ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-500">{isRtl ? 'تم النسخ!' : 'Copied!'}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'نسخ JSON' : 'Copy JSON'}</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setShowJsonModal(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#1f192b] transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="relative">
                <pre className="max-h-[380px] overflow-auto p-4 rounded-2xl bg-neutral-950 text-neutral-100 text-xs font-mono leading-relaxed border border-neutral-800 dir-ltr text-left selection:bg-purple-500 selection:text-white">
                  {productsJsonString}
                </pre>
              </div>

              <div className="flex items-center justify-end pt-2 border-t border-neutral-100 dark:border-[#241e30]">
                <button
                  onClick={() => setShowJsonModal(false)}
                  className="px-4 py-2 bg-neutral-100 dark:bg-[#1f192b] hover:bg-neutral-200 dark:hover:bg-[#2a233a] text-xs font-bold text-neutral-800 dark:text-neutral-200 rounded-xl transition-all cursor-pointer"
                >
                  {isRtl ? 'إغلاق' : 'Close'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
