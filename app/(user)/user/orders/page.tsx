"use client";

import React, { useState, useEffect } from "react";
import { getLoggedInUser, getUserOrders, formatCurrency, formatDate } from "@/lib/storage";
import { Order, STATUS_CONFIG } from "@/lib/types";
import Link from "next/link";

export default function UserOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const u = getLoggedInUser();
    if (u) setOrders(getUserOrders(u.username));
  }, []);

  return (
    <div className="space-y-5 animate-[fadeIn_0.4s_ease-out]">
      <div>
        <h1 className="text-lg font-bold">Pesanan Saya</h1>
        <p className="text-sm mt-0.5 text-muted">{orders.length} total pesanan dalam riwayat</p>
      </div>

      {orders.length === 0 ? (
        <div className="card p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
            </svg>
          </div>
          <p className="text-sm text-muted">Belum ada pesanan.</p>
          <Link href="/user" className="mt-4 btn-primary py-2 px-6 text-xs shadow-lg shadow-primary/10">Buat pesanan sekarang</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="card p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs font-black text-primary tracking-tighter uppercase">{o.receiptNumber}</p>
                  <p className="text-[10px] mt-0.5 text-muted font-medium">{formatDate(o.createdAt)}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`status-chip text-[10px] uppercase font-black px-2 py-1 rounded-md ${o.status === 'delivered' ? 'bg-green-500/10 text-green-500' : 'bg-primary/10 text-primary'}`}>
                    {STATUS_CONFIG[o.status].label}
                  </span>
                  <span className={`status-chip text-[10px] uppercase font-black px-2 py-1 rounded-md ${o.paymentStatus === 'paid' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {o.paymentStatus === "paid" ? "Lunas" : "Belum Bayar"}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 py-3 border-y border-border/50">
                {o.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-xs">
                    <span className="text-muted">{item.service.replace(/_/g, " ")} — {item.weight > 0 ? `${item.weight} kg` : "Estimasi"}</span>
                    <span className="font-bold">{item.weight > 0 ? formatCurrency(item.subtotal) : "—"}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="text-xs font-bold uppercase tracking-widest text-muted">Total Tagihan</span>
                <span className="font-black text-lg text-primary">{formatCurrency(o.finalPrice)}</span>
              </div>

              {o.notes && (
                <div className="text-[10px] p-3 rounded-xl bg-bg border border-border/50 text-muted italic">
                  Catatan: {o.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
