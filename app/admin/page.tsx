'use client';

import React, { useState, useEffect } from 'react';
import { Order, GoodItem, SystemSettings, OrderStatus } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { Navbar } from '@/components/Navbar';
import { AuthModal } from '@/components/AuthModal';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  ExternalLink,
  MessageSquare,
  Settings,
  Eye,
  User,
  Phone,
  FileCheck,
  Percent,
  Check,
  X,
  CreditCard,
  RefreshCw,
  Sparkles,
  Maximize2,
  Sliders,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

const PRESET_ITEM_COMMENTS = [
  'In stock & verified',
  'Size confirmed with SHEIN',
  'Color swatch verified',
  'Price updated to active promotion',
  'Low stock - prioritizing fulfillment',
];

export default function AdminDashboardPage() {
  const { user, switchRole } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);

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

  // Settings modal
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editFeePercent, setEditFeePercent] = useState(20);
  const [editInstapayAddress, setEditInstapayAddress] = useState('');
  const [editInstapayName, setEditInstapayName] = useState('');
  const [editVodafoneNumber, setEditVodafoneNumber] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, settingsRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/settings'),
      ]);

      const ordersJson = await ordersRes.json();
      const settingsJson = await settingsRes.json();

      if (ordersJson.success) setOrders(ordersJson.data);
      if (settingsJson.success) {
        setSettings(settingsJson.data);
        setEditFeePercent(settingsJson.data.dynamicFeePercent);
        setEditInstapayAddress(settingsJson.data.instapayAddress);
        setEditInstapayName(settingsJson.data.instapayAccountName);
        setEditVodafoneNumber(settingsJson.data.vodafoneCashNumber);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

      // Update in state
      setOrders((prev) =>
        prev.map((o) => (o.id === selectedOrder.id ? resJson.data : o))
      );
      setSelectedOrder(resJson.data);
      alert('Order updated successfully!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dynamicFeePercent: Number(editFeePercent) || 20,
          instapayAddress: editInstapayAddress.trim(),
          instapayAccountName: editInstapayName.trim(),
          vodafoneCashNumber: editVodafoneNumber.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update settings');
      setSettings(json.data);
      setSettingsOpen(false);
      alert('Dynamic pricing & payment settings saved!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingSettings(false);
    }
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

  return (
    <div className="min-h-screen bg-neutral-100/60 pb-20">
      <Navbar onOpenAuth={() => setAuthOpen(true)} />

      {/* Role Alert if viewing as customer */}
      {user?.role !== 'admin' && (
        <div className="bg-gradient-to-r from-rose-600 to-red-600 text-white py-3 px-4 text-center text-xs font-bold flex items-center justify-center gap-3 shadow-md">
          <AlertCircle className="w-4 h-4" />
          <span>You are currently in Preview Mode. Switch to Admin role to submit official reviews.</span>
          <button
            onClick={() => switchRole('admin')}
            className="px-3.5 py-1 bg-white text-rose-700 font-black rounded-lg shadow-xs hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            Activate Admin Role
          </button>
        </div>
      )}

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
              Order Review & Dynamic Pricing Hub
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500">
              Accurately review extracted SHEIN goods, modify individual item pricing, add per-good notes, unlock InstaPay / Vodafone Cash payments, and confirm receipts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSettingsOpen(true)}
              className="px-4 py-2.5 bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-200 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
            >
              <Sliders className="w-4 h-4 text-neutral-600" />
              Dynamic Fee & Wallets
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
            <div className="text-[11px] text-emerald-700 font-medium mt-1">{completedCount} Orders Completed</div>
          </div>
        </div>

        {/* Filters & Search Bar */}
        <div className="bg-white p-4 rounded-3xl border border-neutral-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            {[
              { key: 'ALL', label: 'All Orders' },
              { key: 'PENDING_APPROVAL', label: 'Pending Approval' },
              { key: 'APPROVED_PENDING_PAYMENT', label: 'Awaiting Payment' },
              { key: 'PAYMENT_UNDER_REVIEW', label: 'Verify Receipt' },
              { key: 'PAID', label: 'Paid & Processing' },
              { key: 'REJECTED', label: 'Rejected' },
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
                {filteredOrders.length === 0 ? (
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
                            <img
                              key={idx}
                              src={it.image}
                              alt=""
                              className="w-8 h-10 object-cover rounded-lg border border-neutral-200 shadow-xs"
                            />
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
                        {order.status === 'PENDING_APPROVAL' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            Pending Review
                          </span>
                        )}
                        {order.status === 'APPROVED_PENDING_PAYMENT' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black bg-blue-100 text-blue-900 border border-blue-200">
                            <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                            Awaiting Payment
                          </span>
                        )}
                        {order.status === 'PAYMENT_UNDER_REVIEW' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black bg-purple-100 text-purple-900 border border-purple-300">
                            <FileCheck className="w-3.5 h-3.5 text-purple-600" />
                            Verify Receipt
                          </span>
                        )}
                        {order.status === 'PAID' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Paid & Processing
                          </span>
                        )}
                        {order.status === 'REJECTED' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black bg-rose-100 text-rose-900 border border-rose-300">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            Rejected
                          </span>
                        )}
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
                          Accurate Review
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

      {/* ACCURATE ORDER REVIEW MODAL (DRAWER) */}
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

              {/* PAYMENT RECEIPT VERIFICATION BOX (If user uploaded receipt) */}
              {selectedOrder.payment && (
                <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-300 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-purple-700" />
                      <h4 className="font-black text-sm text-purple-950">
                        Payment Proof Receipt Submitted ({selectedOrder.payment.method.toUpperCase()})
                      </h4>
                    </div>
                    <span className="text-xs font-bold text-purple-800 bg-purple-200/80 px-3 py-1 rounded-full">
                      Status: {selectedOrder.status}
                    </span>
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

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      disabled={updating}
                      onClick={() => handleUpdateOrder('PAID', 'VERIFIED')}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95"
                    >
                      <Check className="w-4 h-4" />
                      Confirm Payment (Mark as Paid & Fulfill)
                    </button>
                    <button
                      type="button"
                      disabled={updating}
                      onClick={() => handleUpdateOrder('APPROVED_PENDING_PAYMENT', 'REJECTED')}
                      className="px-4 py-2.5 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
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
                          <img
                            src={item.image}
                            alt=""
                            className="w-16 h-20 object-cover rounded-2xl border border-neutral-200 bg-white shadow-xs"
                          />
                          <div>
                            <h5 className="font-extrabold text-neutral-950 text-xs sm:text-sm line-clamp-1">{item.name}</h5>
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
                              className="w-24 px-3 py-1.5 text-xs font-black bg-white border border-neutral-200 rounded-xl text-right"
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
                              className="w-16 px-3 py-1.5 text-xs font-black bg-white border border-neutral-200 rounded-xl text-center"
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
                          Comment for this Good (Visible to customer on their order page):
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
                    className="w-20 px-3 py-1.5 text-xs font-black bg-white/10 text-white border border-white/20 rounded-xl text-center"
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
                  className="px-4 py-2.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-black text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Save Notes & Recalculate
                </button>

                <button
                  type="button"
                  disabled={updating}
                  onClick={() => handleUpdateOrder('REJECTED')}
                  className="px-4 py-2.5 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  Reject Order
                </button>

                <button
                  type="button"
                  disabled={updating}
                  onClick={() => handleUpdateOrder('APPROVED_PENDING_PAYMENT')}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve & Unlock Payment</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL SETTINGS MODAL */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden">
            <div className="p-6 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-neutral-950">Dynamic Fees & Target Wallets</h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Configure default markup percentage and Egyptian payment receiving accounts.
                </p>
              </div>
              <button
                onClick={() => setSettingsOpen(false)}
                className="p-2 text-neutral-400 hover:text-neutral-700 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Default Dynamic Service Fee (%)
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
                    className="w-full pl-10 pr-3.5 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-black text-base"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-100 space-y-3">
                <h5 className="font-black text-neutral-950 text-sm">InstaPay Target Account</h5>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">InstaPay Address (IPA)</label>
                  <input
                    type="text"
                    required
                    value={editInstapayAddress}
                    onChange={(e) => setEditInstapayAddress(e.target.value)}
                    placeholder="shein.orders@instapay"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Account Display Name</label>
                  <input
                    type="text"
                    required
                    value={editInstapayName}
                    onChange={(e) => setEditInstapayName(e.target.value)}
                    placeholder="SHEIN Concierge Egypt"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-100 space-y-3">
                <h5 className="font-black text-neutral-950 text-sm">Vodafone Cash Target Wallet</h5>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    Vodafone Cash Mobile Number
                  </label>
                  <input
                    type="text"
                    required
                    value={editVodafoneNumber}
                    onChange={(e) => setEditVodafoneNumber(e.target.value)}
                    placeholder="010XXXXXXXX"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setSettingsOpen(false)}
                  className="px-4 py-2 font-bold text-neutral-500 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-6 py-2.5 bg-neutral-950 hover:bg-neutral-800 text-white font-black rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {savingSettings ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} defaultRole="admin" />
    </div>
  );
}
