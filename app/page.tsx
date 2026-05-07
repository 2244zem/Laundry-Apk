"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Order, LaundryItem, ServiceType, TabType,
  SERVICE_OPTIONS, AppUser,
} from "@/lib/types";
import {
  getOrders, addOrder, getNextReceiptNumber, generateId,
  findOrCreateCustomer, updateCustomerLoyalty, redeemLoyaltyPoints,
  formatCurrency, getCustomers, getLoggedInUser, logout, syncToBackend,
} from "@/lib/storage";
import LoginForm from "@/components/LoginForm";
import Receipt from "@/components/Receipt";
import TodoList from "@/components/TodoList";
import DeliveryTracker from "@/components/DeliveryTracker";
import OrderList from "@/components/OrderList";
import PaymentInfo from "@/components/PaymentInfo";

export default function Home() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("receipt");
  const [orders, setOrders] = useState<Order[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  // Receipt form
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custAddress, setCustAddress] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [items, setItems] = useState<LaundryItem[]>([
    { id: generateId(), service: "cuci_setrika", weight: 0, pricePerKg: 7000, subtotal: 0, notes: "" },
  ]);
  const [loyaltyInfo, setLoyaltyInfo] = useState<{ points: number; totalKg: number } | null>(null);
  const [applyDiscount, setApplyDiscount] = useState(false);
  const [printOrder, setPrintOrder] = useState<Order | null>(null);

  // Auth check
  useEffect(() => {
    setUser(getLoggedInUser());
    setAuthChecked(true);
  }, []);

  const refreshOrders = useCallback(() => { setOrders(getOrders()); }, []);
  useEffect(() => { if (user) refreshOrders(); }, [user, refreshOrders]);

  // Loyalty check
  useEffect(() => {
    if (custPhone.length >= 8) {
      const found = getCustomers().find(c => c.phone === custPhone);
      if (found) { setLoyaltyInfo({ points: found.loyaltyPoints, totalKg: found.totalKgWashed }); setCustName(found.name); setCustAddress(found.address); }
      else setLoyaltyInfo(null);
    } else setLoyaltyInfo(null);
    setApplyDiscount(false);
  }, [custPhone]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const updateItem = (id: string, field: string, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      if (field === "service") updated.pricePerKg = SERVICE_OPTIONS[value as ServiceType].pricePerKg;
      if (field === "weight" || field === "service") updated.subtotal = updated.weight * updated.pricePerKg;
      return updated;
    }));
  };

  const addItem = () => { setItems(prev => [...prev, { id: generateId(), service: "cuci_setrika", weight: 0, pricePerKg: 7000, subtotal: 0, notes: "" }]); };
  const removeItem = (id: string) => { if (items.length > 1) setItems(prev => prev.filter(i => i.id !== id)); };

  const totalWeight = items.reduce((s, i) => s + i.weight, 0);
  const totalPrice = items.reduce((s, i) => s + i.subtotal, 0);
  const loyaltyPointsEarned = Math.floor(totalWeight / 10);
  const discountAmount = applyDiscount && loyaltyInfo && loyaltyInfo.points >= 5 ? SERVICE_OPTIONS["cuci_setrika"].pricePerKg * 1 : 0;
  const finalPrice = Math.max(0, totalPrice - discountAmount);

  const handleSubmit = () => {
    if (!custName.trim() || !custPhone.trim()) { showToast("Nama dan telepon wajib diisi."); return; }
    if (totalWeight <= 0) { showToast("Berat harus lebih dari 0 kg."); return; }
    const customer = findOrCreateCustomer(custName.trim(), custPhone.trim(), custAddress.trim());
    const hasExpress = items.some(i => i.service === "express");
    const estDone = new Date(); estDone.setHours(estDone.getHours() + (hasExpress ? 6 : 24));

    const order: Order = {
      id: generateId(), receiptNumber: getNextReceiptNumber(), customer,
      items: items.filter(i => i.weight > 0), totalWeight, totalPrice,
      discount: discountAmount, finalPrice, status: "pending", paymentStatus: "unpaid",
      loyaltyPointsEarned, loyaltyDiscountApplied: applyDiscount && discountAmount > 0,
      createdAt: new Date().toISOString(), estimatedDone: estDone.toISOString(),
      notes: orderNotes.trim(), createdBy: user?.username || "",
    };
    addOrder(order);
    if (loyaltyPointsEarned > 0) updateCustomerLoyalty(customer.id, totalWeight, loyaltyPointsEarned);
    if (applyDiscount && discountAmount > 0) redeemLoyaltyPoints(customer.id, 5);

    setPrintOrder(order); refreshOrders();
    showToast(`Order ${order.receiptNumber} berhasil disimpan.`);
    setCustName(""); setCustPhone(""); setCustAddress(""); setOrderNotes("");
    setItems([{ id: generateId(), service: "cuci_setrika", weight: 0, pricePerKg: 7000, subtotal: 0, notes: "" }]);
    setLoyaltyInfo(null); setApplyDiscount(false);
  };

  const handleLogout = () => { logout(); setUser(null); };

  if (!authChecked) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400 text-sm">Memuat...</p></div>;
  if (!user) return <LoginForm onLogin={setUser} />;

  const isAdmin = user.role === "admin";
  const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString());
  const todayRevenue = todayOrders.reduce((s, o) => s + o.finalPrice, 0);
  const pendingCount = orders.filter(o => o.status !== "done" && o.status !== "delivered").length;
  const totalRevenue = orders.reduce((s, o) => s + o.finalPrice, 0);

  const adminTabs: { key: TabType; label: string }[] = [
    { key: "receipt", label: "Kasir" },
    { key: "orders", label: "Pesanan" },
    { key: "todo", label: "Tugas" },
    { key: "delivery", label: "Antaran" },
  ];

  const userTabs: { key: TabType; label: string }[] = [
    { key: "receipt", label: "Buat Pesanan" },
    { key: "delivery", label: "Antaran Saya" },
    { key: "payment", label: "Pembayaran" },
  ];

  const tabs = isAdmin ? adminTabs : userTabs;

  return (
    <div className="relative min-h-screen">
      {printOrder && <div className="hidden print:block"><Receipt order={printOrder} /></div>}

      <div className="no-print max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <header className="dashboard-header flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Ungu Laundry</h1>
            <p className="text-xs text-gray-500 mt-0.5">{user.displayName} &middot; {isAdmin ? "Administrator" : "Kasir"}</p>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <button onClick={async () => { const r = await syncToBackend(); showToast(r.success ? "Sinkronisasi berhasil." : "Gagal sinkronisasi."); }}
                className="btn-ghost text-xs flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                Sync
              </button>
            )}
            <button onClick={handleLogout} className="btn-ghost text-xs">Keluar</button>
          </div>
        </header>

        {/* Admin Stats */}
        {isAdmin && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="card stat-accent p-4 animate-slide-up"><p className="text-[10px] text-gray-500 uppercase tracking-wider">Hari Ini</p><p className="text-xl font-bold text-gray-900 mt-1">{todayOrders.length}</p><p className="text-xs text-gray-500">pesanan</p></div>
            <div className="card stat-accent p-4 animate-slide-up" style={{animationDelay:"60ms"}}><p className="text-[10px] text-gray-500 uppercase tracking-wider">Pendapatan Hari Ini</p><p className="text-xl font-bold text-primary-700 mt-1">{formatCurrency(todayRevenue)}</p></div>
            <div className="card stat-accent p-4 animate-slide-up" style={{animationDelay:"120ms"}}><p className="text-[10px] text-gray-500 uppercase tracking-wider">Dalam Proses</p><p className="text-xl font-bold text-yellow-600 mt-1">{pendingCount}</p></div>
            <div className="card stat-accent p-4 animate-slide-up" style={{animationDelay:"180ms"}}><p className="text-[10px] text-gray-500 uppercase tracking-wider">Total Pendapatan</p><p className="text-xl font-bold text-green-700 mt-1">{formatCurrency(totalRevenue)}</p></div>
          </div>
        )}

        {/* Tabs */}
        <nav className="tab-bar flex gap-2 overflow-x-auto pb-1">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`tab-btn whitespace-nowrap ${activeTab === tab.key ? "active" : ""}`}>{tab.label}</button>
          ))}
        </nav>

        {/* Kasir */}
        {activeTab === "receipt" && (
          <div className="space-y-5 animate-fade-in">
            <div className="card p-5 space-y-4">
              <h2 className="text-sm font-semibold text-gray-900">Data Pelanggan</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div><label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Nama *</label><input value={custName} onChange={e=>setCustName(e.target.value)} placeholder="Nama pelanggan" className="input-field"/></div>
                <div><label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Telepon *</label><input value={custPhone} onChange={e=>setCustPhone(e.target.value)} placeholder="08xxx" className="input-field"/></div>
                <div><label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Alamat</label><input value={custAddress} onChange={e=>setCustAddress(e.target.value)} placeholder="Opsional" className="input-field"/></div>
              </div>
              {loyaltyInfo && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-primary-50 border border-primary-100 animate-scale-in">
                  <div className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">{loyaltyInfo.points}</div>
                  <div className="flex-1"><p className="text-xs font-semibold text-primary-800">Pelanggan Terdaftar</p><p className="text-[10px] text-primary-600">{loyaltyInfo.points} poin | {loyaltyInfo.totalKg} kg total</p></div>
                  {loyaltyInfo.points >= 5 && (
                    <button onClick={() => setApplyDiscount(!applyDiscount)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${applyDiscount ? "bg-green-600 text-white" : "bg-primary-100 text-primary-700 hover:bg-primary-200"}`}>
                      {applyDiscount ? "Diskon Aktif" : "Tukar 5 Poin"}
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">Detail Cucian</h2>
                <button onClick={addItem} className="btn-ghost text-xs">Tambah Layanan</button>
              </div>
              {items.map((item, idx) => (
                <div key={item.id} className="card-muted p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Item #{idx+1}</span>
                    {items.length > 1 && <button onClick={()=>removeItem(item.id)} className="text-xs text-red-500 hover:text-red-700">Hapus</button>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div><label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Layanan</label>
                      <select value={item.service} onChange={e=>updateItem(item.id,"service",e.target.value)} className="input-field">
                        {Object.entries(SERVICE_OPTIONS).map(([k,v])=>(<option key={k} value={k}>{v.label} — {formatCurrency(v.pricePerKg)}/kg</option>))}
                      </select></div>
                    <div><label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Berat (kg)</label>
                      <input type="number" min="0" step="0.1" value={item.weight||""} onChange={e=>updateItem(item.id,"weight",parseFloat(e.target.value)||0)} placeholder="0.0" className="input-field"/></div>
                    <div><label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Subtotal</label>
                      <div className="input-field bg-gray-50 text-primary-700 font-semibold cursor-default">{formatCurrency(item.subtotal)}</div></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="card p-5">
              <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 block">Catatan</label>
              <input value={orderNotes} onChange={e=>setOrderNotes(e.target.value)} placeholder="Pewangi khusus, pisah warna, dll." className="input-field"/>
            </div>

            <div className="card p-5 space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Total Berat:</span><span className="font-semibold">{totalWeight} kg</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Subtotal:</span><span>{formatCurrency(totalPrice)}</span></div>
                {discountAmount > 0 && <div className="flex justify-between text-green-700"><span>Diskon Loyalty (Gratis 1kg):</span><span>-{formatCurrency(discountAmount)}</span></div>}
                {loyaltyPointsEarned > 0 && <div className="flex justify-between text-primary-600"><span>Poin diperoleh:</span><span>+{loyaltyPointsEarned}</span></div>}
                <hr className="border-gray-200"/>
                <div className="flex justify-between items-center"><span className="text-base font-bold">TOTAL</span><span className="text-xl font-bold text-primary-700">{formatCurrency(finalPrice)}</span></div>
              </div>
              <div className="flex gap-3 flex-wrap">
                <button onClick={handleSubmit} className="btn-success flex-1">Simpan Pesanan</button>
                {printOrder && <button onClick={()=>window.print()} className="btn-primary">Cetak Struk</button>}
              </div>
            </div>

            {printOrder && (
              <div className="card p-5 space-y-3 animate-scale-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">Preview Struk</h3>
                  <div className="flex gap-2">
                    <button onClick={()=>window.print()} className="btn-primary text-xs py-2">Print</button>
                    <button onClick={()=>setPrintOrder(null)} className="btn-ghost text-xs py-2">Tutup</button>
                  </div>
                </div>
                <div className="max-w-xs mx-auto card-muted p-4 rounded-xl"><Receipt order={printOrder}/></div>
              </div>
            )}
          </div>
        )}

        {/* Orders — Admin only */}
        {activeTab === "orders" && isAdmin && <OrderList orders={orders} onOrdersChange={refreshOrders} isAdmin />}

        {/* Todo — Admin only */}
        {activeTab === "todo" && isAdmin && <TodoList />}

        {/* Delivery */}
        {activeTab === "delivery" && <DeliveryTracker filterByUser={isAdmin ? undefined : user.username} />}

        {/* Payment — User only */}
        {activeTab === "payment" && !isAdmin && <PaymentInfo />}

        <footer className="text-center py-6"><p className="text-[10px] text-gray-400">Laundry Suite v2.0</p></footer>
      </div>

      {toast && <div className="toast"><div className="toast-content">{toast}</div></div>}
    </div>
  );
}
