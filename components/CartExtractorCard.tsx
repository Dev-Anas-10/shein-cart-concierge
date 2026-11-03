'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { extractSheinUrl } from '@/lib/shein-extractor';
import { ExtractedCartResult } from '@/lib/types';
import { useThemeLang } from '@/lib/theme-lang-context';
import { SheinLinkGuide } from './SheinLinkGuide';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Link2,
  ClipboardPaste,
  ClipboardCheck,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  CreditCard,
  Zap,
  RotateCcw,
  Shirt,
} from 'lucide-react';

interface CartExtractorCardProps {
  onExtracted: (result: ExtractedCartResult) => void;
  currentDynamicFeePercent: number;
}

export function CartExtractorCard({ onExtracted, currentDynamicFeePercent }: CartExtractorCardProps) {
  const { t, dir } = useThemeLang();
  const isRtl = dir === 'rtl';
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectedUrl, setDetectedUrl] = useState<string | null>(null);
  const [pasteSuccess, setPasteSuccess] = useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('action') === 'new' || window.location.hash === '#cart-extractor-card') {
        const el = document.getElementById('cart-extractor-card');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        if (textareaRef.current) {
          setTimeout(() => textareaRef.current?.focus(), 450);
        }
      }
    }
  }, []);

  const handleTextChange = (val: string) => {
    setInputText(val);
    setError(null);
    const link = extractSheinUrl(val);
    setDetectedUrl(link);
  };

  // One-click clipboard paste handler
  const handlePasteClipboard = async () => {
    setError(null);
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.readText) {
        const clipText = await navigator.clipboard.readText();
        if (clipText && clipText.trim()) {
          handleTextChange(clipText.trim());
          setPasteSuccess(true);
          setTimeout(() => setPasteSuccess(false), 2500);
          return;
        }
      }
    } catch (err) {
      console.warn('Clipboard read error or not permitted:', err);
    }

    // Fallback: focus input and inform user
    if (textareaRef.current) {
      textareaRef.current.focus();
      setError(
        isRtl
          ? 'المربع جاهز للكتابة أو اللصق! اضغطي ضغطة مطولة داخل المربع واختاري لصق (Paste).'
          : 'Input is focused! Long press inside the box and choose Paste.'
      );
    }
  };

  const handleClear = () => {
    setInputText('');
    setDetectedUrl(null);
    setError(null);
  };

  const handleExtract = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) {
      setError(
        isRtl
          ? 'من فضلكِ الصقي رابط السلة أو المنتج أولاً في المربع المخصص بالأسفل.'
          : 'Please paste your SHEIN cart share text or URL first.'
      );
      if (textareaRef.current) textareaRef.current.focus();
      return;
    }

    const cleanUrl = extractSheinUrl(inputText);
    if (!cleanUrl) {
      setError(
        isRtl
          ? 'لم نتمكن من العثور على رابط شي إن صالح. تأكدي أن النص يحتوي على رابط مثل onelink.shein.com أو shein.com'
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
          dynamicFeePercent: currentDynamicFeePercent > 0 ? currentDynamicFeePercent : 0,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(
          json.error ||
            (isRtl
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
      id="cart-extractor-card"
      className="relative rounded-3xl p-6 sm:p-9 bg-white dark:bg-[#13101c] border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-6 transition-colors overflow-hidden"
    >
      {/* Top Graphic Header */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6 pb-2">
        <div className="space-y-2 text-center sm:text-start">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-[#7C3AED] dark:text-purple-300 text-[11px] font-black uppercase tracking-wider border border-purple-200/80 dark:border-purple-800/60">
              {isRtl ? 'المستخرج الذكي لسلات شي إن' : t.extractorBadge}
            </span>
            {currentDynamicFeePercent > 0 && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-[#1d1728] text-neutral-600 dark:text-neutral-400 text-[11px] font-semibold border border-neutral-200/60 dark:border-neutral-800">
                +{currentDynamicFeePercent}% {t.feeLabel}
              </span>
            )}
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-neutral-950 dark:text-white tracking-tight text-balance">
            {isRtl ? 'معاكي سلة أو فستان من شي إن؟' : t.extractorTitle}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 max-w-lg leading-relaxed font-medium text-balance">
            {isRtl
              ? 'الصقي الرابط في الصندوق بالأسفل، وسنقوم بحساب الإجمالي بالجنيه المصري ومراجعة المقاسات والشراء والتوصيل لباب بيتك!'
              : t.extractorDesc}
          </p>
        </div>

        {/* Fashion Cart Visual Badge */}
        <motion.div
          whileHover={{ scale: 1.03 }}
          transition={{ duration: 0.2 }}
          className="relative w-24 h-24 shrink-0 flex items-center justify-center cursor-default"
        >
          <div className="w-24 h-24 rounded-2xl bg-neutral-50 dark:bg-[#1a1526] border border-neutral-200 dark:border-neutral-800 flex flex-col items-center justify-center gap-1.5 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black text-purple-700 dark:text-purple-300">SHEIN EG</span>
          </div>
        </motion.div>
      </div>

      {/* 1. Visual Guide / Walkthrough on How to get the SHEIN Link */}
      <div className="relative z-10">
        <SheinLinkGuide />
      </div>

      {/* 2. THE MAIN HERO DROPZONE */}
      <form onSubmit={handleExtract} className="relative z-10 space-y-4 pt-1">
        {/* Visual Callout Heading */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <label
            htmlFor="shein-cart-input"
            className="text-xs sm:text-sm font-black text-neutral-950 dark:text-white flex items-center gap-2"
          >
            <span>{isRtl ? 'الصقي رابط سلتك أو منتجك في هذا الصندوق:' : 'Paste your SHEIN link here:'}</span>
          </label>

          {/* Quick Action Buttons (Paste & Clear) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePasteClipboard}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                pasteSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700'
              }`}
              title={isRtl ? 'لصق الرابط من الحافظة مباشرة' : 'Paste from clipboard'}
            >
              {pasteSuccess ? (
                <>
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'تم اللصق' : 'Pasted'}</span>
                </>
              ) : (
                <>
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'لصق من الحافظة' : 'Paste'}</span>
                </>
              )}
            </button>

            {inputText.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 rounded-xl text-neutral-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                title={isRtl ? 'مسح الرابط' : 'Clear'}
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Input Box Container */}
        <div className="relative rounded-2xl border border-neutral-200 dark:border-neutral-800 focus-within:border-purple-600 dark:focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all bg-neutral-50/70 dark:bg-[#161224] overflow-hidden">
          {/* Header indicator inside the box */}
          <div className="flex items-center justify-between px-4 sm:px-5 pt-3 pb-2 border-b border-neutral-200/80 dark:border-neutral-800 bg-white/60 dark:bg-[#181328]">
            <div className="flex items-center gap-2">
              <Link2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-black text-neutral-900 dark:text-neutral-200">
                {isRtl ? 'سلة أو منتجات شي إن' : 'SHEIN Cart Extractor Input'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-500 dark:text-neutral-400">
              <Shirt className="w-3 h-3 text-purple-500" />
              <span>{isRtl ? 'يقبل السلة أو أي منتج منفرد' : 'Cart or single item'}</span>
            </div>
          </div>

          <textarea
            id="shein-cart-input"
            ref={textareaRef}
            rows={4}
            value={inputText}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder={
              isRtl
                ? 'الصقي هنا رابط السلة (onelink.shein.com أو رابط أي منتج) أو رسالة المشاركة كاملة كما تم نسخها من تطبيق شي إن...'
                : 'Paste your SHEIN cart link (https://onelink.shein.com/...) or single item link here...'
            }
            className="w-full px-4 sm:px-5 py-3.5 text-xs sm:text-sm text-neutral-900 dark:text-white bg-transparent focus:outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-500 font-sans resize-y leading-relaxed font-medium"
          />

          {/* Bottom Bar inside the box */}
          <div className="px-4 sm:px-5 py-2.5 bg-neutral-100/60 dark:bg-[#130f1e] border-t border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{isRtl ? 'جاهز للاستخراج' : 'Ready'}</span>
            </span>
            <span className="font-mono tabular-nums text-[11px]">
              {inputText.length} {t.chars}
            </span>
          </div>
        </div>

        {/* Real-time Link Detection Banner */}
        <AnimatePresence>
          {detectedUrl && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-neutral-900 dark:text-white text-xs flex flex-col sm:flex-row items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 overflow-hidden w-full sm:w-auto">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <span className="font-black text-emerald-900 dark:text-emerald-200 block text-xs">
                    {isRtl ? 'تم التعرف على الرابط بنجاح' : 'Valid SHEIN Link Detected'}
                  </span>
                  <span className="truncate font-mono text-[11px] text-neutral-600 dark:text-neutral-400 block mt-0.5 max-w-sm sm:max-w-md">
                    {detectedUrl}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-300">
                  {isRtl ? 'جاهز للاستخراج ⬇️' : 'Ready to extract'}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Feedback */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2.5 shadow-xs"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span className="font-medium">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Supported formats tags */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400 px-1">
          <span className="font-bold text-neutral-600 dark:text-neutral-400">
            {isRtl ? 'الروابط المدعومة:' : 'Accepted formats:'}
          </span>
          <span className="px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-[#1d1728] border border-neutral-200/80 dark:border-neutral-800 font-medium">
            {isRtl ? 'سلة كاملة (onelink.shein.com)' : 'Full Cart'}
          </span>
          <span className="px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-[#1d1728] border border-neutral-200/80 dark:border-neutral-800 font-medium">
            {isRtl ? 'رابط منتج منفرد' : 'Single Item'}
          </span>
          <span className="px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-[#1d1728] border border-neutral-200/80 dark:border-neutral-800 font-medium">
            {isRtl ? 'رسالة مشاركة من التطبيق' : 'App Share Text'}
          </span>
        </div>

        {/* Submit Button & Payment Trust Logos */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-200/80 dark:border-neutral-800">
          {/* Payment Logos Badge */}
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
              {isRtl ? 'الدفع متاح عبر:' : 'Payment via:'}
            </span>
            <div className="flex items-center gap-2">
              <div className="h-7 px-2.5 py-0.5 rounded-lg bg-white dark:bg-[#1b1726] border border-neutral-200 dark:border-neutral-800 flex items-center gap-1.5 shadow-2xs">
                <img src="/images/instapay.png" alt="InstaPay" className="h-4 object-contain" />
                <span className="text-[10px] font-black text-purple-700 dark:text-purple-300">InstaPay</span>
              </div>
              <div className="h-7 px-2.5 py-0.5 rounded-lg bg-white dark:bg-[#1b1726] border border-neutral-200 dark:border-neutral-800 flex items-center gap-1.5 shadow-2xs">
                <img src="/images/vodafone-cash.png" alt="Vodafone Cash" className="h-4 object-contain" />
                <span className="text-[10px] font-black text-rose-700 dark:text-rose-300">Vodafone Cash</span>
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            transition={{ duration: 0.15 }}
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-7 py-3.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-black text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer select-none disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{isRtl ? 'جاري قراءة المنتجات وتحديث الأسعار...' : t.extracting}</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>{isRtl ? 'استخراج السلة وحساب الإجمالي' : t.extractBtn}</span>
                {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </>
            )}
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
}
