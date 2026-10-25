'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { extractSheinUrl } from '@/lib/shein-extractor';
import { ExtractedCartResult } from '@/lib/types';
import { useThemeLang } from '@/lib/theme-lang-context';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Search,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  CreditCard,
  Zap,
} from 'lucide-react';

interface CartExtractorCardProps {
  onExtracted: (result: ExtractedCartResult) => void;
  currentDynamicFeePercent: number;
}

export function CartExtractorCard({ onExtracted, currentDynamicFeePercent }: CartExtractorCardProps) {
  const { t, dir } = useThemeLang();
  const [inputText, setInputText] = useState('');
  const [estimatedSubtotal, setEstimatedSubtotal] = useState('');
  const [estimatedItemsCount, setEstimatedItemsCount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectedUrl, setDetectedUrl] = useState<string | null>(null);

  const handleTextChange = (val: string) => {
    setInputText(val);
    setError(null);
    const link = extractSheinUrl(val);
    setDetectedUrl(link);
  };

  const handleExtract = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) {
      setError(
        dir === 'rtl'
          ? 'يرجى لصق نص مشاركة السلة من تطبيق شي إن أو الرابط أولاً.'
          : 'Please paste your SHEIN cart share text or URL.'
      );
      return;
    }

    const cleanUrl = extractSheinUrl(inputText);
    if (!cleanUrl) {
      setError(
        dir === 'rtl'
          ? 'لم يتم العثور على رابط شي إن صالح. تأكد من أن الرسالة تحتوي على رابط SHEIN.'
          : 'No valid SHEIN URL detected. Make sure your message contains a SHEIN link.'
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText.trim(),
          dynamicFeePercent: currentDynamicFeePercent,
          estimatedSubtotal: estimatedSubtotal ? Number(estimatedSubtotal) : undefined,
          estimatedItemsCount: estimatedItemsCount ? Number(estimatedItemsCount) : undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(
          json.error ||
            (dir === 'rtl'
              ? 'تعذر استخراج المنتجات من رابط شي إن.'
              : 'Failed to extract goods from SHEIN link.')
        );
      }

      onExtracted(json.data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while connecting to SHEIN.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative rounded-[32px] p-6 sm:p-10 bg-white/90 dark:bg-[#13101c]/90 backdrop-blur-2xl border border-neutral-200/70 dark:border-[#2a243a] shadow-[0_12px_45px_rgb(0,0,0,0.05)] dark:shadow-[0_12px_45px_rgb(0,0,0,0.5)] space-y-6 transition-colors overflow-hidden"
    >
      {/* Decorative ambient gradient backdrop */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-purple-500/10 dark:bg-purple-600/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-rose-500/10 dark:bg-rose-600/10 blur-3xl pointer-events-none" />

      {/* Top Graphic Header */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6 pb-2">
        <div className="space-y-2 text-center sm:text-start">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100/70 dark:bg-purple-950/60 text-[#7C3AED] dark:text-purple-300 text-[11px] font-black uppercase tracking-wider border border-purple-200/50 dark:border-purple-800/50">
              <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" />
              {t.extractorBadge}
            </span>
            {currentDynamicFeePercent > 0 && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-[#201a2d] text-neutral-600 dark:text-neutral-400 text-[11px] font-semibold border border-neutral-200/60 dark:border-[#2f2742]">
                +{currentDynamicFeePercent}% {t.feeLabel}
              </span>
            )}
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
            {t.extractorTitle}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-lg leading-relaxed">
            {t.extractorDesc}
          </p>
        </div>

        {/* Minimalist Liquid Vector Illustration Badge */}
        <motion.div
          whileHover={{ scale: 1.05, rotate: 2 }}
          transition={{ duration: 0.3 }}
          className="relative w-28 h-28 shrink-0 flex items-center justify-center cursor-default"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-200/60 to-purple-100/30 dark:from-purple-900/40 dark:to-purple-950/20 rounded-3xl scale-95 blur-xs" />
          <svg className="w-20 h-20 relative z-10 drop-shadow-sm" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="38" fill="#E9D5FF" className="dark:fill-[#2d2242]" opacity="0.7" />
            <rect x="25" y="42" width="50" height="32" rx="6" fill="#FFFFFF" className="dark:fill-[#1b1726]" stroke="#8B5CF6" strokeWidth="2.5" />
            <path d="M40 74L36 84H64L60 74" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M20 84H80" stroke="#8B5CF6" strokeWidth="3" strokeLinecap="round" />
            <circle cx="50" cy="56" r="6" fill="#A855F7" />
            <path d="M68 28C74 34 68 46 76 50" stroke="#EC4899" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </motion.div>
      </div>

      {/* Pill Feature Badges */}
      <div className="relative z-10 flex flex-wrap items-center gap-2 pt-1">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-neutral-100/80 dark:bg-[#1a1626] text-neutral-700 dark:text-neutral-300 border border-neutral-200/70 dark:border-[#2f2742]">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          {t.autoLinkBadge}
        </span>
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-neutral-100/80 dark:bg-[#1a1626] text-neutral-700 dark:text-neutral-300 border border-neutral-200/70 dark:border-[#2f2742]">
          <CreditCard className="w-3.5 h-3.5 text-purple-500" />
          {t.paymentBadge}
        </span>
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-neutral-100/80 dark:bg-[#1a1626] text-neutral-700 dark:text-neutral-300 border border-neutral-200/70 dark:border-[#2f2742]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          {t.adminVerifiedBadge}
        </span>
      </div>

      {/* Form Input Container */}
      <form onSubmit={handleExtract} className="relative z-10 space-y-4 pt-2">
        <div className="relative rounded-2xl border border-neutral-200/90 dark:border-[#2f2742] focus-within:border-[#8B5CF6] dark:focus-within:border-[#A855F7] focus-within:ring-4 focus-within:ring-purple-500/10 dark:focus-within:ring-purple-500/15 transition-all bg-[#FAFAFC] dark:bg-[#191524]">
          <div className="flex items-center gap-3 px-4 pt-3.5 text-neutral-400 dark:text-neutral-500">
            <Search className="w-4 h-4 text-[#8B5CF6]" />
            <span className="text-[11px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              {dir === 'rtl' ? 'رابط أو نص مشاركة السلة من تطبيق شي إن' : 'SHEIN Cart Share Text / Link'}
            </span>
          </div>

          <textarea
            rows={4}
            value={inputText}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder={t.placeholder}
            className="w-full px-4 py-3 text-xs sm:text-sm text-neutral-900 dark:text-white bg-transparent focus:outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-600 font-sans resize-y leading-relaxed"
          />

          <div className="px-4 py-2.5 bg-neutral-100/60 dark:bg-[#151120] border-t border-neutral-200/60 dark:border-[#262035] flex items-center justify-between text-[11px] text-neutral-400 dark:text-neutral-500 rounded-b-2xl">
            <span>{t.acceptsHint}</span>
            <span className="font-mono">
              {inputText.length} {t.chars}
            </span>
          </div>
        </div>

        {/* Optional Customer Self-Reporting for Exact Total & Item Count */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="space-y-1 text-start">
            <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
              {dir === 'rtl' ? 'إجمالي السلة في شي إن (جنيه مصري) — اختياري' : 'SHEIN Cart Subtotal in EGP — Optional'}
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={estimatedSubtotal}
              onChange={(e) => setEstimatedSubtotal(e.target.value)}
              placeholder={dir === 'rtl' ? 'مثال: 1250 (أو اتركه فارغاً للمشرف)' : 'e.g. 1250 (or leave blank for admin)'}
              className="w-full px-3.5 py-2.5 text-xs bg-[#FAFAFC] dark:bg-[#191524] border border-neutral-200/90 dark:border-[#2f2742] rounded-xl focus:outline-none focus:border-[#8B5CF6] font-mono text-neutral-900 dark:text-white"
            />
          </div>

          <div className="space-y-1 text-start">
            <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
              {dir === 'rtl' ? 'عدد قطع السلة — اختياري' : 'Number of Items — Optional'}
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={estimatedItemsCount}
              onChange={(e) => setEstimatedItemsCount(e.target.value)}
              placeholder={dir === 'rtl' ? 'مثال: 3 قطع' : 'e.g. 3 items'}
              className="w-full px-3.5 py-2.5 text-xs bg-[#FAFAFC] dark:bg-[#191524] border border-neutral-200/90 dark:border-[#2f2742] rounded-xl focus:outline-none focus:border-[#8B5CF6] font-mono text-neutral-900 dark:text-white"
            />
          </div>
        </div>

        <p className="text-[11px] text-neutral-400 dark:text-neutral-500 text-start leading-relaxed">
          {dir === 'rtl'
            ? '💡 يمكنك كتابة إجمالي السلة الظاهر لديك في تطبيق شي إن لحساب التكلفة الفورية، أو تركه فارغاً ليقوم المشرف بفتح الرابط وتأكيد السعر المعتمد مع أفضل كوبونات خصم.'
            : '💡 You can enter your cart total for instant calculation, or leave it blank for our supervisor to verify prices & discounts directly on SHEIN.'}
        </p>

        {/* Scraped URL Feedback with Framer Motion AnimatePresence */}
        <AnimatePresence>
          {detectedUrl && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="p-3.5 rounded-2xl bg-purple-50/90 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-neutral-900 dark:text-white text-xs flex items-center justify-between gap-3 shadow-xs"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <CheckCircle2 className="w-4 h-4 text-[#8B5CF6] shrink-0" />
                <div className="overflow-hidden">
                  <span className="font-bold text-[#6D28D9] dark:text-purple-300 block text-[11px]">
                    {t.validLinkDetected}
                  </span>
                  <span className="truncate font-mono text-[11px] text-neutral-700 dark:text-neutral-300 block">
                    {detectedUrl}
                  </span>
                </div>
              </div>
              <span className="shrink-0 text-[11px] font-bold text-[#7C3AED] dark:text-purple-300 bg-white dark:bg-[#201a2e] px-2.5 py-1 rounded-full border border-purple-200 dark:border-purple-800">
                {t.ready}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2.5 shadow-xs"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit Button & Payment Trust Logos */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-neutral-100 dark:border-[#201a2d]">
          {/* Payment Logos Badge */}
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
              {dir === 'rtl' ? 'الدفع متاح عبر:' : 'Payment via:'}
            </span>
            <div className="flex items-center gap-2">
              <div className="h-6 px-2 py-0.5 rounded-lg bg-white dark:bg-[#1b1726] border border-purple-200 dark:border-purple-800 flex items-center gap-1.5 shadow-2xs">
                <img src="/images/instapay.png" alt="InstaPay" className="h-4 object-contain" />
                <span className="text-[10px] font-black text-purple-700 dark:text-purple-300">InstaPay</span>
              </div>
              <div className="h-6 px-2 py-0.5 rounded-lg bg-white dark:bg-[#1b1726] border border-rose-200 dark:border-rose-800 flex items-center gap-1.5 shadow-2xs">
                <img src="/images/vodafone-cash.png" alt="Vodafone Cash" className="h-4 object-contain" />
                <span className="text-[10px] font-black text-rose-700 dark:text-rose-300">Vodafone Cash</span>
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#8B5CF6] via-[#7C3AED] to-[#6D28D9] hover:from-[#7C3AED] hover:to-[#5B21B6] disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{t.extracting}</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>{t.extractBtn}</span>
                {dir === 'rtl' ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </>
            )}
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
}
