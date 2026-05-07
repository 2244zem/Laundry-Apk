"use client";

import React, { useState, useEffect } from "react";
import { getInventory, updateInventoryItem, deleteInventoryItem } from "@/lib/storage";
import { InventoryItem } from "@/lib/types";

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [editing, setEditing] = useState<Partial<InventoryItem> | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setItems(getInventory());
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = () => {
    if (!editing?.name) return;
    updateInventoryItem(editing.id || "", editing);
    setItems(getInventory());
    setEditing(null);
    showToast("Stok berhasil diperbarui.");
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.4s_ease-out]">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">Stok Barang</h1>
          <p className="text-sm text-muted">Kelola persediaan detergen, pewangi, dan plastik</p>
        </div>
        <button onClick={() => setEditing({ name: "", stock: 0, unit: "unit", minStock: 0 })} className="btn-primary">
          + Barang Baru
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {items.map((item) => (
          <div key={item.id} className="card p-5 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold">{item.name}</h3>
                <p className="text-[10px] text-muted uppercase font-bold tracking-wider">Terakhir update: {new Date(item.updatedAt).toLocaleDateString()}</p>
              </div>
              <div className={`px-2 py-1 rounded text-[10px] font-bold ${item.stock <= item.minStock ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-green-100 text-green-600'}`}>
                {item.stock <= item.minStock ? 'STOK RENDAH' : 'STOK AMAN'}
              </div>
            </div>
            
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black">{item.stock}</span>
              <span className="text-sm text-muted mb-1">{item.unit}</span>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setEditing(item)} className="btn-outline flex-1 py-2 text-xs">Edit Stok</button>
              <button onClick={() => { if(confirm("Hapus barang?")) { deleteInventoryItem(item.id); setItems(getInventory()); } }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-card rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-[fadeIn_0.2s_ease-out]">
            <div className="p-5 border-b border-border flex justify-between items-center">
              <h3 className="font-bold">{editing.id ? 'Edit Barang' : 'Barang Baru'}</h3>
              <button onClick={() => setEditing(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="form-label">Nama Barang</label>
                <input value={editing.name} onChange={(e) => setEditing({...editing, name: e.target.value})} className="input-field" placeholder="Contoh: Detergen Liquid" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Stok Saat Ini</label>
                  <input type="number" value={editing.stock} onChange={(e) => setEditing({...editing, stock: parseFloat(e.target.value) || 0})} className="input-field" />
                </div>
                <div>
                  <label className="form-label">Satuan</label>
                  <input value={editing.unit} onChange={(e) => setEditing({...editing, unit: e.target.value})} className="input-field" placeholder="liter/pcs" />
                </div>
              </div>
              <div>
                <label className="form-label">Batas Stok Minimum (Peringatan)</label>
                <input type="number" value={editing.minStock} onChange={(e) => setEditing({...editing, minStock: parseFloat(e.target.value) || 0})} className="input-field" />
              </div>
            </div>
            <div className="p-5 bg-gray-50 dark:bg-gray-900 flex gap-3">
              <button onClick={() => setEditing(null)} className="btn-ghost flex-1">Batal</button>
              <button onClick={handleSave} className="btn-primary flex-1">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast-container"><div className="toast">{toast}</div></div>}
    </div>
  );
}
