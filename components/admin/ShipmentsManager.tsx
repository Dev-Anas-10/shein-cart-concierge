'use client';

import React, { useState } from 'react';
import { Shipment, Order, ShipmentStatus } from '@/lib/types';
import { SafeImage } from '@/components/SafeImage';
import {
  Package,
  Plus,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  Users,
  Search,
  ExternalLink,
  Trash2,
  Edit3,
  Calendar,
  X,
  Check,
  ChevronRight,
  Boxes,
  Info,
} from 'lucide-react';

interface ShipmentsManagerProps {
  shipments: Shipment[];
  orders: Order[];
  onRefresh: () => void;
  onAssignOrders: (shipmentId: string, orderIds: string[]) => Promise<void>;
  onRemoveOrders: (shipmentId: string, orderIds: string[]) => Promise<void>;
  onExportManifest: (shipment: Shipment) => void;
  addToast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

export const SHIPMENT_STATUS_MAP: Record<
  ShipmentStatus,
  { label: string; color: string; bg: string; border: string; icon: any }
> = {
  PREPARING: {
    label: 'قيد التجهيز والتجميع',
    color: 'text-amber-800 dark:text-amber-300',
    bg: 'bg-amber-100 dark:bg-amber-950/60',
    border: 'border-amber-300 dark:border-amber-800',
    icon: Clock,
  },
  PURCHASED: {
    label: 'تم الشراء من شي إن',
    color: 'text-blue-800 dark:text-blue-300',
    bg: 'bg-blue-100 dark:bg-blue-950/60',
    border: 'border-blue-300 dark:border-blue-800',
    icon: CheckCircle2,
  },
  IN_TRANSIT: {
    label: 'في الشحن الدولي لمصر',
    color: 'text-purple-800 dark:text-purple-300',
    bg: 'bg-purple-100 dark:bg-purple-950/60',
    border: 'border-purple-300 dark:border-purple-800',
    icon: Truck,
  },
  CUSTOMS: {
    label: 'في التخليص الجمركي',
    color: 'text-orange-800 dark:text-orange-300',
    bg: 'bg-orange-100 dark:bg-orange-950/60',
    border: 'border-orange-300 dark:border-orange-800',
    icon: AlertCircle,
  },
  ARRIVED_LOCAL: {
    label: 'وصلت المخزن بمصر',
    color: 'text-teal-800 dark:text-teal-300',
    bg: 'bg-teal-100 dark:bg-teal-950/60',
    border: 'border-teal-300 dark:border-teal-800',
    icon: Boxes,
  },
  OUT_FOR_DELIVERY: {
    label: 'جاري التوزيع الداخلي',
    color: 'text-cyan-800 dark:text-cyan-300',
    bg: 'bg-cyan-100 dark:bg-cyan-950/60',
    border: 'border-cyan-300 dark:border-cyan-800',
    icon: Truck,
  },
  COMPLETED: {
    label: 'مكتملة ومسلمة للعملاء',
    color: 'text-emerald-800 dark:text-emerald-300',
    bg: 'bg-emerald-100 dark:bg-emerald-950/60',
    border: 'border-emerald-300 dark:border-emerald-800',
    icon: CheckCircle2,
  },
};

export function ShipmentsManager({
  shipments,
  orders,
  onRefresh,
  onAssignOrders,
  onRemoveOrders,
  onExportManifest,
  addToast,
}: ShipmentsManagerProps) {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedShipmentForDetail, setSelectedShipmentForDetail] = useState<Shipment | null>(null);
  const [selectedShipmentForAddOrders, setSelectedShipmentForAddOrders] = useState<Shipment | null>(null);
  const [selectedShipmentForEdit, setSelectedShipmentForEdit] = useState<Shipment | null>(null);

  // Form states for creation
  const [newCode, setNewCode] = useState('');
  const [newMaxItems, setNewMaxItems] = useState(50);
  const [newMaxOrders, setNewMaxOrders] = useState(15);
  const [newCarrier, setNewCarrier] = useState('Aramex');
  const [newTracking, setNewTracking] = useState('');
  const [newTrackingUrl, setNewTrackingUrl] = useState('');
  const [newEstimatedArrival, setNewEstimatedArrival] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [creatingLoading, setCreatingLoading] = useState(false);

  // Add orders selection state
  const [selectedOrderIdsToAdd, setSelectedOrderIdsToAdd] = useState<string[]>([]);
  const [addingLoading, setAddingLoading] = useState(false);

  // Compute metrics across shipments
  const totalShipments = shipments.length;
  const activeShipments = shipments.filter((s) => s.status !== 'COMPLETED').length;

  const totalItemsInShipments = shipments.reduce((sum, s) => {
    const sOrders = orders.filter((o) => o.shipmentId === s.id || (s.orderIds && s.orderIds.includes(o.id)));
    return sum + sOrders.reduce((iSum, o) => iSum + (o.itemsCount || o.items?.length || 0), 0);
  }, 0);

  const totalValueInShipments = shipments.reduce((sum, s) => {
    const sOrders = orders.filter((o) => o.shipmentId === s.id || (s.orderIds && s.orderIds.includes(o.id)));
    return sum + sOrders.reduce((vSum, o) => vSum + (o.totalCash || 0), 0);
  }, 0);

  // Filter shipments
  const filteredShipments = shipments.filter((s) => {
    if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.code.toLowerCase().includes(q) ||
        (s.carrier && s.carrier.toLowerCase().includes(q)) ||
        (s.trackingNumber && s.trackingNumber.toLowerCase().includes(q)) ||
        (s.notes && s.notes.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Handle Create Shipment
  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) {
      addToast('error', 'يرجى إدخال كود أو اسم للشحنة');
      return;
    }

    setCreatingLoading(true);
    try {
      const res = await fetch('/api/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCode.trim(),
          maxItems: Number(newMaxItems) || 50,
          maxOrders: Number(newMaxOrders) || 15,
          carrier: newCarrier.trim() || undefined,
          trackingNumber: newTracking.trim() || undefined,
          trackingUrl: newTrackingUrl.trim() || undefined,
          estimatedArrival: newEstimatedArrival.trim() || undefined,
          notes: newNotes.trim() || undefined,
          status: 'PREPARING',
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'فشل إنشاء الشحنة');

      addToast('success', `تم إنشاء الشحنة "${newCode}" بنجاح!`);
      setIsCreateOpen(false);
      setNewCode('');
      setNewTracking('');
      setNewTrackingUrl('');
      setNewEstimatedArrival('');
      setNewNotes('');
      onRefresh();
    } catch (err: any) {
      addToast('error', err.message);
    } finally {
      setCreatingLoading(false);
    }
  };

  // Handle Update Shipment
  const handleUpdateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipmentForEdit) return;

    try {
      const res = await fetch('/api/shipments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedShipmentForEdit),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'فشل تحديث الشحنة');

      addToast('success', `تم تحديث الشحنة "${selectedShipmentForEdit.code}" بنجاح!`);
      setSelectedShipmentForEdit(null);
      onRefresh();
    } catch (err: any) {
      addToast('error', err.message);
    }
  };

  // Handle Delete Shipment
  const handleDeleteShipment = async (shipment: Shipment) => {
    if (!confirm(`هل أنت متأكد من حذف الشحنة "${shipment.code}"؟ سيتم إلغاء إسناد جميع الطلبات التابعة لها.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/shipments?id=${shipment.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'فشل حذف الشحنة');

      addToast('info', `تم حذف الشحنة "${shipment.code}" بنجاح`);
      onRefresh();
    } catch (err: any) {
      addToast('error', err.message);
    }
  };

  // Handle Submit Add Orders
  const handleSubmitAddOrders = async () => {
    if (!selectedShipmentForAddOrders || selectedOrderIdsToAdd.length === 0) return;
    setAddingLoading(true);
    try {
      await onAssignOrders(selectedShipmentForAddOrders.id, selectedOrderIdsToAdd);
      setSelectedShipmentForAddOrders(null);
      setSelectedOrderIdsToAdd([]);
      onRefresh();
    } catch (err: any) {
      addToast('error', err.message);
    } finally {
      setAddingLoading(false);
    }
  };

  // Unassigned orders eligible to be added
  const unassignedOrders = orders.filter((o) => !o.shipmentId);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Shipments High-Impact Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#14111d] p-5 rounded-3xl border border-neutral-200/80 dark:border-[#2a243a] shadow-xs">
          <div className="flex items-center justify-between text-neutral-400 dark:text-neutral-500 text-xs font-bold mb-2">
            <span>إجمالي الشحنات</span>
            <Package className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-3xl font-black text-neutral-950 dark:text-white">{totalShipments}</div>
          <div className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1">
            {activeShipments} شحنات جارية
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/20 p-5 rounded-3xl border border-purple-200 dark:border-purple-800/60 shadow-xs">
          <div className="flex items-center justify-between text-purple-900 dark:text-purple-300 text-xs font-bold mb-2">
            <span>القطع في الشحن</span>
            <Boxes className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-3xl font-black text-purple-600 dark:text-purple-400">
            {totalItemsInShipments}{' '}
            <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">قطعة</span>
          </div>
          <div className="text-[11px] text-purple-800 dark:text-purple-300 font-bold mt-1">
            موزعة على دفعات
          </div>
        </div>

        <div className="bg-white dark:bg-[#14111d] p-5 rounded-3xl border border-emerald-200 dark:border-emerald-900/50 shadow-xs">
          <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-400 text-xs font-bold mb-2">
            <span>إجمالي قيمة الشحنات</span>
            <Truck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {totalValueInShipments.toLocaleString()}{' '}
            <span className="text-xs font-bold">ج.م</span>
          </div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1">
            كافة الطلبات المسندة
          </div>
        </div>

        <div className="bg-white dark:bg-[#14111d] p-5 rounded-3xl border border-amber-200 dark:border-amber-900/50 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-800 dark:text-amber-400 text-xs font-bold mb-2">
            <span>طلبات بدون شحنة</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-black text-amber-600 dark:text-amber-400">
            {unassignedOrders.length}
          </div>
          <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-1">
            تحتاج للتوزيع على شحنة
          </div>
        </div>
      </div>

      {/* Control Bar & Actions */}
      <div className="bg-white dark:bg-[#14111d] p-4 rounded-3xl border border-neutral-200/80 dark:border-[#2a243a] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {[
            { key: 'ALL', label: 'الكل' },
            { key: 'PREPARING', label: '🟡 قيد التجهيز' },
            { key: 'IN_TRANSIT', label: '🟣 شحن دولي' },
            { key: 'CUSTOMS', label: '🟠 في الجمارك' },
            { key: 'ARRIVED_LOCAL', label: '🟢 بالمخزن' },
            { key: 'COMPLETED', label: '✓ مكتملة' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === tab.key
                  ? 'bg-neutral-950 dark:bg-purple-600 text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-[#201a2e]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بكود الشحنة أو شركة الشحن..."
              className="w-full pr-8 pl-3 py-2 text-xs bg-neutral-50 dark:bg-[#1a1626] border border-neutral-200 dark:border-[#2f2742] text-neutral-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-purple-600/20 active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>إنشاء شحنة جديدة</span>
          </button>
        </div>
      </div>

      {/* Shipments Cards Grid */}
      {filteredShipments.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#14111d] rounded-3xl border border-neutral-200/80 dark:border-[#2a243a]">
          <Package className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
          <h4 className="font-black text-neutral-950 dark:text-white text-base">لا توجد شحنات مطابقة</h4>
          <p className="text-xs text-neutral-500 mt-1">
            اضغط على زر &quot;إنشاء شحنة جديدة&quot; لبدء تقسيم وتجميع الطلبيات في دفعات شحن.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredShipments.map((shipment) => {
            const shipmentOrders = orders.filter(
              (o) => o.shipmentId === shipment.id || (shipment.orderIds && shipment.orderIds.includes(o.id))
            );

            const totalItems = shipmentOrders.reduce(
              (sum, o) => sum + (o.itemsCount || o.items?.length || 0),
              0
            );

            const totalEgp = shipmentOrders.reduce((sum, o) => sum + (o.totalCash || 0), 0);
            const maxItems = shipment.maxItems || 50;
            const percentage = Math.min(100, Math.round((totalItems / maxItems) * 100));

            const isFull = totalItems >= maxItems;
            const statusConfig = SHIPMENT_STATUS_MAP[shipment.status] || SHIPMENT_STATUS_MAP.PREPARING;
            const StatusIcon = statusConfig.icon;

            // Unique customers roster
            const uniqueCustomers = Array.from(
              new Map(shipmentOrders.map((o) => [o.userPhone || o.userName, o])).values()
            );

            return (
              <div
                key={shipment.id}
                className="bg-white dark:bg-[#14111d] rounded-3xl border border-neutral-200/80 dark:border-[#2a243a] shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Card Top */}
                <div className="p-5 space-y-4">
                  {/* Header & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-neutral-400 bg-neutral-100 dark:bg-[#201a2e] px-2 py-0.5 rounded-md font-bold">
                          {shipment.id}
                        </span>
                        {isFull && (
                          <span className="text-[10px] bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-black px-2 py-0.5 rounded-full border border-rose-200">
                            مكتملة السعة
                          </span>
                        )}
                      </div>
                      <h3 className="font-black text-neutral-950 dark:text-white text-base mt-1.5 truncate">
                        {shipment.code}
                      </h3>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-extrabold border shrink-0 ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border}`}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      <span>{statusConfig.label}</span>
                    </span>
                  </div>

                  {/* Capacity Bar */}
                  <div className="space-y-1.5 p-3 rounded-2xl bg-neutral-50 dark:bg-[#181423] border border-neutral-200/60 dark:border-[#2f2742]">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-neutral-500 dark:text-neutral-400 text-[11px]">
                        سعة الشحنة (القطع)
                      </span>
                      <span className="font-black text-neutral-900 dark:text-white">
                        {totalItems} / {maxItems} قطعة{' '}
                        <span className="text-[10px] text-neutral-400 font-mono">({percentage}%)</span>
                      </span>
                    </div>

                    {/* Progress Bar Track */}
                    <div className="w-full h-2.5 rounded-full bg-neutral-200 dark:bg-[#261f36] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          percentage >= 100
                            ? 'bg-rose-500'
                            : percentage >= 75
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1">
                      <span>{shipmentOrders.length} طلبات</span>
                      <span>{totalEgp.toLocaleString()} ج.م الإجمالي</span>
                    </div>
                  </div>

                  {/* Logistics Carrier Info */}
                  <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-300 pt-1 border-t border-neutral-100 dark:border-[#241e33]">
                    <div className="flex items-center gap-2">
                      <Truck className="w-3.5 h-3.5 text-purple-600" />
                      <span className="font-bold">{shipment.carrier || 'الشحن الدولي'}</span>
                    </div>
                    {shipment.trackingNumber ? (
                      <span className="font-mono text-[11px] font-black text-purple-600 dark:text-purple-400">
                        {shipment.trackingNumber}
                      </span>
                    ) : (
                      <span className="text-[11px] text-neutral-400">لم يسجل كود تتبع</span>
                    )}
                  </div>

                  {/* Customers Roster Preview */}
                  {uniqueCustomers.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-neutral-100 dark:border-[#241e33]">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                        عملاء هذه الشحنة ({uniqueCustomers.length}):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {uniqueCustomers.slice(0, 4).map((c) => (
                          <span
                            key={c.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-neutral-100 dark:bg-[#201a2e] text-[11px] font-bold text-neutral-800 dark:text-neutral-200"
                          >
                            <Users className="w-3 h-3 text-purple-600" />
                            <span className="truncate max-w-[120px]">{c.userName}</span>
                          </span>
                        ))}
                        {uniqueCustomers.length > 4 && (
                          <span className="text-[10px] font-black text-purple-600 bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded-lg">
                            +{uniqueCustomers.length - 4} آخرين
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Actions Bottom Bar */}
                <div className="p-4 bg-neutral-50/80 dark:bg-[#181423] border-t border-neutral-200/80 dark:border-[#2a243a] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedShipmentForDetail(shipment)}
                      className="px-3 py-1.5 bg-neutral-950 dark:bg-purple-600 hover:bg-neutral-800 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
                    >
                      <Users className="w-3 h-3" />
                      <span>كشف الشحنة</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onExportManifest(shipment)}
                      className="p-1.5 rounded-xl bg-white dark:bg-[#201a2e] border border-neutral-200 dark:border-[#2f2742] text-neutral-700 dark:text-neutral-300 hover:text-purple-600 transition-colors cursor-pointer"
                      title="تصدير بيان الشحنة CSV"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedShipmentForAddOrders(shipment)}
                      className="px-2.5 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-bold hover:bg-purple-100 transition-colors cursor-pointer"
                    >
                      <span>+ إضافة طلبات</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setSelectedShipmentForEdit({ ...shipment })}
                      className="p-1.5 rounded-xl hover:bg-neutral-200 dark:hover:bg-[#261f36] text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
                      title="تعديل الشحنة"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteShipment(shipment)}
                      className="p-1.5 rounded-xl hover:bg-rose-100 text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="حذف الشحنة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODAL 1: CREATE NEW SHIPMENT ── */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white dark:bg-[#14111d] rounded-3xl shadow-2xl border border-neutral-200 dark:border-[#2a243a] p-6 space-y-5 text-right">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-[#241e33]">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-600" />
                <h3 className="font-black text-lg text-neutral-950 dark:text-white">
                  إنشاء دفعة شحن جديدة (New Shipment)
                </h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-white rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateShipment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  كود أو اسم الشحنة <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="مثال: شحنة الرياض رقم 12 أو SHP-NOV-01"
                  className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-[#1a1626] border border-neutral-200 dark:border-[#2f2742] rounded-xl text-xs font-bold text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    الحد الأقصى للقطع (سعة الشحنة)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={newMaxItems}
                    onChange={(e) => setNewMaxItems(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-[#1a1626] border border-neutral-200 dark:border-[#2f2742] rounded-xl text-xs font-mono font-bold text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                  <span className="text-[10px] text-neutral-400 mt-0.5 block">
                    يمنع تجاوز السعة المحددة
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    أقصى عدد طلبات
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newMaxOrders}
                    onChange={(e) => setNewMaxOrders(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-[#1a1626] border border-neutral-200 dark:border-[#2f2742] rounded-xl text-xs font-mono font-bold text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    شركة الشحن الناقلة
                  </label>
                  <input
                    type="text"
                    value={newCarrier}
                    onChange={(e) => setNewCarrier(e.target.value)}
                    placeholder="مثال: Aramex / SMSA / DHL"
                    className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-[#1a1626] border border-neutral-200 dark:border-[#2f2742] rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    رقم التتبع الدولي
                  </label>
                  <input
                    type="text"
                    value={newTracking}
                    onChange={(e) => setNewTracking(e.target.value)}
                    placeholder="AWB / Tracking Number"
                    className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-[#1a1626] border border-neutral-200 dark:border-[#2f2742] rounded-xl text-xs font-mono text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  تاريخ الوصول المتوقع إلى مصر
                </label>
                <input
                  type="date"
                  value={newEstimatedArrival}
                  onChange={(e) => setNewEstimatedArrival(e.target.value)}
                  className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-[#1a1626] border border-neutral-200 dark:border-[#2f2742] rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  ملاحظات تنظيمية للمشرف
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="أي تفاصيل خاصة بالجمارك أو الشحن الجوي..."
                  className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-[#1a1626] border border-neutral-200 dark:border-[#2f2742] rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-[#241e33]">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-[#201a2e]"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={creatingLoading}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-purple-600/20 active:scale-95 cursor-pointer"
                >
                  {creatingLoading ? 'جاري الإنشاء...' : 'حفظ وإنشاء الشحنة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: SHIPMENT MANIFEST & CUSTOMERS ROSTER ── */}
      {selectedShipmentForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-[#14111d] rounded-3xl shadow-2xl border border-neutral-200 dark:border-[#2a243a] flex flex-col overflow-hidden text-right">
            {/* Modal Header */}
            <div className="p-6 bg-neutral-50 dark:bg-[#181423] border-b border-neutral-200 dark:border-[#2a243a] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold px-2 py-0.5 rounded-md">
                    {selectedShipmentForDetail.id}
                  </span>
                  <h3 className="text-xl font-black text-neutral-950 dark:text-white">
                    بيان وكشف الشحنة: {selectedShipmentForDetail.code}
                  </h3>
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  شركة الشحن: <strong>{selectedShipmentForDetail.carrier || 'غير محدد'}</strong> • كود التتبع:{' '}
                  <span className="font-mono text-purple-600">
                    {selectedShipmentForDetail.trackingNumber || 'غير متوفر'}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onExportManifest(selectedShipmentForDetail)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>تصدير كشف الشحنة CSV</span>
                </button>
                <button
                  onClick={() => setSelectedShipmentForDetail(null)}
                  className="p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-white rounded-full cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body - Orders List */}
            <div className="p-6 overflow-y-auto space-y-4">
              {(() => {
                const sOrders = orders.filter(
                  (o) =>
                    o.shipmentId === selectedShipmentForDetail.id ||
                    (selectedShipmentForDetail.orderIds &&
                      selectedShipmentForDetail.orderIds.includes(o.id))
                );

                if (sOrders.length === 0) {
                  return (
                    <div className="p-8 text-center text-neutral-400">
                      <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="font-bold text-sm">هذه الشحنة لا تحتوي على طلبات حالياً.</p>
                      <button
                        onClick={() => {
                          const s = selectedShipmentForDetail;
                          setSelectedShipmentForDetail(null);
                          setSelectedShipmentForAddOrders(s);
                        }}
                        className="mt-3 px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-xl"
                      >
                        إضافة طلبات الآن
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-neutral-500 pb-2 border-b border-neutral-100 dark:border-[#241e33]">
                      <span>تفاصيل العملاء والمنتجات في هذا الكشف ({sOrders.length} طلبات):</span>
                      <span>
                        الإجمالي: {sOrders.reduce((s, o) => s + (o.totalCash || 0), 0).toLocaleString()} ج.م
                      </span>
                    </div>

                    <div className="divide-y divide-neutral-100 dark:divide-[#241e33]">
                      {sOrders.map((ord) => (
                        <div key={ord.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="space-y-1.5 min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-sm text-neutral-900 dark:text-white">
                                #{ord.id}
                              </span>
                              <span className="font-bold text-xs text-neutral-900 dark:text-white">
                                {ord.userName}
                              </span>
                              <span className="text-[11px] font-mono text-neutral-500">
                                📞 {ord.userPhone}
                              </span>
                            </div>

                            {ord.shippingAddress && (
                              <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
                                📍 {ord.shippingAddress}
                              </p>
                            )}

                            {ord.customerNotes && (
                              <p className="text-[11px] text-amber-700 bg-amber-50 dark:bg-amber-950/40 p-1.5 rounded-lg border border-amber-200/60">
                                📝 ملاحظة العميل: {ord.customerNotes}
                              </p>
                            )}

                            {/* Items Thumbnails */}
                            <div className="flex items-center gap-2 pt-1 overflow-x-auto">
                              {ord.items.map((it, idx) => (
                                <div
                                  key={idx}
                                  className="w-9 h-11 rounded-lg overflow-hidden border border-neutral-200 dark:border-[#2f2742] shrink-0"
                                  title={`${it.name} (${it.size || ''})`}
                                >
                                  <SafeImage
                                    src={it.image}
                                    alt={it.name || 'item'}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                              <span className="text-[11px] font-bold text-neutral-500">
                                {ord.items.length} قطع
                              </span>
                            </div>
                          </div>

                          <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 shrink-0">
                            <span className="font-black text-sm text-neutral-950 dark:text-white">
                              {ord.totalCash.toLocaleString()} ج.م
                            </span>
                            <button
                              type="button"
                              onClick={async () => {
                                if (confirm(`إزالة الطلب #${ord.id} من الشحنة؟`)) {
                                  await onRemoveOrders(selectedShipmentForDetail.id, [ord.id]);
                                  onRefresh();
                                }
                              }}
                              className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                            >
                              إزالة من الشحنة
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: ADD ORDERS TO SHIPMENT ── */}
      {selectedShipmentForAddOrders && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-2xl max-h-[88vh] bg-white dark:bg-[#14111d] rounded-3xl shadow-2xl border border-neutral-200 dark:border-[#2a243a] flex flex-col overflow-hidden text-right">
            <div className="p-6 bg-neutral-50 dark:bg-[#181423] border-b border-neutral-200 dark:border-[#2a243a] flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-neutral-950 dark:text-white">
                  إضافة طلبات إلى الشحنة: {selectedShipmentForAddOrders.code}
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  حدد الطلبات غير المسندة لإضافتها ضمن هذه الدفعة.
                </p>
              </div>
              <button
                onClick={() => setSelectedShipmentForAddOrders(null)}
                className="p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-white rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3">
              {unassignedOrders.length === 0 ? (
                <div className="p-8 text-center text-neutral-400">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                  <p className="font-bold text-sm">جميع الطلبات مسندة إلى شحنات بالفعل!</p>
                </div>
              ) : (
                unassignedOrders.map((ord) => {
                  const isSelected = selectedOrderIdsToAdd.includes(ord.id);
                  return (
                    <div
                      key={ord.id}
                      onClick={() => {
                        setSelectedOrderIdsToAdd((prev) =>
                          isSelected ? prev.filter((id) => id !== ord.id) : [...prev, ord.id]
                        );
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-purple-600 bg-purple-50/60 dark:bg-purple-950/40 shadow-xs'
                          : 'border-neutral-200/80 dark:border-[#2f2742] hover:bg-neutral-50 dark:hover:bg-[#1c1728]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-xs text-neutral-900 dark:text-white">
                              #{ord.id}
                            </span>
                            <span className="font-bold text-xs text-neutral-800 dark:text-neutral-200">
                              {ord.userName}
                            </span>
                            <span className="text-[10px] text-neutral-400 font-mono">
                              {ord.userPhone}
                            </span>
                          </div>
                          <span className="text-[11px] text-neutral-500 block mt-0.5">
                            {ord.items.length} قطع • {ord.totalCash.toLocaleString()} ج.م
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {ord.items.slice(0, 3).map((it, idx) => (
                          <div
                            key={idx}
                            className="w-7 h-9 rounded-md overflow-hidden border border-neutral-200 dark:border-[#2f2742]"
                          >
                            <SafeImage
                              src={it.image}
                              alt={it.name || 'item'}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 bg-neutral-50 dark:bg-[#181423] border-t border-neutral-200 dark:border-[#2a243a] flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400">
                تم تحديد: {selectedOrderIdsToAdd.length} طلبات
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedShipmentForAddOrders(null)}
                  className="px-4 py-2 text-xs font-bold text-neutral-500 hover:text-neutral-800"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={selectedOrderIdsToAdd.length === 0 || addingLoading}
                  onClick={handleSubmitAddOrders}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-sm transition-all"
                >
                  {addingLoading ? 'جاري الإسناد...' : 'تأكيد الإسناد للشحنة'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 4: EDIT SHIPMENT STATUS / DETAILS ── */}
      {selectedShipmentForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white dark:bg-[#14111d] rounded-3xl shadow-2xl border border-neutral-200 dark:border-[#2a243a] p-6 space-y-4 text-right">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-[#241e33]">
              <h3 className="font-black text-lg text-neutral-950 dark:text-white">
                تعديل بيانات الشحنة: {selectedShipmentForEdit.code}
              </h3>
              <button
                onClick={() => setSelectedShipmentForEdit(null)}
                className="p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-white rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateShipment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  حالة الشحنة الحالية
                </label>
                <select
                  value={selectedShipmentForEdit.status}
                  onChange={(e) =>
                    setSelectedShipmentForEdit({
                      ...selectedShipmentForEdit,
                      status: e.target.value as ShipmentStatus,
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-[#1a1626] border border-neutral-200 dark:border-[#2f2742] rounded-xl text-xs font-bold text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600 cursor-pointer"
                >
                  <option value="PREPARING">🟡 قيد التجهيز والتجميع</option>
                  <option value="PURCHASED">🔵 تم الشراء من شي إن</option>
                  <option value="IN_TRANSIT">🟣 في الشحن الدولي لمصر</option>
                  <option value="CUSTOMS">🟠 في التخليص الجمركي</option>
                  <option value="ARRIVED_LOCAL">🟢 وصلت المخزن بمصر</option>
                  <option value="OUT_FOR_DELIVERY">🚚 جاري التوزيع الداخلي للعملاء</option>
                  <option value="COMPLETED">✓ مكتملة ومسلمة بالكامل</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  كود / اسم الشحنة
                </label>
                <input
                  type="text"
                  value={selectedShipmentForEdit.code}
                  onChange={(e) =>
                    setSelectedShipmentForEdit({ ...selectedShipmentForEdit, code: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-[#1a1626] border border-neutral-200 dark:border-[#2f2742] rounded-xl text-xs font-bold text-neutral-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    شركة الشحن
                  </label>
                  <input
                    type="text"
                    value={selectedShipmentForEdit.carrier || ''}
                    onChange={(e) =>
                      setSelectedShipmentForEdit({ ...selectedShipmentForEdit, carrier: e.target.value })
                    }
                    className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-[#1a1626] border border-neutral-200 dark:border-[#2f2742] rounded-xl text-xs text-neutral-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    رقم التتبع الدولي
                  </label>
                  <input
                    type="text"
                    value={selectedShipmentForEdit.trackingNumber || ''}
                    onChange={(e) =>
                      setSelectedShipmentForEdit({
                        ...selectedShipmentForEdit,
                        trackingNumber: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-[#1a1626] border border-neutral-200 dark:border-[#2f2742] rounded-xl text-xs font-mono text-neutral-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  ملاحظات المشرف
                </label>
                <textarea
                  rows={2}
                  value={selectedShipmentForEdit.notes || ''}
                  onChange={(e) =>
                    setSelectedShipmentForEdit({ ...selectedShipmentForEdit, notes: e.target.value })
                  }
                  className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-[#1a1626] border border-neutral-200 dark:border-[#2f2742] rounded-xl text-xs text-neutral-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-[#241e33]">
                <button
                  type="button"
                  onClick={() => setSelectedShipmentForEdit(null)}
                  className="px-4 py-2 text-xs font-bold text-neutral-500 hover:text-neutral-800"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black shadow-sm"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
