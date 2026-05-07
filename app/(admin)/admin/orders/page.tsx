"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getOrders, updateOrder, deleteOrder, formatCurrency, formatDate, sendMessage } from "@/lib/storage";
import { Order, OrderStatus, PaymentStatus, STATUS_CONFIG } from "@/lib/types";

const ORDER_STATUSES: OrderStatus[] = ["pending", "washing", "drying", "ironing", "done", "delivered"];

function EditOrderModal({ order, onClose, onSave }: { order: Order; onClose: () => void; onSave: (id: string, updates: any) => void }) {
  const [weight, setWeight] = useState(order.totalWeight);
  const [notes, setNotes] = useState(order.notes);

  const handleSave = () => {
    const pricePerKg = order.items[0]?.pricePerKg || 8000;
    const finalPrice = weight * pricePerKg;
    
    const updates = {
      totalWeight: weight,
      totalPrice: finalPrice,
      finalPrice: finalPrice,
      notes: notes,
      items: order.items.map(i => ({ ...i, weight: weight, subtotal: weight * i.pricePerKg }))
    };

    onSave(order.id, updates);

    // Send automated chat to user
    const msg = `Halo ${order.customer.name},\n\nPesanan Anda (${order.receiptNumber}) telah selesai ditimbang.\n\nDetail:\n- Berat: ${weight} kg\n- Total Biaya: ${formatCurrency(finalPrice)}\n\nSilakan melakukan pembayaran melalui:\n- BCA: 4373160311 \n- Dana: 083823223372\n\nKirim bukti transfer di sini ya. Terima kasih!`;
    sendMessage(order.createdBy, "admin", msg);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold">Edit & Timbang</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="form-label">Berat Final (kg)</label>
            <input 
              type="number" step="0.1" 
              value={weight} 
              onChange={(e) => setWeight(parseFloat(e.target.value) || 0)} 
              className="input-field text-lg font-bold" 
            />
          </div>
          <div>
            <label className="form-label">Catatan Admin</label>
            <textarea 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              className="input-field min-h-[80px] text-sm"
              placeholder="Tambahkan catatan jika ada..."
            />
          </div>
          <div className="p-3 bg-primary/5 rounded-xl">
            <div className="flex justify-between text-xs mb-1">
              <span>Total Estimasi</span>
              <span className="font-bold">{formatCurrency(weight * (order.items[0]?.pricePerKg || 8000))}</span>
            </div>
          </div>
        </div>
        <div className="p-5 bg-gray-50 flex gap-3">
          <button onClick={onClose} className="btn-ghost flex-1">Batal</button>
          <button onClick={handleSave} className="btn-primary flex-1">Simpan & Kirim</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | OrderStatus>("all");
  const [filterPay, setFilterPay] = useState<"all" | PaymentStatus>("all");
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const refresh = useCallback(() => setOrders(getOrders()), []);
  useEffect(() => { refresh(); }, [refresh]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleStatusChange = (id: string, status: OrderStatus) => {
    updateOrder(id, { status });
    
    // Auto message if status is "done"
    if (status === "done") {
      const order = orders.find(o => o.id === id);
      if (order) {
        const msg = `Halo ${order.customer.name},\n\nKabar baik! Pesanan Anda (${order.receiptNumber}) sudah SELESAI dan siap diantar/diambil.\n\nTerima kasih telah menggunakan layanan Ungu Laundry!`;
        sendMessage(order.createdBy, "admin", msg);
      }
    }

    refresh();
    showToast("Status pesanan diperbarui.");
  };

  const handleUpdateOrder = (id: string, updates: any) => {
    updateOrder(id, updates);
    setEditingOrder(null);
    refresh();
    showToast("Pesanan berhasil diperbarui & tagihan dikirim.");
  };

  const handlePaymentToggle = (id: string, current: PaymentStatus) => {
    updateOrder(id, { paymentStatus: current === "paid" ? "unpaid" : "paid" });
    refresh();
    showToast("Status pembayaran diperbarui.");
  };

  const handleDelete = (id: string) => {
    if (!confirm("Hapus pesanan ini?")) return;
    deleteOrder(id);
    refresh();
    showToast("Pesanan dihapus.");
  };

  const filtered = orders.filter((o) => {
    const matchSearch =
      !search ||
      o.customer.name.toLowerCase().includes(search.toLowerCase()) ||
      o.receiptNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.phone.includes(search);
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    const matchPay = filterPay === "all" || o.paymentStatus === filterPay;
    return matchSearch && matchStatus && matchPay;
  });

  return (
    <div className="space-y-5 animate-[fadeIn_0.4s_ease-out]">
      {editingOrder && (
        <EditOrderModal 
          order={editingOrder} 
          onClose={() => setEditingOrder(null)} 
          onSave={handleUpdateOrder} 
        />
      )}

      <div>
        <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>Manajemen Pesanan</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>{orders.length} total pesanan</p>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col md:flex-row gap-3 bg-white">
        <div className="relative flex-1 group">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, telepon, atau nomor struk..."
            className="w-full bg-gray-100/80 border-none rounded-xl py-3 pl-11 pr-4 text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none"
          />
          <svg className="absolute left-4 top-3.5 text-muted group-focus-within:text-primary transition-colors" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        </div>
        <div className="flex gap-2">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="input-field w-full md:w-44 rounded-xl py-3">
            <option value="all">Semua Status</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
            ))}
          </select>
          <select value={filterPay} onChange={(e) => setFilterPay(e.target.value as any)} className="input-field w-full md:w-40 rounded-xl py-3">
            <option value="all">Semua Pembayaran</option>
            <option value="unpaid">Belum Lunas</option>
            <option value="paid">Lunas</option>
          </select>
        </div>
      </div>

      {/* Table (Desktop) & List (Mobile) */}
      <div className="card overflow-hidden">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-muted text-sm">Tidak ada pesanan.</div>
          ) : (
            <table className="table-base">
              <thead>
                <tr>
                  <th>Struk</th>
                  <th>Pelanggan</th>
                  <th>Layanan</th>
                  <th>Total</th>
                  <th>Status Kerja</th>
                  <th>Pembayaran</th>
                  <th>Tanggal</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr key={order.id}>
                    <td className="font-mono text-xs whitespace-nowrap">{order.receiptNumber}</td>
                    <td>
                      <p className="font-medium text-sm">{order.customer.name}</p>
                      <p className="text-xs text-muted">{order.customer.phone}</p>
                    </td>
                    <td>
                      <p className="text-sm">{order.totalWeight} kg</p>
                      <p className="text-xs text-muted">{order.items.length} layanan</p>
                    </td>
                    <td className="font-semibold text-sm">{formatCurrency(order.finalPrice)}</td>
                    <td>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                        className="input-field text-xs py-1.5 w-32"
                      >
                        {ORDER_STATUSES.map((s) => (
                          <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        onClick={() => handlePaymentToggle(order.id, order.paymentStatus)}
                        className="status-chip border-none cursor-pointer"
                        style={{
                          background: order.paymentStatus === "paid" ? "#D1FAE5" : "#FEE2E2",
                          color: order.paymentStatus === "paid" ? "#065F46" : "#991B1B",
                        }}
                      >
                        {order.paymentStatus === "paid" ? "Lunas" : "Belum Lunas"}
                      </button>
                    </td>
                    <td className="text-xs text-muted whitespace-nowrap">
                      {formatDate(order.createdAt)}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingOrder(order)} className="p-2 text-primary hover:bg-primary-50 rounded-lg transition-colors">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button onClick={() => handleDelete(order.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-gray-100">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-muted text-sm">Tidak ada pesanan.</div>
          ) : (
            filtered.map((order) => (
              <div key={order.id} className="p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono text-primary bg-primary-50 px-2 py-0.5 rounded-full font-bold">
                      {order.receiptNumber}
                    </span>
                    <p className="font-bold text-sm mt-1.5">{order.customer.name}</p>
                    <p className="text-xs text-muted">{order.customer.phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">{formatCurrency(order.finalPrice)}</p>
                    <p className="text-[10px] text-muted mt-0.5">{formatDate(order.createdAt)}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 items-center justify-between">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePaymentToggle(order.id, order.paymentStatus)}
                      className="status-chip border-none"
                      style={{
                        background: order.paymentStatus === "paid" ? "#D1FAE5" : "#FEE2E2",
                        color: order.paymentStatus === "paid" ? "#065F46" : "#991B1B",
                      }}
                    >
                      {order.paymentStatus === "paid" ? "Lunas" : "Belum Lunas"}
                    </button>
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                      className="text-xs font-semibold bg-gray-100 border-none rounded-full px-3 py-1 outline-none"
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingOrder(order)} className="p-2 text-primary">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button onClick={() => handleDelete(order.id)} className="p-2 text-red-600">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {toast && (
        <div className="toast-container">
          <div className="toast">{toast}</div>
        </div>
      )}
    </div>
  );
}
