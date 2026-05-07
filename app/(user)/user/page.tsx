"use client";

import React, { useState, useEffect } from "react";
import {
  getLoggedInUser, addOrder, getNextReceiptNumber, generateId,
  findOrCreateCustomer, updateCustomerLoyalty, formatCurrency, getServiceOptions,
  getCustomers, sendMessage
} from "@/lib/storage";
import { LaundryItem, ServiceType, Order } from "@/lib/types";
import Receipt from "@/components/Receipt";

export default function UserHomePage() {
  const [user, setUser] = useState<{ username: string; displayName: string } | null>(null);
  const [pricelist, setPricelist] = useState(getServiceOptions());
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custAddress, setCustAddress] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [items, setItems] = useState<LaundryItem[]>([]);
  const [printOrder, setPrintOrder] = useState<Order | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const u = getLoggedInUser();
    if (u) {
      setUser(u);
      setCustName(u.displayName);
      // Auto-fill from existing customer record
      const allCustomers = getCustomers();
      const existing = allCustomers.find(c => c.name === u.displayName); 
      if (existing) {
        setCustPhone(existing.phone);
        setCustAddress(existing.address);
      }
    }
    const pl = getServiceOptions();
    setPricelist(pl);
    const defaultService = "cuci_setrika" as ServiceType;
    setItems([{ id: generateId(), service: defaultService, weight: 0, pricePerKg: pl[defaultService].pricePerKg, subtotal: 0, notes: "" }]);
  }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const updateItem = (id: string, field: string, value: unknown) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value } as LaundryItem;
        if (field === "service") updated.pricePerKg = pricelist[value as ServiceType].pricePerKg;
        if (field === "weight" || field === "service") updated.subtotal = updated.weight * updated.pricePerKg;
        return updated;
      })
    );
  };

  const addItem = () => {
    const svc = "cuci_setrika" as ServiceType;
    setItems((p) => [...p, { id: generateId(), service: svc, weight: 0, pricePerKg: pricelist[svc].pricePerKg, subtotal: 0, notes: "" }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) setItems((p) => p.filter((i) => i.id !== id));
  };

  const totalWeight = items.reduce((s, i) => s + i.weight, 0);
  const totalPrice = items.reduce((s, i) => s + i.subtotal, 0);

  const handleSubmit = () => {
    if (!custName.trim() || !custPhone.trim()) { showToast("Nama dan telepon wajib diisi."); return; }
    
    const customer = findOrCreateCustomer(custName.trim(), custPhone.trim(), custAddress.trim());
    const hasExpress = items.some((i) => i.service === "express");
    const estDone = new Date();
    estDone.setHours(estDone.getHours() + (hasExpress ? 6 : 24));

    const order: Order = {
      id: generateId(),
      receiptNumber: getNextReceiptNumber(),
      customer,
      items: items.map(i => ({ ...i, weight: i.weight || 0 })), // Allow 0 weight
      totalWeight, totalPrice,
      finalPrice: totalPrice,
      status: "pending", paymentStatus: "unpaid",
      loyaltyPointsEarned: Math.floor(totalWeight / 10),
      createdAt: new Date().toISOString(),
      estimatedDone: estDone.toISOString(),
      notes: orderNotes.trim(),
      createdBy: user?.username ?? "",
    };

    addOrder(order);
    updateCustomerLoyalty(customer.id, totalWeight, order.loyaltyPointsEarned);

    // Send automated chat message to admin
    const serviceLabels = order.items.map(i => pricelist[i.service].label).join(", ");
    const chatMsg = `Halo Admin, saya baru saja membuat pesanan baru!\n\nNo. Struk: ${order.receiptNumber}\nLayanan: ${serviceLabels}\nEstimasi Berat: ${totalWeight > 0 ? totalWeight + " kg" : "Belum ditimbang"}\nCatatan: ${order.notes || "-"}\n\nMohon segera diproses ya. Terima kasih!`;
    sendMessage(user!.username, "user", chatMsg);

    showToast(`Pesanan ${order.receiptNumber} dikirim. Silakan antar pakaian Anda untuk ditimbang.`);
    setOrderNotes("");
    const svc = "cuci_setrika" as ServiceType;
    setItems([{ id: generateId(), service: svc, weight: 0, pricePerKg: pricelist[svc].pricePerKg, subtotal: 0, notes: "" }]);
  };

  return (
    <div className="space-y-5 animate-[fadeIn_0.4s_ease-out]">
      <div>
        <h1 className="text-lg font-bold">Buat Pesanan</h1>
        <p className="text-sm mt-0.5 text-muted">Pesanan Anda akan ditimbang kembali oleh Admin</p>
      </div>

      {/* Customer Info */}
      <div className="card p-5 space-y-4">
        <p className="text-sm font-semibold text-primary uppercase tracking-wider">Data Pelanggan</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Nama</label>
            <input value={custName} readOnly className="input-field opacity-60" />
          </div>
          <div>
            <label className="form-label">Telepon *</label>
            <input value={custPhone} onChange={(e) => setCustPhone(e.target.value)} placeholder="08xxx" className="input-field" />
          </div>
        </div>
        <div>
          <label className="form-label">Alamat Penjemputan</label>
          <input value={custAddress} onChange={(e) => setCustAddress(e.target.value)} placeholder="Alamat lengkap pengiriman" className="input-field" />
        </div>
      </div>

      {/* Items */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">Layanan Laundry</p>
          <button onClick={addItem} className="text-xs font-bold text-primary hover:underline">+ Tambah Item</button>
        </div>
        {items.map((item, idx) => (
          <div key={item.id} className="p-4 rounded-xl border border-border bg-primary/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Item #{idx + 1}</span>
              {items.length > 1 && (
                <button onClick={() => removeItem(item.id)} className="text-[10px] font-bold text-red-500 hover:scale-110 transition-transform">HAPUS</button>
              )}
            </div>
            <div>
              <label className="form-label">Jenis Layanan</label>
              <select value={item.service} onChange={(e) => updateItem(item.id, "service", e.target.value)} className="input-field">
                {(Object.keys(pricelist) as ServiceType[]).map((k) => (
                  <option key={k} value={k}>{pricelist[k].label} — {formatCurrency(pricelist[k].pricePerKg)}/kg</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="form-label">Estimasi Berat (kg)</label>
                <input
                  type="number" min="0" step="0.1"
                  value={item.weight || ""}
                  onChange={(e) => updateItem(item.id, "weight", parseFloat(e.target.value) || 0)}
                  placeholder="Kosongkan jika tidak tahu" className="input-field"
                />
              </div>
              <div>
                <label className="form-label">Estimasi Biaya</label>
                <div className="input-field font-bold flex items-center text-primary">
                  {item.weight > 0 ? formatCurrency(item.subtotal) : "Menunggu Timbangan"}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Notes */}
      <div className="card p-5">
        <label className="form-label">Catatan Tambahan</label>
        <textarea 
          value={orderNotes} 
          onChange={(e) => setOrderNotes(e.target.value)} 
          placeholder="Contoh: Parfum Sakura, pisah baju putih, dll." 
          className="input-field min-h-[80px]"
        />
      </div>

      {/* Summary */}
      <div className="card p-5 space-y-4">
        <div className="p-4 rounded-xl bg-primary/5 space-y-2 border border-primary/10">
          <div className="flex justify-between text-xs">
            <span className="text-muted">Total Estimasi Berat</span>
            <span className="font-bold">{totalWeight > 0 ? `${totalWeight} kg` : "—"}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-primary/20">
            <span className="text-sm font-bold uppercase tracking-tighter">Estimasi Total</span>
            <span className="text-lg font-extrabold text-primary">{totalWeight > 0 ? formatCurrency(totalPrice) : "Dihitung Admin"}</span>
          </div>
        </div>
        <button onClick={handleSubmit} className="btn-primary w-full py-4 text-sm font-bold shadow-xl shadow-primary/20 transition-all active:scale-95">
          Kirim Pesanan Sekarang
        </button>
        <p className="text-[10px] text-center text-muted px-4 leading-relaxed">
          Dengan menekan tombol di atas, Anda menyetujui Ketentuan Layanan Ungu Laundry.
        </p>
      </div>

      {toast && <div className="toast-container"><div className="toast">{toast}</div></div>}
    </div>
  );
}
