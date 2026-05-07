"use client";

import React, { useState, useEffect } from "react";
import { getPricelist, savePricelist, formatCurrency } from "@/lib/storage";
import { DEFAULT_PRICES, ServiceType } from "@/lib/types";

type PriceRow = { service: ServiceType; label: string; pricePerKg: number };

export default function AdminPricelistPage() {
  const [rows, setRows] = useState<PriceRow[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const pl = getPricelist();
    setRows(
      (Object.keys(pl) as ServiceType[]).map((k) => ({
        service: k,
        label: pl[k].label,
        pricePerKg: pl[k].pricePerKg,
      }))
    );
  }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const updatePrice = (service: ServiceType, value: number) => {
    setRows((prev) => prev.map((r) => r.service === service ? { ...r, pricePerKg: value } : r));
    setDirty(true);
  };

  const updateLabel = (service: ServiceType, value: string) => {
    setRows((prev) => prev.map((r) => r.service === service ? { ...r, label: value } : r));
    setDirty(true);
  };

  const handleSave = () => {
    const pl = { ...DEFAULT_PRICES };
    rows.forEach((r) => { pl[r.service] = { label: r.label, pricePerKg: r.pricePerKg }; });
    savePricelist(pl);
    setDirty(false);
    showToast("Pricelist berhasil disimpan.");
  };

  const handleReset = () => {
    savePricelist(DEFAULT_PRICES);
    setRows(
      (Object.keys(DEFAULT_PRICES) as ServiceType[]).map((k) => ({
        service: k,
        label: DEFAULT_PRICES[k].label,
        pricePerKg: DEFAULT_PRICES[k].pricePerKg,
      }))
    );
    setDirty(false);
    showToast("Pricelist direset ke default.");
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.4s_ease-out]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>Pricelist</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>Kelola harga layanan per kilogram</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleReset} className="btn-ghost text-sm">Reset Default</button>
          <button onClick={handleSave} disabled={!dirty} className="btn-primary text-sm">Simpan Perubahan</button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <p className="text-sm font-semibold">Layanan Tersedia</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Harga default: Rp 8.000/kg (Cuci + Setrika)</p>
        </div>
        <div className="divide-y" style={{ borderColor: "var(--border)" }}>
          {rows.map((row) => (
            <div key={row.service} className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4">
              <div className="flex-1">
                <label className="form-label">Nama Layanan</label>
                <input
                  value={row.label}
                  onChange={(e) => updateLabel(row.service, e.target.value)}
                  className="input-field"
                />
              </div>
              <div className="w-full sm:w-52">
                <label className="form-label">Harga per kg (Rp)</label>
                <input
                  type="number"
                  min={0}
                  step={500}
                  value={row.pricePerKg}
                  onChange={(e) => updatePrice(row.service, Number(e.target.value))}
                  className="input-field"
                />
              </div>
              <div className="w-full sm:w-40">
                <label className="form-label">Preview</label>
                <div className="input-field font-semibold" style={{ background: "var(--primary-50)", color: "var(--primary)", cursor: "default" }}>
                  {formatCurrency(row.pricePerKg)}/kg
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {dirty && (
        <div style={{ background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: 10, padding: "12px 16px", fontSize: "0.85rem", color: "#92400E" }}>
          Ada perubahan yang belum disimpan. Klik <strong>Simpan Perubahan</strong> untuk menerapkan.
        </div>
      )}

      {toast && <div className="toast-container"><div className="toast">{toast}</div></div>}
    </div>
  );
}
