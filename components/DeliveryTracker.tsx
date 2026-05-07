"use client";

import React, { useState, useEffect } from "react";
import { DeliveryItem } from "@/lib/types";
import { getDeliveries, saveDeliveries, generateId, formatDate } from "@/lib/storage";

const STATUS_MAP = {
  pending: { label: "Menunggu", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  picked_up: { label: "Dijemput", color: "bg-blue-100 text-blue-800 border-blue-200" },
  on_the_way: { label: "Di Jalan", color: "bg-purple-100 text-purple-800 border-purple-200" },
  delivered: { label: "Selesai", color: "bg-green-100 text-green-800 border-green-200" },
};

const FLOW: DeliveryItem["status"][] = ["pending", "picked_up", "on_the_way", "delivered"];

interface Props {
  filterByUser?: string;
}

export default function DeliveryTracker({ filterByUser }: Props) {
  const [items, setItems] = useState<DeliveryItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ customerName: "", customerPhone: "", address: "", type: "delivery" as "pickup"|"delivery", scheduledAt: "", notes: "", orderId: "" });

  useEffect(() => { setItems(getDeliveries()); }, []);
  useEffect(() => { if (items.length > 0 || getDeliveries().length > 0) saveDeliveries(items); }, [items]);

  const addItem = () => {
    if (!form.customerName.trim() || !form.address.trim()) return;
    const item: DeliveryItem = {
      id: generateId(), orderId: form.orderId || "-", customerName: form.customerName.trim(),
      customerPhone: form.customerPhone.trim(), address: form.address.trim(),
      status: "pending", type: form.type, scheduledAt: form.scheduledAt || new Date().toISOString(),
      notes: form.notes.trim(), createdBy: "",
    };
    setItems(prev => [item, ...prev]);
    setForm({ customerName: "", customerPhone: "", address: "", type: "delivery", scheduledAt: "", notes: "", orderId: "" });
    setShowForm(false);
  };

  const advanceStatus = (id: string) => {
    setItems(prev => prev.map(i => {
      if (i.id !== id) return i;
      const idx = FLOW.indexOf(i.status);
      if (idx < FLOW.length - 1) return { ...i, status: FLOW[idx + 1], completedAt: FLOW[idx + 1] === "delivered" ? new Date().toISOString() : undefined };
      return i;
    }));
  };

  const deleteItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  const sendWhatsApp = (item: DeliveryItem) => {
    const msg = encodeURIComponent(`Halo ${item.customerName}, Laundry Anda sudah selesai dan siap ${item.type === "delivery" ? "diantar" : "diambil"}. Terima kasih.`);
    const phone = item.customerPhone.replace(/\D/g, "").replace(/^0/, "62");
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  };

  const displayed = filterByUser ? items.filter(i => i.createdBy === filterByUser) : items;
  const active = displayed.filter(i => i.status !== "delivered");
  const done = displayed.filter(i => i.status === "delivered");

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["pending","picked_up","on_the_way","delivered"] as const).map(s => {
          const cfg = STATUS_MAP[s]; const count = displayed.filter(i=>i.status===s).length;
          return <div key={s} className="card p-3 text-center"><p className="text-xl font-bold text-gray-900">{count}</p><p className="text-[11px] text-gray-500 mt-0.5">{cfg.label}</p></div>;
        })}
      </div>

      <button onClick={() => setShowForm(!showForm)} className="btn-primary w-full">{showForm ? "Tutup Form" : "Tambah Antaran"}</button>

      {showForm && (
        <div className="card p-5 space-y-3 animate-slide-down">
          <h3 className="text-sm font-semibold text-gray-900">Data Jemput / Antar</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input placeholder="Nama Pelanggan" value={form.customerName} onChange={e=>setForm({...form,customerName:e.target.value})} className="input-field"/>
            <input placeholder="No. Telepon" value={form.customerPhone} onChange={e=>setForm({...form,customerPhone:e.target.value})} className="input-field"/>
          </div>
          <input placeholder="Alamat Lengkap" value={form.address} onChange={e=>setForm({...form,address:e.target.value})} className="input-field"/>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select value={form.type} onChange={e=>setForm({...form,type:e.target.value as any})} className="input-field"><option value="pickup">Jemput</option><option value="delivery">Antar</option></select>
            <input type="datetime-local" value={form.scheduledAt} onChange={e=>setForm({...form,scheduledAt:e.target.value})} className="input-field"/>
            <input placeholder="No. Order (opsional)" value={form.orderId} onChange={e=>setForm({...form,orderId:e.target.value})} className="input-field"/>
          </div>
          <input placeholder="Catatan" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} className="input-field"/>
          <button onClick={addItem} className="btn-success w-full">Simpan</button>
        </div>
      )}

      {active.length > 0 && <h3 className="text-sm font-semibold text-gray-700">Aktif ({active.length})</h3>}
      <div className="space-y-2">
        {active.map(item => {
          const st = STATUS_MAP[item.status];
          return (
            <div key={item.id} className="card p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900">{item.customerName}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${st.color}`}>{st.label}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">{item.type==="pickup"?"Jemput":"Antar"}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{item.address}</p>
                  {item.customerPhone && <p className="text-xs text-gray-400">{item.customerPhone}</p>}
                  {item.notes && <p className="text-xs text-gray-400 italic mt-1">{item.notes}</p>}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {item.status !== "delivered" && <button onClick={()=>advanceStatus(item.id)} className="btn-primary text-xs py-2">Lanjut: {STATUS_MAP[FLOW[FLOW.indexOf(item.status)+1]]?.label}</button>}
                {item.customerPhone && <button onClick={()=>sendWhatsApp(item)} className="btn-whatsapp text-xs py-2">WhatsApp</button>}
                <button onClick={()=>deleteItem(item.id)} className="btn-danger text-xs py-2">Hapus</button>
              </div>
            </div>
          );
        })}
      </div>

      {done.length > 0 && (
        <>
          <h3 className="text-sm font-semibold text-gray-700">Selesai ({done.length})</h3>
          <div className="space-y-2">
            {done.slice(0,5).map(item => (
              <div key={item.id} className="card-muted p-3 flex items-center justify-between opacity-60">
                <div><p className="text-sm text-gray-700">{item.customerName}</p><p className="text-[10px] text-gray-400">{item.completedAt && formatDate(item.completedAt)}</p></div>
                <button onClick={()=>deleteItem(item.id)} className="text-gray-400 hover:text-red-500 text-xs">Hapus</button>
              </div>
            ))}
          </div>
        </>
      )}

      {displayed.length === 0 && (
        <div className="card-muted p-8 text-center"><p className="text-sm text-gray-400">Belum ada data antaran</p></div>
      )}
    </div>
  );
}
