'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Order, GoodItem, SystemSettings, OrderStatus, CustomSection } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { Navbar } from '@/components/Navbar';
import { AuthModal } from '@/components/AuthModal';
import { SafeImage } from '@/components/SafeImage';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  ExternalLink,
  MessageSquare,
  Eye,
  FileCheck,
  Percent,
  Check,
  X,
  CreditCard,
  RefreshCw,
  Maximize2,
  Sliders,
  TrendingUp,
  AlertTriangle,
  CheckCheck,
  Phone,
  Mail,
  MessageCircle,
  Plus,
  Trash2,
  Edit3,
  Layout,
  Sparkles,
  Wallet,
  Layers,
  Settings,
  HelpCircle,
  Truck,
} from 'lucide-react';

const PRESET_ITEM_COMMENTS = [
  'In stock & verified',
  'Size confirmed with SHEIN',
  'Color swatch verified',
  'Price updated to active promotion',
  'Low stock - prioritizing fulfillment',
];

/* ─────────────── Inline Toast ─────────────── */
interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-3 px-4 py-3.5 rounded-2xl shadow-xl border text-sm font-semibold pointer-events-auto animate-in slide-in-from-bottom-3 ${
            t.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-700'
              : t.type === 'error'
              ? 'bg-rose-600 text-white border-rose-700'
              : 'bg-neutral-900 text-white border-neutral-700'
          }`}
        >
          {t.type === 'success' && <CheckCheck className="w-4 h-4 mt-0.5 shrink-0" />}
          {t.type === 'error' && <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />}
          {t.type === 'info' && <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
          <span className="flex-1 leading-snug">{t.message}</span>
          <button onClick={() => onDismiss(t.id)} className="shrink-0 opacity-70 hover:opacity-100">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ─────────────── Main Component ─────────────── */

export default function AdminDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Toast notifications
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Order for In-Depth Review
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [reviewOrderComment, setReviewOrderComment] = useState('');
  const [reviewItems, setReviewItems] = useState<GoodItem[]>([]);
  const [reviewDynamicFee, setReviewDynamicFee] = useState<number>(20);
  const [updating, setUpdating] = useState(false);
  const [zoomReceipt, setZoomReceipt] = useState(false);

  // Settings modal & tabs
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'payments' | 'support' | 'sections' | 'custom_sections'>('payments');
  const [savingSettings, setSavingSettings] = useState(false);

  // 1. Payments & Wallets
  const [editFeePercent, setEditFeePercent] = useState(20);
  const [editFlatShippingFee, setEditFlatShippingFee] = useState(0);
  const [editShowPaymentInSupport, setEditShowPaymentInSupport] = useState(true);
  const [editEnableInstapay, setEditEnableInstapay] = useState(true);
  const [editInstapayAddress, setEditInstapayAddress] = useState('');
  const [editInstapayName, setEditInstapayName] = useState('');
  const [editEnableVodafoneCash, setEditEnableVodafoneCash] = useState(true);
  const [editVodafoneNumber, setEditVodafoneNumber] = useState('');
  const [editVodafoneInstructions, setEditVodafoneInstructions] = useState('');
  const [editSecondaryWalletNumber, setEditSecondaryWalletNumber] = useState('');
  const [editSecondaryWalletName, setEditSecondaryWalletName] = useState('');

  // 2. Support & Contacts
  const [editSupportPhone, setEditSupportPhone] = useState('');
  const [editSupportWhatsapp, setEditSupportWhatsapp] = useState('');
  const [editSupportEmail, setEditSupportEmail] = useState('');
  const [editSupportHours, setEditSupportHours] = useState('');

  // 3. Built-in Sections
  const [editAnnouncementEnabled, setEditAnnouncementEnabled] = useState(true);
  const [editAnnouncementText, setEditAnnouncementText] = useState('');
  const [editAnnouncementBg, setEditAnnouncementBg] = useState<'purple' | 'amber' | 'emerald' | 'rose'>('purple');
  const [editHeroBadge, setEditHeroBadge] = useState('');
  const [editHeroTitle, setEditHeroTitle] = useState('');
  const [editHeroSubtitle, setEditHeroSubtitle] = useState('');
  const [editHowItWorksEnabled, setEditHowItWorksEnabled] = useState(true);
  const [editStep1Title, setEditStep1Title] = useState('');
  const [editStep1Desc, setEditStep1Desc] = useState('');
  const [editStep2Title, setEditStep2Title] = useState('');
  const [editStep2Desc, setEditStep2Desc] = useState('');
  const [editStep3Title, setEditStep3Title] = useState('');
  const [editStep3Desc, setEditStep3Desc] = useState('');
  const [editTrustMetricsEnabled, setEditTrustMetricsEnabled] = useState(true);

  // 4. Custom Dynamic Sections
  const [editCustomSections, setEditCustomSections] = useState<CustomSection[]>([]);
  const [showNewSectionModal, setShowNewSectionModal] = useState(false);
  const [newSecTitle, setNewSecTitle] = useState('');
  const [newSecSubtitle, setNewSecSubtitle] = useState('');
  const [newSecBadge, setNewSecBadge] = useState('');
  const [newSecType, setNewSecType] = useState<'cards' | 'banner' | 'text' | 'faq'>('cards');
  const [newSecPosition, setNewSecPosition] = useState<'top' | 'middle' | 'bottom'>('middle');
  const [newSecTheme, setNewSecTheme] = useState<'purple' | 'amber' | 'emerald' | 'dark' | 'glass'>('purple');
  const [newSecContent, setNewSecContent] = useState('');
  const [newSecCards, setNewSecCards] = useState<{ id: string; title: string; desc: string; icon: string }[]>([]);
  const [cardTitle, setCardTitle] = useState('');
  const [cardDesc, setCardDesc] = useState('');
  const [cardIcon, setCardIcon] = useState('ShieldCheck');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, settingsRes] = await Promise.all([
        fetch('/api/orders?admin=true'),
        fetch('/api/settings'),
      ]);

      const ordersJson = await ordersRes.json();
      const settingsJson = await settingsRes.json();

      if (ordersJson.success) setOrders(ordersJson.data);
      if (settingsJson.success) {
        const s: SystemSettings = settingsJson.data;
        setSettings(s);
        setEditFeePercent(s.dynamicFeePercent ?? 20);
        setEditFlatShippingFee(s.flatShippingFee ?? 0);
        setEditShowPaymentInSupport(s.showPaymentInSupport ?? true);
        setEditEnableInstapay(s.enableInstapay ?? true);
        setEditInstapayAddress(s.instapayAddress ?? '');
        setEditInstapayName(s.instapayAccountName ?? '');
        setEditEnableVodafoneCash(s.enableVodafoneCash ?? true);
        setEditVodafoneNumber(s.vodafoneCashNumber ?? '');
        setEditVodafoneInstructions(s.vodafoneCashInstructions ?? '');
        setEditSecondaryWalletNumber(s.secondaryWalletNumber ?? '');
        setEditSecondaryWalletName(s.secondaryWalletName ?? '');

        setEditSupportPhone(s.supportPhone ?? '');
        setEditSupportWhatsapp(s.supportWhatsapp ?? s.supportPhone ?? '');
        setEditSupportEmail(s.supportEmail ?? '');
        setEditSupportHours(s.supportHours ?? '');

        setEditAnnouncementEnabled(s.announcementEnabled ?? true);
        setEditAnnouncementText(s.announcementText ?? '');
        setEditAnnouncementBg(s.announcementBg ?? 'purple');
        setEditHeroBadge(s.heroBadge ?? '');
        setEditHeroTitle(s.heroTitle ?? '');
        setEditHeroSubtitle(s.heroSubtitle ?? '');
        setEditHowItWorksEnabled(s.howItWorksEnabled ?? true);
        setEditStep1Title(s.step1Title ?? '');
        setEditStep1Desc(s.step1Desc ?? '');
        setEditStep2Title(s.step2Title ?? '');
        setEditStep2Desc(s.step2Desc ?? '');
        setEditStep3Title(s.step3Title ?? '');
        setEditStep3Desc(s.step3Desc ?? '');
        setEditTrustMetricsEnabled(s.trustMetricsEnabled ?? true);

        setEditCustomSections(s.customSections ?? []);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
      addToast('error', 'Failed to load data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Prompt login if not signed in and auth check is done
  useEffect(() => {
    if (!authLoading && !user) {
      setAuthOpen(true);
    }
  }, [authLoading, user]);

  const openReviewModal = (order: Order) => {
    setSelectedOrder(order);
    setReviewOrderComment(order.adminComment || '');
    setReviewItems(JSON.parse(JSON.stringify(order.items)));
    setReviewDynamicFee(order.dynamicFeePercent || 20);
    setZoomReceipt(false);
  };

  const handleItemFieldChange = (
    index: number,
    field: 'adminComment' | 'originalPrice' | 'quantity' | 'status',
    value: any
  ) => {
    setReviewItems((prev) => {
      const copy = [...prev];
      const item = { ...copy[index] };
      if (field === 'adminComment') item.adminComment = value;
      if (field === 'status') item.status = value;
      if (field === 'originalPrice') {
        item.originalPrice = Number(value) || 0;
        item.subtotal = item.originalPrice * item.quantity;
      }
      if (field === 'quantity') {
        item.quantity = Math.max(1, Number(value) || 1);
        item.subtotal = item.originalPrice * item.quantity;
      }
      copy[index] = item;
      return copy;
    });
  };

  const calculateReviewTotals = () => {
    const subtotal = reviewItems.reduce((s, it) => s + it.subtotal, 0);
    const feeAmount = Math.round(subtotal * (reviewDynamicFee / 100));
    const shipping = selectedOrder?.shippingFee || 0;
    const totalCash = subtotal + feeAmount + shipping;
    return { subtotal, feeAmount, totalCash };
  };

  const handleUpdateOrder = async (
    newStatus?: OrderStatus,
    paymentStatus?: 'VERIFIED' | 'REJECTED'
  ) => {
    if (!selectedOrder) return;
    if (updating) return;
    setUpdating(true);

    try {
      const payload: any = {
        items: reviewItems,
        adminComment: reviewOrderComment,
        dynamicFeePercent: reviewDynamicFee,
      };

      if (newStatus) {
        payload.status = newStatus;
      }

      if (paymentStatus) {
        payload.paymentStatus = paymentStatus;
      }

      const res = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error || 'Failed to update order');

      // Update orders list AND selected order in state
      const updatedOrder: Order = resJson.data;
      setOrders((prev) =>
        prev.map((o) => (o.id === selectedOrder.id ? updatedOrder : o))
      );
      setSelectedOrder(updatedOrder);
      // Sync review items with saved state
      setReviewItems(JSON.parse(JSON.stringify(updatedOrder.items)));

      const actionLabel = newStatus
        ? newStatus === 'APPROVED_PENDING_PAYMENT'
          ? 'Order approved ✓ — Customer can now pay'
          : newStatus === 'REJECTED'
          ? 'Order rejected'
          : newStatus === 'PAID'
          ? 'Payment confirmed — Order marked as Paid ✓'
          : 'Order updated'
        : 'Notes & pricing saved ✓';

      addToast('success', actionLabel);
    } catch (err: any) {
      addToast('error', err.message || 'Update failed. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSavingSettings(true);
    try {
      const payload: Partial<SystemSettings> = {
        dynamicFeePercent: Number(editFeePercent) || 20,
        flatShippingFee: Number(editFlatShippingFee) || 0,
        showPaymentInSupport: editShowPaymentInSupport,
        enableInstapay: editEnableInstapay,
        instapayAddress: editInstapayAddress.trim(),
        instapayAccountName: editInstapayName.trim(),
        enableVodafoneCash: editEnableVodafoneCash,
        vodafoneCashNumber: editVodafoneNumber.trim(),
        vodafoneCashInstructions: editVodafoneInstructions.trim(),
        secondaryWalletNumber: editSecondaryWalletNumber.trim(),
        secondaryWalletName: editSecondaryWalletName.trim(),

        supportPhone: editSupportPhone.trim(),
        supportWhatsapp: editSupportWhatsapp.trim(),
        supportEmail: editSupportEmail.trim(),
        supportHours: editSupportHours.trim(),

        announcementEnabled: editAnnouncementEnabled,
        announcementText: editAnnouncementText.trim(),
        announcementBg: editAnnouncementBg,
        heroBadge: editHeroBadge.trim(),
        heroTitle: editHeroTitle.trim(),
        heroSubtitle: editHeroSubtitle.trim(),
        howItWorksEnabled: editHowItWorksEnabled,
        step1Title: editStep1Title.trim(),
        step1Desc: editStep1Desc.trim(),
        step2Title: editStep2Title.trim(),
        step2Desc: editStep2Desc.trim(),
        step3Title: editStep3Title.trim(),
        step3Desc: editStep3Desc.trim(),
        trustMetricsEnabled: editTrustMetricsEnabled,

        customSections: editCustomSections,
      };

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update settings');
      setSettings(json.data);
      addToast('success', 'تم حفظ جميع التعديلات والإعدادات بنجاح! ✓');
    } catch (err: any) {
      addToast('error', err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddCustomSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSecTitle.trim()) {
      addToast('error', 'عنوان السكشن مطلوب');
      return;
    }

    const newSec: CustomSection = {
      id: `sec-${Date.now()}`,
      title: newSecTitle.trim(),
      subtitle: newSecSubtitle.trim() || undefined,
      badge: newSecBadge.trim() || undefined,
      type: newSecType,
      position: newSecPosition,
      theme: newSecTheme,
      content: newSecContent.trim() || undefined,
      cards: newSecType === 'cards' && newSecCards.length > 0 ? newSecCards : undefined,
      enabled: true,
      createdAt: new Date().toISOString(),
    };

    setEditCustomSections((prev) => [...prev, newSec]);
    setShowNewSectionModal(false);
    setNewSecTitle('');
    setNewSecSubtitle('');
    setNewSecBadge('');
    setNewSecContent('');
    setNewSecCards([]);
    addToast('success', 'تمت إضافة السكشن الجديد! لا تنسى الضغط على "حفظ التعديلات".');
  };

  const handleToggleCustomSection = (id: string) => {
    setEditCustomSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const handleDeleteCustomSection = (id: string) => {
    setEditCustomSections((prev) => prev.filter((s) => s.id !== id));
    addToast('info', 'تم حذف السكشن من القائمة.');
  };

  const handleAddCardToNewSection = () => {
    if (!cardTitle.trim()) return;
    const newCard = {
      id: `card-${Date.now()}`,
      title: cardTitle.trim(),
      desc: cardDesc.trim(),
      icon: cardIcon,
    };
    setNewSecCards((prev) => [...prev, newCard]);
    setCardTitle('');
    setCardDesc('');
  };

  const handleRemoveCard = (cardId: string) => {
    setNewSecCards((prev) => prev.filter((c) => c.id !== cardId));
  };

  // Metrics
  const totalOrdersCount = orders.length;
  const pendingApprovalCount = orders.filter((o) => o.status === 'PENDING_APPROVAL').length;
  const approvedPaymentCount = orders.filter((o) => o.status === 'APPROVED_PENDING_PAYMENT').length;
  const paymentReviewCount = orders.filter((o) => o.status === 'PAYMENT_UNDER_REVIEW').length;
  const completedCount = orders.filter((o) => ['PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED'].includes(o.status)).length;
  const totalVolumeEgp = orders
    .filter((o) => o.status !== 'REJECTED')
    .reduce((sum, o) => sum + o.totalCash, 0);

  // Filtered orders
  const filteredOrders = orders.filter((order) => {
    if (statusFilter !== 'ALL' && order.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        order.id.toLowerCase().includes(q) ||
        order.userName.toLowerCase().includes(q) ||
        order.userEmail.toLowerCase().includes(q) ||
        order.userPhone.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // ── Guard: show login prompt if not authenticated ──
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-neutral-100/60">
        <Navbar onOpenAuth={() => setAuthOpen(true)} />
        <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
          <div className="p-8 bg-white rounded-3xl border border-neutral-200 shadow-xl text-center max-w-md">
            <ShieldCheck className="w-12 h-12 text-rose-600 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-neutral-950 mb-2">Admin Access Required</h2>
            <p className="text-neutral-500 text-sm mb-6">
              Please sign in with your admin account to access the dashboard.
            </p>
            <button
              onClick={() => setAuthOpen(true)}
              className="w-full py-3 bg-neutral-950 hover:bg-rose-600 text-white font-extrabold rounded-2xl transition-colors"
            >
              Sign In as Admin
            </button>
          </div>
        </div>
        <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} defaultRole="admin" />
      </div>
    );
  }

  // ── Guard: show access denied if logged in but not admin ──
  if (!authLoading && user && user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-neutral-100/60">
        <Navbar onOpenAuth={() => setAuthOpen(true)} />
        <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
          <div className="p-8 bg-white rounded-3xl border border-rose-200 shadow-xl text-center max-w-md">
            <AlertTriangle className="w-12 h-12 text-rose-600 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-neutral-950 mb-2">Access Denied</h2>
            <p className="text-neutral-500 text-sm mb-2">
              Your account (<strong>{user.email}</strong>) does not have admin privileges.
            </p>
            <p className="text-neutral-400 text-xs">Contact your supervisor to request access.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100/60 pb-20">
      <Navbar onOpenAuth={() => setAuthOpen(true)} />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-[11px] font-black uppercase tracking-wider border border-rose-200">
                <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
                Administrative Command Center
              </span>
              <span className="text-[11px] font-mono text-neutral-500 bg-white px-2.5 py-0.5 rounded-full border border-neutral-200">
                Live DB Sync
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-neutral-950 tracking-tight">
              Order Review &amp; Dynamic Pricing Hub
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500">
              Accurately review extracted SHEIN goods, modify individual item pricing, add per-good notes, unlock InstaPay / Vodafone Cash payments, and confirm receipts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSettingsOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-black transition-all flex items-center gap-2 shadow-md shadow-purple-500/20 cursor-pointer active:scale-95"
            >
              <Settings className="w-4 h-4 text-purple-200" />
              إعدادات الموقع والمحافظ والسكاشن (Site CMS)
            </button>

            <button
              onClick={fetchData}
              className="p-2.5 bg-white hover:bg-neutral-50 text-neutral-600 border border-neutral-200 rounded-2xl transition-all shadow-xs cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* High-Impact Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-neutral-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-neutral-400 text-xs font-bold mb-2">
              <span>Total Orders</span>
              <span className="text-[10px] bg-neutral-100 px-2 py-0.5 rounded-md text-neutral-700">All</span>
            </div>
            <div className="text-3xl font-black text-neutral-950">{totalOrdersCount}</div>
            <div className="text-[11px] text-neutral-400 mt-1">Extracted carts</div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-3xl border-2 border-amber-300 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-amber-900 text-xs font-bold mb-2">
              <span className="font-extrabold">Needs Review</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-3xl font-black text-amber-600">{pendingApprovalCount}</div>
            <div className="text-[11px] text-amber-800 font-bold mt-1">Pending Approval</div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-blue-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-blue-700 text-xs font-bold mb-2">
              <span>Awaiting Payment</span>
              <CreditCard className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-3xl font-black text-blue-600">{approvedPaymentCount}</div>
            <div className="text-[11px] text-blue-500 mt-1">User has payment info</div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-5 rounded-3xl border-2 border-purple-300 shadow-sm">
            <div className="flex items-center justify-between text-purple-900 text-xs font-bold mb-2">
              <span className="font-extrabold">Payment Review</span>
              <FileCheck className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-3xl font-black text-purple-600">{paymentReviewCount}</div>
            <div className="text-[11px] text-purple-800 font-bold mt-1">Receipts Uploaded</div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-emerald-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-emerald-800 text-xs font-bold mb-2">
              <span>Total Volume</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-600">
              {totalVolumeEgp.toLocaleString()} <span className="text-xs">EGP</span>
            </div>
            <div className="text-[11px] text-emerald-700 font-medium mt-1">{completedCount} Completed</div>
          </div>
        </div>

        {/* Filters & Search Bar */}
        <div className="bg-white p-4 rounded-3xl border border-neutral-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            {[
              { key: 'ALL', label: 'All Orders' },
              { key: 'PENDING_APPROVAL', label: '🟡 Pending Approval' },
              { key: 'APPROVED_PENDING_PAYMENT', label: '🔵 Awaiting Payment' },
              { key: 'PAYMENT_UNDER_REVIEW', label: '🟣 Verify Receipt' },
              { key: 'PAID', label: '🟢 Paid' },
              { key: 'REJECTED', label: '🔴 Rejected' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
                  statusFilter === tab.key
                    ? 'bg-neutral-950 text-white shadow-xs'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {tab.label}
                {tab.key === 'PENDING_APPROVAL' && pendingApprovalCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-amber-500 text-white rounded-full text-[10px] font-black">
                    {pendingApprovalCount}
                  </span>
                )}
                {tab.key === 'PAYMENT_UNDER_REVIEW' && paymentReviewCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-purple-500 text-white rounded-full text-[10px] font-black">
                    {paymentReviewCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order ID, customer, phone..."
              className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-950"
            />
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-3xl border border-neutral-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-[11px] font-black uppercase tracking-wider text-neutral-500">
                  <th className="py-4 px-6">Order ID & Date</th>
                  <th className="py-4 px-6">Customer Info</th>
                  <th className="py-4 px-6">Goods Preview</th>
                  <th className="py-4 px-6">Cash & Fees</th>
                  <th className="py-4 px-6">Live Status</th>
                  <th className="py-4 px-6 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-14 text-center text-neutral-400 font-medium">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-neutral-300" />
                      Loading orders...
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-14 text-center text-neutral-400 font-medium">
                      No orders found matching this filter.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-neutral-50/70 transition-colors group cursor-pointer"
                      onClick={() => openReviewModal(order)}
                    >
                      <td className="py-5 px-6">
                        <div className="font-mono font-black text-neutral-950 text-sm">{order.id}</div>
                        <div className="text-[11px] text-neutral-400 mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString()} at{' '}
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      <td className="py-5 px-6">
                        <div className="font-bold text-neutral-900">{order.userName}</div>
                        <div className="text-neutral-500 text-[11px] font-mono">{order.userPhone || order.userEmail}</div>
                      </td>

                      <td className="py-5 px-6 max-w-xs">
                        <div className="flex items-center gap-2">
                          {order.items.slice(0, 3).map((it, idx) => (
                            <div key={idx} className="w-8 h-10 rounded-lg overflow-hidden border border-neutral-200 shadow-xs bg-purple-50 shrink-0">
                              <SafeImage
                                src={it.image}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                          <span className="font-bold text-neutral-700">
                            {order.items.length} goods
                          </span>
                        </div>
                        <div className="text-[11px] text-rose-600 font-mono truncate mt-1">
                          {order.extractedLink}
                        </div>
                      </td>

                      <td className="py-5 px-6">
                        <div className="font-black text-sm text-neutral-950">
                          {order.totalCash.toLocaleString()} EGP
                        </div>
                        <div className="text-[11px] text-neutral-400">
                          Subtotal {order.itemsSubtotal} + Fee {order.dynamicFeePercent}% ({order.dynamicFeeAmount})
                        </div>
                      </td>

                      <td className="py-5 px-6">
                        <StatusBadge status={order.status} />
                      </td>

                      <td className="py-5 px-6 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openReviewModal(order);
                          }}
                          className="px-4 py-2 bg-neutral-950 hover:bg-rose-600 text-white font-extrabold rounded-2xl text-xs transition-colors shadow-xs inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          {order.status === 'PENDING_APPROVAL' ? 'Review & Approve' : 'Open Review'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ACCURATE ORDER REVIEW MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-4xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-neutral-200 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-6 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="text-[11px] font-black uppercase tracking-wider text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-lg border border-rose-200">
                    Admin Review Mode
                  </span>
                  <span className="font-mono text-lg font-black text-neutral-950">
                    Order #{selectedOrder.id}
                  </span>
                  <StatusBadge status={selectedOrder.status} />
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  Customer: <strong>{selectedOrder.userName}</strong> ({selectedOrder.userPhone || selectedOrder.userEmail}) • Placed: {new Date(selectedOrder.createdAt).toLocaleString()}
                </p>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* SHEIN Link Bar */}
              <div className="p-4 bg-neutral-950 text-white rounded-2xl flex items-center justify-between text-xs border border-white/10">
                <div className="flex items-center gap-2 overflow-hidden mr-3">
                  <span className="font-bold text-neutral-400">Scraped Cart Link:</span>
                  <span className="font-mono truncate text-rose-300">{selectedOrder.extractedLink}</span>
                </div>
                <a
                  href={selectedOrder.extractedLink}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
                >
                  Open on SHEIN <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* PAYMENT RECEIPT VERIFICATION BOX */}
              {selectedOrder.payment && (
                <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-300 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-purple-700" />
                      <h4 className="font-black text-sm text-purple-950">
                        Payment Proof Receipt Submitted ({selectedOrder.payment.method.toUpperCase()})
                      </h4>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="bg-white/80 p-3 rounded-2xl border border-purple-200">
                      <p className="text-neutral-500 font-semibold">Sender Phone / IPA:</p>
                      <p className="font-mono font-black text-neutral-900 text-sm">
                        {selectedOrder.payment.senderIdentifier}
                      </p>
                    </div>
                    <div className="bg-white/80 p-3 rounded-2xl border border-purple-200">
                      <p className="text-neutral-500 font-semibold">Transaction Reference:</p>
                      <p className="font-mono font-black text-neutral-900 text-sm">
                        {selectedOrder.payment.transactionReference || 'Not provided'}
                      </p>
                    </div>
                  </div>

                  {selectedOrder.payment.receiptImage && (
                    <div>
                      <p className="text-xs font-bold text-neutral-700 mb-2">Screenshot Proof (Click to zoom):</p>
                      <div className="relative inline-block border-2 border-purple-200 rounded-2xl overflow-hidden bg-white shadow-sm max-w-xs">
                        <img
                          src={selectedOrder.payment.receiptImage}
                          alt="Receipt"
                          className="max-h-48 object-contain cursor-pointer hover:opacity-95"
                          onClick={() => setZoomReceipt(!zoomReceipt)}
                        />
                        <button
                          type="button"
                          onClick={() => setZoomReceipt(!zoomReceipt)}
                          className="absolute bottom-2 right-2 p-1.5 bg-black/70 text-white rounded-lg text-xs"
                          title="Zoom"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {zoomReceipt && (
                        <div
                          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 cursor-pointer"
                          onClick={() => setZoomReceipt(false)}
                        >
                          <img
                            src={selectedOrder.payment.receiptImage}
                            alt="Zoomed Receipt"
                            className="max-h-[90vh] max-w-[90vw] object-contain rounded-2xl"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {selectedOrder.payment.adminNote && (
                    <div className="p-3 bg-white/60 rounded-xl border border-purple-200 text-xs text-neutral-600">
                      <strong>Previous Admin Note:</strong> {selectedOrder.payment.adminNote}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      disabled={updating}
                      onClick={() => handleUpdateOrder('PAID', 'VERIFIED')}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95"
                    >
                      <Check className="w-4 h-4" />
                      {updating ? 'Processing...' : 'Confirm Payment (Mark as Paid & Fulfill)'}
                    </button>
                    <button
                      type="button"
                      disabled={updating}
                      onClick={() => handleUpdateOrder('APPROVED_PENDING_PAYMENT', 'REJECTED')}
                      className="px-4 py-2.5 bg-rose-100 hover:bg-rose-200 disabled:opacity-50 text-rose-800 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                      Reject Receipt (Ask User to Re-upload)
                    </button>
                  </div>
                </div>
              )}

              {/* ITEM-BY-ITEM ACCURATE REVIEW */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-1 border-b border-neutral-100">
                  <h4 className="font-black text-neutral-950 text-sm flex items-center gap-2">
                    <span>Item-by-Item Review ({reviewItems.length} goods)</span>
                  </h4>
                  <span className="text-[11px] text-neutral-500 font-medium">
                    Edit unit price, quantity, or add comments for each specific good
                  </span>
                </div>

                <div className="space-y-3.5">
                  {reviewItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-5 rounded-3xl border border-neutral-200 bg-neutral-50/70 space-y-3 shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-16 h-20 rounded-2xl overflow-hidden border border-neutral-200 bg-white shadow-xs shrink-0">
                            <SafeImage
                              src={item.image}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <h5 className="font-extrabold text-neutral-950 text-xs sm:text-sm line-clamp-2">{item.name}</h5>
                            <div className="flex flex-wrap gap-2 text-[11px] text-neutral-500 mt-1">
                              {item.color && <span>Color: <strong>{item.color}</strong></span>}
                              {item.size && <span>Size: <strong>{item.size}</strong></span>}
                              {item.sku && <span className="font-mono">{item.sku}</span>}
                            </div>
                          </div>
                        </div>

                        {/* Price & Quantity Editable Fields */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div>
                            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                              Price (EGP)
                            </label>
                            <input
                              type="number"
                              value={item.originalPrice}
                              onChange={(e) =>
                                handleItemFieldChange(idx, 'originalPrice', e.target.value)
                              }
                              className="w-24 px-3 py-1.5 text-xs font-black bg-white border border-neutral-200 rounded-xl text-right focus:outline-none focus:ring-1 focus:ring-rose-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                              Qty
                            </label>
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) =>
                                handleItemFieldChange(idx, 'quantity', e.target.value)
                              }
                              className="w-16 px-3 py-1.5 text-xs font-black bg-white border border-neutral-200 rounded-xl text-center focus:outline-none focus:ring-1 focus:ring-rose-500"
                            />
                          </div>
                          <div className="text-right min-w-[70px]">
                            <span className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                              Subtotal
                            </span>
                            <span className="font-black text-sm text-neutral-950">
                              {item.subtotal.toLocaleString()} EGP
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Admin Comment field for THIS specific good */}
                      <div className="pt-2 border-t border-neutral-200/60">
                        <label className="block text-[11px] font-bold text-rose-800 mb-1 flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-rose-600" />
                          Comment for this Good (Visible to customer):
                        </label>
                        <input
                          type="text"
                          value={item.adminComment || ''}
                          onChange={(e) =>
                            handleItemFieldChange(idx, 'adminComment', e.target.value)
                          }
                          placeholder="e.g. Size L confirmed in stock, price checked..."
                          className="w-full px-3.5 py-2 text-xs bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 placeholder:text-neutral-400"
                        />

                        {/* Quick comment chips */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {PRESET_ITEM_COMMENTS.map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => handleItemFieldChange(idx, 'adminComment', preset)}
                              className="text-[10px] font-semibold bg-white hover:bg-neutral-100 text-neutral-600 px-2.5 py-1 rounded-lg border border-neutral-200 transition-colors cursor-pointer"
                            >
                              + {preset}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamic Markup Recalculation Bar */}
              <div className="p-5 rounded-3xl bg-neutral-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-neutral-300">Dynamic Fee Markup (%):</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={reviewDynamicFee}
                    onChange={(e) => setReviewDynamicFee(Number(e.target.value) || 0)}
                    className="w-20 px-3 py-1.5 text-xs font-black bg-white/10 text-white border border-white/20 rounded-xl text-center focus:outline-none"
                  />
                  <span className="text-xs text-neutral-400 font-bold">%</span>
                </div>

                {(() => {
                  const { subtotal, feeAmount, totalCash } = calculateReviewTotals();
                  return (
                    <div className="flex items-center gap-4 text-xs text-right">
                      <div>
                        <span className="text-neutral-400">Subtotal:</span>{' '}
                        <strong className="text-white">{subtotal.toLocaleString()} EGP</strong>
                      </div>
                      <div>
                        <span className="text-rose-400 font-medium">Fee:</span>{' '}
                        <strong className="text-rose-400">+{feeAmount.toLocaleString()} EGP</strong>
                      </div>
                      <div className="bg-rose-600 text-white px-4 py-2 rounded-2xl font-black text-base shadow-sm">
                        Total: {totalCash.toLocaleString()} EGP
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* OVERALL ORDER COMMENT BY ADMIN */}
              <div>
                <label className="block text-xs font-bold text-neutral-900 mb-1 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-neutral-600" />
                  Overall Admin Comment for the Order:
                </label>
                <textarea
                  rows={3}
                  value={reviewOrderComment}
                  onChange={(e) => setReviewOrderComment(e.target.value)}
                  placeholder="e.g. Cart accurately reviewed! All items are available. 20% concierge fee applied. Please transfer total to Vodafone Cash or InstaPay."
                  className="w-full p-4 text-xs bg-neutral-50 border border-neutral-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-950 font-sans"
                />
              </div>
            </div>

            {/* Actions Footer */}
            <div className="p-5 bg-neutral-50 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 text-xs font-bold text-neutral-500 hover:bg-neutral-200 rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => handleUpdateOrder()}
                  className="px-4 py-2.5 bg-neutral-200 hover:bg-neutral-300 disabled:opacity-50 text-neutral-800 font-black text-xs rounded-xl transition-colors cursor-pointer"
                >
                  {updating ? 'Saving...' : 'Save Notes & Recalculate'}
                </button>

                {selectedOrder.status !== 'REJECTED' && (
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => handleUpdateOrder('REJECTED')}
                    className="px-4 py-2.5 bg-rose-100 hover:bg-rose-200 disabled:opacity-50 text-rose-800 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject Order
                  </button>
                )}

                {(selectedOrder.status === 'PENDING_APPROVAL' || selectedOrder.status === 'REJECTED') && (
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => handleUpdateOrder('APPROVED_PENDING_PAYMENT')}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{updating ? 'Processing...' : 'Approve & Unlock Payment'}</span>
                  </button>
                )}

                {selectedOrder.status === 'APPROVED_PENDING_PAYMENT' && (
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-xl border border-blue-200 text-xs font-bold">
                    <CreditCard className="w-4 h-4" />
                    Awaiting customer payment
                  </div>
                )}

                {selectedOrder.status === 'PAID' && (
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    Order paid & fulfilled
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL SITE CMS & SETTINGS MODAL */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-4xl bg-white rounded-[32px] shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-neutral-50 via-purple-50/40 to-white border-b border-neutral-200 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-[#7C3AED] text-[10px] font-black uppercase tracking-wider">
                    Site Customizer &amp; CMS
                  </span>
                  <span className="text-[10px] font-bold text-neutral-400">تحكم فوري مباشر</span>
                </div>
                <h3 className="text-xl font-black text-neutral-950 mt-1">
                  إعدادات الموقع، المحافظ، الدعم والسكاشن
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  تعديل أرقام الدعم، إظهار/إخفاء بيانات الدفع في السبورت، وتعديل أو إضافة سكاشن جديدة للموقع.
                </p>
              </div>
              <button
                onClick={() => setSettingsOpen(false)}
                className="w-10 h-10 rounded-full bg-white hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 flex items-center justify-center border border-neutral-200 cursor-pointer transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 px-6 pt-3 pb-2 bg-neutral-100/70 border-b border-neutral-200 overflow-x-auto text-xs font-black">
              <button
                type="button"
                onClick={() => setSettingsTab('payments')}
                className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                  settingsTab === 'payments'
                    ? 'bg-white text-purple-700 shadow-xs border border-purple-200'
                    : 'text-neutral-600 hover:bg-white/60'
                }`}
              >
                <CreditCard className="w-4 h-4 text-purple-600" />
                <span>طرق الدفع والمحافظ</span>
              </button>

              <button
                type="button"
                onClick={() => setSettingsTab('support')}
                className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                  settingsTab === 'support'
                    ? 'bg-white text-purple-700 shadow-xs border border-purple-200'
                    : 'text-neutral-600 hover:bg-white/60'
                }`}
              >
                <Phone className="w-4 h-4 text-purple-600" />
                <span>أرقام الدعم والتواصل</span>
              </button>

              <button
                type="button"
                onClick={() => setSettingsTab('sections')}
                className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                  settingsTab === 'sections'
                    ? 'bg-white text-purple-700 shadow-xs border border-purple-200'
                    : 'text-neutral-600 hover:bg-white/60'
                }`}
              >
                <Layout className="w-4 h-4 text-purple-600" />
                <span>تعديل السكاشن الحالية</span>
              </button>

              <button
                type="button"
                onClick={() => setSettingsTab('custom_sections')}
                className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                  settingsTab === 'custom_sections'
                    ? 'bg-white text-purple-700 shadow-xs border border-purple-200'
                    : 'text-neutral-600 hover:bg-white/60'
                }`}
              >
                <Layers className="w-4 h-4 text-purple-600" />
                <span>السكاشن المخصصة ({editCustomSections.length})</span>
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <form onSubmit={handleSaveSettings} className="overflow-y-auto flex-1 p-6 space-y-6 text-xs text-neutral-800">
              {/* TAB 1: PAYMENTS & WALLETS */}
              {settingsTab === 'payments' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Dynamic Fee & Shipping */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-neutral-50 rounded-2xl border border-neutral-200/80">
                    <div>
                      <label className="block font-black text-neutral-800 mb-1">
                        نسبة الرسوم والعمولة الافتراضية (%)
                      </label>
                      <div className="relative">
                        <Percent className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                        <input
                          type="number"
                          min={0}
                          max={100}
                          required
                          value={editFeePercent}
                          onChange={(e) => setEditFeePercent(Number(e.target.value))}
                          className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 font-black text-sm"
                        />
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-1">تطبق على إجمالي سلة شي إن المستخرجة.</p>
                    </div>

                    <div>
                      <label className="block font-black text-neutral-800 mb-1">
                        رسوم الشحن الثابتة (جنيه مصري)
                      </label>
                      <div className="relative">
                        <Truck className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                        <input
                          type="number"
                          min={0}
                          value={editFlatShippingFee}
                          onChange={(e) => setEditFlatShippingFee(Number(e.target.value))}
                          className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 font-black text-sm"
                        />
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-1">اجعلها 0 لو الشحن مجاني داخل مصر.</p>
                    </div>
                  </div>

                  {/* Toggle: Payment details in Support Modal */}
                  <div className="p-5 rounded-2xl border-2 border-purple-200 bg-gradient-to-r from-purple-50/70 via-white to-purple-50/30 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-neutral-950 text-sm">
                          إظهار سكشن بيانات وطرق الدفع في نافذة الدعم (Support Modal)
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">
                          مطلوب من الإدارة
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500">
                        عند التفعيل، تظهر أرقام الحسابات وطرق التحويل داخل نافذة الدعم الفني. عند التعطيل يتم إخفاؤها تماماً من نافذة الدعم.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={editShowPaymentInSupport}
                        onChange={(e) => setEditShowPaymentInSupport(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-12 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  {/* InstaPay Target Account */}
                  <div className="p-5 rounded-2xl border border-neutral-200 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#7C3AED] flex items-center justify-center font-bold">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-black text-neutral-950 text-sm">حساب إنستاباي (InstaPay)</h4>
                          <p className="text-[11px] text-neutral-400">تفعيل واستقبال المدفوعات اللحظية في مصر</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editEnableInstapay}
                          onChange={(e) => setEditEnableInstapay(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-neutral-700 mb-1">
                          عنوان الدفع اللحظي (IPA Address)
                        </label>
                        <input
                          type="text"
                          value={editInstapayAddress}
                          onChange={(e) => setEditInstapayAddress(e.target.value)}
                          placeholder="username@instapay"
                          className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-neutral-700 mb-1">
                          اسم صاحب الحساب المعروض للعميل
                        </label>
                        <input
                          type="text"
                          value={editInstapayName}
                          onChange={(e) => setEditInstapayName(e.target.value)}
                          placeholder="SHEIN Concierge Egypt"
                          className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Vodafone Cash Target Wallet */}
                  <div className="p-5 rounded-2xl border border-neutral-200 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                          <Wallet className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-black text-neutral-950 text-sm">محفظة فودافون كاش (Vodafone Cash)</h4>
                          <p className="text-[11px] text-neutral-400">تحويل كاش عبر رقم الهاتف وإرفاق السكرين شوت</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editEnableVodafoneCash}
                          onChange={(e) => setEditEnableVodafoneCash(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-neutral-700 mb-1">
                          رقم محفظة فودافون كاش
                        </label>
                        <input
                          type="text"
                          value={editVodafoneNumber}
                          onChange={(e) => setEditVodafoneNumber(e.target.value)}
                          placeholder="01284947782"
                          className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-neutral-700 mb-1">
                          تعليمات التحويل للعميل
                        </label>
                        <input
                          type="text"
                          value={editVodafoneInstructions}
                          onChange={(e) => setEditVodafoneInstructions(e.target.value)}
                          placeholder="أرسل المبلغ للرقم أعلاه عبر فودافون كاش ثم أرفق لقطة الشاشة"
                          className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Secondary Wallet (Optional) */}
                  <div className="p-5 rounded-2xl border border-neutral-200 space-y-4 bg-neutral-50/50">
                    <div className="flex items-center gap-2 pb-2 border-b border-neutral-200/60">
                      <Wallet className="w-4 h-4 text-amber-600" />
                      <h4 className="font-black text-neutral-950 text-sm">محفظة كاش إضافية (اختياري)</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-neutral-700 mb-1">
                          اسم المحفظة الإضافية (مثل: اتصالات كاش / أورنج كاش)
                        </label>
                        <input
                          type="text"
                          value={editSecondaryWalletName}
                          onChange={(e) => setEditSecondaryWalletName(e.target.value)}
                          placeholder="اتصالات كاش / أورنج كاش"
                          className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-neutral-700 mb-1">
                          رقم المحفظة الإضافية
                        </label>
                        <input
                          type="text"
                          value={editSecondaryWalletNumber}
                          onChange={(e) => setEditSecondaryWalletNumber(e.target.value)}
                          placeholder="012XXXXXXXX"
                          className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SUPPORT & CONTACTS */}
              {settingsTab === 'support' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="p-5 bg-gradient-to-r from-blue-50/60 to-purple-50/60 rounded-2xl border border-blue-200/60 flex items-center gap-3">
                    <Phone className="w-5 h-5 text-blue-600 shrink-0" />
                    <div>
                      <h4 className="font-black text-neutral-950 text-sm">بيانات الدعم الفني وخدمة العملاء</h4>
                      <p className="text-xs text-neutral-500">تظهر هذه الأرقام في نافذة الدعم وفي أسفل كل فاتورة لعملائك في مصر.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">
                        رقم الهاتف / الخط الساخن المباشر
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                        <input
                          type="text"
                          value={editSupportPhone}
                          onChange={(e) => setEditSupportPhone(e.target.value)}
                          placeholder="+20 128 494 7782"
                          className="w-full pl-10 pr-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">
                        رقم محادثة الواتساب (WhatsApp Direct Chat)
                      </label>
                      <div className="relative">
                        <MessageCircle className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500" />
                        <input
                          type="text"
                          value={editSupportWhatsapp}
                          onChange={(e) => setEditSupportWhatsapp(e.target.value)}
                          placeholder="+201284947782"
                          className="w-full pl-10 pr-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">
                        البريد الإلكتروني المخصص للدعم (Email)
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                        <input
                          type="email"
                          value={editSupportEmail}
                          onChange={(e) => setEditSupportEmail(e.target.value)}
                          placeholder="gamallahmedd01@gmail.com"
                          className="w-full pl-10 pr-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">
                        مواعيد وساعات العمل
                      </label>
                      <div className="relative">
                        <Clock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                        <input
                          type="text"
                          value={editSupportHours}
                          onChange={(e) => setEditSupportHours(e.target.value)}
                          placeholder="يومياً من ٩:٠٠ صباحاً حتى ١١:٠٠ مساءً"
                          className="w-full pl-10 pr-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: EDIT EXISTING BUILT-IN SECTIONS */}
              {settingsTab === 'sections' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Announcement Bar */}
                  <div className="p-5 rounded-2xl border border-neutral-200 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                      <div>
                        <h4 className="font-black text-neutral-950 text-sm">شريط الإعلانات العلوي (Announcement Bar)</h4>
                        <p className="text-[11px] text-neutral-400">يظهر بأعلى كل صفحات الموقع لجذب انتباه العملاء بالعروض</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editAnnouncementEnabled}
                          onChange={(e) => setEditAnnouncementEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>

                    {editAnnouncementEnabled && (
                      <div className="space-y-3">
                        <div>
                          <label className="block font-bold text-neutral-700 mb-1">نص الإعلان</label>
                          <input
                            type="text"
                            value={editAnnouncementText}
                            onChange={(e) => setEditAnnouncementText(e.target.value)}
                            placeholder="خدمة SHEIN Concierge — رسوم خدمة 20%، متاح الدفع عبر InstaPay أو فودافون كاش"
                            className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white font-bold"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-neutral-700 mb-1">لون شريط الإعلان</label>
                          <div className="flex items-center gap-2">
                            {[
                              { key: 'purple', label: 'بنفسجي متدرج', bg: 'bg-purple-600' },
                              { key: 'amber', label: 'عنبري مميز', bg: 'bg-amber-500' },
                              { key: 'emerald', label: 'زمردي أخضر', bg: 'bg-emerald-600' },
                              { key: 'rose', label: 'وردي / أحمر', bg: 'bg-rose-600' },
                            ].map((col) => (
                              <button
                                key={col.key}
                                type="button"
                                onClick={() => setEditAnnouncementBg(col.key as any)}
                                className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 cursor-pointer font-bold ${
                                  editAnnouncementBg === col.key
                                    ? 'border-neutral-900 bg-neutral-100 font-black'
                                    : 'border-neutral-200 hover:bg-neutral-50'
                                }`}
                              >
                                <span className={`w-3 h-3 rounded-full ${col.bg}`} />
                                <span>{col.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Hero Section Texts */}
                  <div className="p-5 rounded-2xl border border-neutral-200 space-y-4">
                    <h4 className="font-black text-neutral-950 text-sm pb-2 border-b border-neutral-100">
                      سكشن الواجهة الرئيسي (Hero Section)
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block font-bold text-neutral-700 mb-1">الوسم العلوي (Hero Badge)</label>
                        <input
                          type="text"
                          value={editHeroBadge}
                          onChange={(e) => setEditHeroBadge(e.target.value)}
                          placeholder="الخدمة الرسمية والأسرع في مصر"
                          className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-neutral-700 mb-1">العنوان الرئيسي (Hero Title)</label>
                        <input
                          type="text"
                          value={editHeroTitle}
                          onChange={(e) => setEditHeroTitle(e.target.value)}
                          placeholder="استخرج سلة شي إن الخاصة بك وادفع بالجنيه المصري"
                          className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-neutral-700 mb-1">الوصف الفرعي (Hero Subtitle)</label>
                        <textarea
                          rows={2}
                          value={editHeroSubtitle}
                          onChange={(e) => setEditHeroSubtitle(e.target.value)}
                          placeholder="الصق رابط سلة المشاركة، نتحقق من المقاسات والأسعار، وادفع بأمان عبر إنستاباي أو فودافون كاش."
                          className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Trust Metrics Toggle */}
                  <div className="p-5 rounded-2xl border border-neutral-200 flex items-center justify-between">
                    <div>
                      <h4 className="font-black text-neutral-950 text-sm">شريط الضمانات وسرعة الشحن (Trust Metrics Bar)</h4>
                      <p className="text-[11px] text-neutral-400">الكروت الأربعة الموجودة أسفل كارت استخراج السلة (فحص دقيق، خصوصية، توصيل)</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editTrustMetricsEnabled}
                        onChange={(e) => setEditTrustMetricsEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  {/* How it works 3 steps */}
                  <div className="p-5 rounded-2xl border border-neutral-200 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                      <div>
                        <h4 className="font-black text-neutral-950 text-sm">سكشن "كيف تعمل خدمة SHEIN Concierge؟"</h4>
                        <p className="text-[11px] text-neutral-400">تعديل أو إخفاء الخطوات الثلاثة في الصفحة الرئيسية</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editHowItWorksEnabled}
                          onChange={(e) => setEditHowItWorksEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>

                    {editHowItWorksEnabled && (
                      <div className="space-y-4 pt-2">
                        <div className="p-4 bg-neutral-50 rounded-xl space-y-2">
                          <span className="font-black text-purple-700">الخطوة 1:</span>
                          <input
                            type="text"
                            value={editStep1Title}
                            onChange={(e) => setEditStep1Title(e.target.value)}
                            placeholder="عنوان الخطوة الأولى"
                            className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg font-bold"
                          />
                          <input
                            type="text"
                            value={editStep1Desc}
                            onChange={(e) => setEditStep1Desc(e.target.value)}
                            placeholder="شرح الخطوة الأولى"
                            className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs"
                          />
                        </div>

                        <div className="p-4 bg-neutral-50 rounded-xl space-y-2">
                          <span className="font-black text-purple-700">الخطوة 2:</span>
                          <input
                            type="text"
                            value={editStep2Title}
                            onChange={(e) => setEditStep2Title(e.target.value)}
                            placeholder="عنوان الخطوة الثانية"
                            className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg font-bold"
                          />
                          <input
                            type="text"
                            value={editStep2Desc}
                            onChange={(e) => setEditStep2Desc(e.target.value)}
                            placeholder="شرح الخطوة الثانية"
                            className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs"
                          />
                        </div>

                        <div className="p-4 bg-neutral-50 rounded-xl space-y-2">
                          <span className="font-black text-purple-700">الخطوة 3:</span>
                          <input
                            type="text"
                            value={editStep3Title}
                            onChange={(e) => setEditStep3Title(e.target.value)}
                            placeholder="عنوان الخطوة الثالثة"
                            className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg font-bold"
                          />
                          <input
                            type="text"
                            value={editStep3Desc}
                            onChange={(e) => setEditStep3Desc(e.target.value)}
                            placeholder="شرح الخطوة الثالثة"
                            className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: CUSTOM SECTIONS BUILDER */}
              {settingsTab === 'custom_sections' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between p-5 bg-purple-50/60 rounded-2xl border border-purple-200/60">
                    <div>
                      <h4 className="font-black text-neutral-950 text-sm">إضافة سكاشن مخصصة للموقع (Dynamic Sections)</h4>
                      <p className="text-xs text-neutral-500">
                        يمكنك إضافة بنرات إعلانية، كروت مميزات، نصوص أو أسئلة شائعة تظهر في الصفحة الرئيسية.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowNewSectionModal(true)}
                      className="px-4 py-2.5 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-purple-300" />
                      <span>إضافة سكشن جديد</span>
                    </button>
                  </div>

                  {/* List of existing custom sections */}
                  {editCustomSections.length === 0 ? (
                    <div className="p-12 text-center border-2 border-dashed border-neutral-200 rounded-2xl space-y-3">
                      <Layers className="w-10 h-10 text-neutral-300 mx-auto" />
                      <p className="font-bold text-neutral-500">لا توجد سكاشن مخصصة مضافة حالياً.</p>
                      <button
                        type="button"
                        onClick={() => setShowNewSectionModal(true)}
                        className="px-4 py-2 bg-purple-600 text-white font-bold rounded-xl text-xs cursor-pointer hover:bg-purple-700"
                      >
                        + اضغط هنا لإنشاء أول سكشن
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {editCustomSections.map((sec, idx) => (
                        <div
                          key={sec.id || idx}
                          className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#7C3AED] flex items-center justify-center font-black text-sm">
                              {idx + 1}
                            </div>
                            <div className="text-start">
                              <div className="flex items-center gap-2">
                                <h5 className="font-black text-neutral-950 text-sm">{sec.title}</h5>
                                <span className="text-[10px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full font-bold uppercase">
                                  {sec.type}
                                </span>
                                <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-bold">
                                  الموضع: {sec.position === 'top' ? 'أعلى الصفحة' : sec.position === 'middle' ? 'وسط الصفحة' : 'أسفل الصفحة'}
                                </span>
                              </div>
                              {sec.subtitle && (
                                <p className="text-xs text-neutral-500 line-clamp-1">{sec.subtitle}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {/* Toggle Enabled */}
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={sec.enabled}
                                onChange={() => handleToggleCustomSection(sec.id)}
                                className="sr-only peer"
                              />
                              <div className="w-10 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                            </label>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomSection(sec.id)}
                              className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                              title="حذف السكشن"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Nested Modal: Add New Custom Section */}
                  {showNewSectionModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
                      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="p-5 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
                          <h4 className="font-black text-neutral-950 text-base">إنشاء سكشن جديد مخصص</h4>
                          <button
                            type="button"
                            onClick={() => setShowNewSectionModal(false)}
                            className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-full"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="overflow-y-auto p-5 space-y-4 text-xs">
                          <div>
                            <label className="block font-bold text-neutral-700 mb-1">عنوان السكشن الرئيسي *</label>
                            <input
                              type="text"
                              required
                              value={newSecTitle}
                              onChange={(e) => setNewSecTitle(e.target.value)}
                              placeholder="مثال: مميزات الشحن والتوصيل السريع"
                              className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl font-bold focus:bg-white"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block font-bold text-neutral-700 mb-1">وصف السكشن (اختياري)</label>
                              <input
                                type="text"
                                value={newSecSubtitle}
                                onChange={(e) => setNewSecSubtitle(e.target.value)}
                                placeholder="شرح تفصيلي لما يقدمه السكشن"
                                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white"
                              />
                            </div>
                            <div>
                              <label className="block font-bold text-neutral-700 mb-1">الوسم المميز (Badge)</label>
                              <input
                                type="text"
                                value={newSecBadge}
                                onChange={(e) => setNewSecBadge(e.target.value)}
                                placeholder="مثال: عرض خاص / ضمان 100%"
                                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block font-bold text-neutral-700 mb-1">نوع السكشن</label>
                              <select
                                value={newSecType}
                                onChange={(e) => setNewSecType(e.target.value as any)}
                                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white font-bold"
                              >
                                <option value="cards">كروت مميزات (Cards)</option>
                                <option value="banner">بانر عريض (Banner)</option>
                                <option value="text">نص وإرشادات (Text)</option>
                                <option value="faq">أسئلة شائعة (FAQ)</option>
                              </select>
                            </div>

                            <div>
                              <label className="block font-bold text-neutral-700 mb-1">موضع السكشن</label>
                              <select
                                value={newSecPosition}
                                onChange={(e) => setNewSecPosition(e.target.value as any)}
                                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white font-bold"
                              >
                                <option value="top">أعلى الصفحة (تحت الـ Hero)</option>
                                <option value="middle">وسط الصفحة</option>
                                <option value="bottom">أسفل الصفحة</option>
                              </select>
                            </div>

                            <div>
                              <label className="block font-bold text-neutral-700 mb-1">لون السكشن (Theme)</label>
                              <select
                                value={newSecTheme}
                                onChange={(e) => setNewSecTheme(e.target.value as any)}
                                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white font-bold"
                              >
                                <option value="purple">بنفسجي (Purple)</option>
                                <option value="amber">عنبري (Amber)</option>
                                <option value="emerald">زمردي (Emerald)</option>
                                <option value="glass">زجاجي ناعم (Glass)</option>
                                <option value="dark">داكن فخم (Dark)</option>
                              </select>
                            </div>
                          </div>

                          {/* Dynamic Content by Type */}
                          {newSecType === 'cards' && (
                            <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="font-black text-neutral-900">كروت السكشن ({newSecCards.length})</span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <input
                                  type="text"
                                  value={cardTitle}
                                  onChange={(e) => setCardTitle(e.target.value)}
                                  placeholder="عنوان الكارت"
                                  className="px-3 py-2 bg-white border border-neutral-200 rounded-xl font-bold"
                                />
                                <input
                                  type="text"
                                  value={cardDesc}
                                  onChange={(e) => setCardDesc(e.target.value)}
                                  placeholder="وصف الكارت"
                                  className="px-3 py-2 bg-white border border-neutral-200 rounded-xl"
                                />
                                <div className="flex items-center gap-1.5">
                                  <select
                                    value={cardIcon}
                                    onChange={(e) => setCardIcon(e.target.value)}
                                    className="px-2 py-2 bg-white border border-neutral-200 rounded-xl font-bold flex-1"
                                  >
                                    <option value="ShieldCheck">درع أمان</option>
                                    <option value="Truck">شاحنة شحن</option>
                                    <option value="CreditCard">بطاقة دفع</option>
                                    <option value="Sparkles">بريق ونجوم</option>
                                    <option value="Heart">قلب ومفضلة</option>
                                    <option value="Clock">ساعة وسرعة</option>
                                    <option value="HelpCircle">سؤال واستفسار</option>
                                  </select>
                                  <button
                                    type="button"
                                    onClick={handleAddCardToNewSection}
                                    className="px-3 py-2 bg-purple-600 text-white rounded-xl font-bold cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>

                              {newSecCards.length > 0 && (
                                <div className="space-y-1.5 pt-2">
                                  {newSecCards.map((c) => (
                                    <div
                                      key={c.id}
                                      className="flex items-center justify-between p-2 bg-white rounded-lg border text-xs"
                                    >
                                      <div>
                                        <span className="font-bold text-neutral-900">{c.title}: </span>
                                        <span className="text-neutral-500">{c.desc}</span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveCard(c.id)}
                                        className="text-rose-500 hover:text-rose-700 font-bold px-1"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {newSecType !== 'cards' && (
                            <div>
                              <label className="block font-bold text-neutral-700 mb-1">
                                {newSecType === 'faq'
                                  ? 'الأسئلة والأجوبة (اكتب السؤال في سطر، والجواب في السطر التالي، واترك سطر فارغ بين كل سؤال)'
                                  : 'محتوى السكشن (نص المقال أو رسالة البانر)'}
                              </label>
                              <textarea
                                rows={4}
                                value={newSecContent}
                                onChange={(e) => setNewSecContent(e.target.value)}
                                placeholder={
                                  newSecType === 'faq'
                                    ? 'س: كم تستغرق مدة الشحن إلى مصر؟\nج: تستغرق الشحنة من ٧ إلى ١٠ أيام عمل.\n\nس: هل يمكن الدفع عند الاستلام؟\nج: نوفر الدفع المسبق الآمن بالجنيه عبر إنستاباي وفودافون كاش.'
                                    : 'اكتب تفاصيل ومحتوى هذا السكشن هنا...'
                                }
                                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white font-mono text-xs"
                              />
                            </div>
                          )}
                        </div>

                        <div className="p-4 bg-neutral-100 flex items-center justify-end gap-2 border-t">
                          <button
                            type="button"
                            onClick={() => setShowNewSectionModal(false)}
                            className="px-4 py-2 font-bold text-neutral-500"
                          >
                            إلغاء
                          </button>
                          <button
                            type="button"
                            onClick={handleAddCustomSection}
                            className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl cursor-pointer"
                          >
                            إضافة السكشن للقائمة
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Bottom Actions Bar */}
              <div className="flex items-center justify-between gap-3 pt-5 border-t border-neutral-200 mt-6 sticky bottom-0 bg-white/95 backdrop-blur-md py-3">
                <div className="text-[11px] text-neutral-500">
                  سيتم تطبيق التعديلات فورياً على جميع صفحات وزوار الموقع عند الحفظ.
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSettingsOpen(false)}
                    className="px-5 py-2.5 font-bold text-neutral-500 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="px-7 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-800 disabled:opacity-50 text-white font-black rounded-xl shadow-md shadow-purple-500/25 transition-all cursor-pointer flex items-center gap-2"
                  >
                    {savingSettings ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>جاري الحفظ...</span>
                      </>
                    ) : (
                      <span>حفظ جميع الإعدادات والتعديلات</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} defaultRole="admin" />
    </div>
  );
}

/* ─────────────── Status Badge Component ─────────────── */
function StatusBadge({ status }: { status: OrderStatus }) {
  const map: Record<OrderStatus, { label: string; className: string; icon: React.ReactNode }> = {
    PENDING_APPROVAL: {
      label: 'Pending Review',
      className: 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse',
      icon: <Clock className="w-3.5 h-3.5 text-amber-600" />,
    },
    APPROVED_PENDING_PAYMENT: {
      label: 'Awaiting Payment',
      className: 'bg-blue-100 text-blue-900 border-blue-200',
      icon: <CreditCard className="w-3.5 h-3.5 text-blue-600" />,
    },
    PAYMENT_UNDER_REVIEW: {
      label: 'Verify Receipt',
      className: 'bg-purple-100 text-purple-900 border-purple-300',
      icon: <FileCheck className="w-3.5 h-3.5 text-purple-600" />,
    },
    PAID: {
      label: 'Paid & Processing',
      className: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
    },
    PROCESSING: {
      label: 'Processing',
      className: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
    },
    SHIPPED: {
      label: 'Shipped',
      className: 'bg-sky-100 text-sky-900 border-sky-300',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />,
    },
    COMPLETED: {
      label: 'Completed',
      className: 'bg-neutral-100 text-neutral-700 border-neutral-300',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-neutral-500" />,
    },
    REJECTED: {
      label: 'Rejected',
      className: 'bg-rose-100 text-rose-900 border-rose-300',
      icon: <XCircle className="w-3.5 h-3.5 text-rose-600" />,
    },
  };

  const cfg = map[status] ?? map.PENDING_APPROVAL;

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black border ${cfg.className}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}
