"use client";

import React, { useState, useEffect } from "react";
import { getStoreProfile, saveStoreProfile } from "@/lib/storage";
import { StoreProfile } from "@/lib/types";

export default function AdminStorePage() {
  const [form, setForm] = useState<StoreProfile>({ name: "", address: "", phone: "", description: "" });
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => { setForm(getStoreProfile()); }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { showToast("Nama toko wajib diisi."); return; }
    saveStoreProfile(form);
    showToast("Profil toko berhasil disimpan.");
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.4s_ease-out]">
      <div>
        <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>Profil Toko</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>Informasi yang ditampilkan di struk dan halaman pelanggan</p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <div className="card p-6 space-y-5">
          <div>
            <label className="form-label">Nama Toko *</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Contoh: Ungu Laundry"
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="form-label">Alamat</label>
            <input
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="Jl. Contoh No. 1, Kota..."
              className="input-field"
            />
          </div>
          <div>
            <label className="form-label">Nomor Telepon</label>
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="08xxx-xxxx-xxxx"
              className="input-field"
            />
          </div>
          <div>
            <label className="form-label">Deskripsi Toko</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Deskripsi singkat tentang layanan toko..."
              className="input-field"
              rows={3}
              style={{ resize: "vertical" }}
            />
          </div>
        </div>

        {/* Preview */}
        <div className="card p-6">
          <p className="form-label mb-3">Preview Informasi Toko</p>
          <div style={{ background: "var(--primary-50)", borderRadius: 10, padding: "16px 20px" }}>
            <p className="font-bold text-base" style={{ color: "var(--primary)" }}>{form.name || "—"}</p>
            {form.address && <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{form.address}</p>}
            {form.phone && <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>Telp: {form.phone}</p>}
            {form.description && <p className="text-sm mt-2" style={{ color: "var(--text)", opacity: 0.8 }}>{form.description}</p>}
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="btn-primary">Simpan Profil Toko</button>
        </div>
      </form>

      {toast && <div className="toast-container"><div className="toast">{toast}</div></div>}
    </div>
  );
}
