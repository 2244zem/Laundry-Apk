"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getOrders, getCustomers, formatCurrency, sendMessage } from "@/lib/storage";
import { Order } from "@/lib/types";

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="card-stat p-5">
      <p className="form-label">{label}</p>
      <p className="text-2xl font-bold mt-1" style={{ color: color ?? "var(--primary)" }}>{value}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [custCount, setCustCount] = useState(0);

  useEffect(() => {
    setOrders(getOrders());
    setCustCount(getCustomers().length);
  }, []);

  useEffect(() => {
    // Daily Promo Logic (7 AM) - NO DISCOUNTS
    const checkPromo = () => {
      const now = new Date();
      if (now.getHours() >= 7) {
        const today = now.toDateString();
        const lastSent = localStorage.getItem("last_promo_date");
        
        if (lastSent !== today) {
          const allConvos = Object.keys(JSON.parse(localStorage.getItem("laundry_chat") || "{}"));
          if (allConvos.length > 0) {
            allConvos.forEach(username => {
              const promoMsg = `📢 SEMANGAT PAGI DARI UNGU LAUNDRY!\n\nPastikan pakaian Anda bersih dan wangi hari ini. Kami siap melayani penjemputan sekarang!\n\nChat kami untuk jadwal jemput ya. ✨`;
              sendMessage(username, "admin", promoMsg);
            });
            localStorage.setItem("last_promo_date", today);
          }
        }
      }
    };

    checkPromo();
    const interval = setInterval(checkPromo, 3600000);
    return () => clearInterval(interval);
  }, []);

  // Notification Sound Logic
  useEffect(() => {
    const playSound = () => {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
      audio.play().catch(() => {});
    };
    
    // Simulate sound on new order
    if (orders.length > 0) {
      const lastOrder = orders[0];
      const lastCheck = localStorage.getItem("last_notif_order");
      if (lastCheck !== lastOrder.id) {
        playSound();
        localStorage.setItem("last_notif_order", lastOrder.id);
      }
    }
  }, [orders]);

  const todayStr = new Date().toDateString();
  const todayOrders = orders.filter((o) => new Date(o.createdAt).toDateString() === todayStr);
  const todayRevenue = todayOrders.reduce((s, o) => s + o.finalPrice, 0);
  const totalRevenue = orders.reduce((s, o) => s + o.finalPrice, 0);
  const pendingCount = orders.filter((o) => o.status !== "done" && o.status !== "delivered").length;
  const unpaidCount = orders.filter((o) => o.paymentStatus === "unpaid").length;

  const recentOrders = orders.slice(0, 6);

  // Revenue Data for Chart (Last 7 days)
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayStr = d.toDateString();
    const dayRevenue = orders
      .filter(o => new Date(o.createdAt).toDateString() === dayStr)
      .reduce((s, o) => s + o.finalPrice, 0);
    return { day: d.toLocaleDateString("id-ID", { weekday: "short" }), value: dayRevenue };
  });
  const maxVal = Math.max(...chartData.map(d => d.value), 100000);

  return (
    <div className="space-y-6 animate-[fadeIn_0.4s_ease-out]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted">
            {new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date())}
          </p>
        </div>
        <div className="hidden md:block">
           <button onClick={() => window.location.reload()} className="btn-outline py-1.5 px-3 text-xs">Refresh Data</button>
        </div>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Pesanan Hari Ini" value={String(todayOrders.length)} sub="transaksi" />
        <StatCard label="Pendapatan Hari Ini" value={formatCurrency(todayRevenue)} color="#10B981" />
        <StatCard label="Dalam Proses" value={String(pendingCount)} sub="pesanan aktif" color="#F59E0B" />
        <StatCard label="Belum Lunas" value={String(unpaidCount)} sub="perlu konfirmasi" color="#EF4444" />
      </div>

      {/* Revenue Chart */}
      <div className="card p-6">
        <h3 className="text-sm font-bold mb-6">Tren Pendapatan (7 Hari Terakhir)</h3>
        <div className="h-48 flex items-end justify-between gap-2 md:gap-4 px-2">
          {chartData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
              <div className="w-full relative">
                <div 
                  className="chart-bar w-full mx-auto" 
                  style={{ height: `${(d.value / maxVal) * 100}%`, minHeight: d.value > 0 ? "4px" : "0" }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {formatCurrency(d.value)}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-medium text-muted uppercase">{d.day}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Pendapatan" value={formatCurrency(totalRevenue)} sub="sepanjang waktu" color="var(--primary)" />
        <StatCard label="Total Pesanan" value={String(orders.length)} sub="semua waktu" />
        <StatCard label="Total Pelanggan" value={String(custCount)} sub="terdaftar" />
      </div>

      {/* Recent Orders */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold">Pesanan Terbaru</h2>
          <Link href="/admin/orders" className="text-xs font-semibold text-primary">Lihat semua</Link>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          {recentOrders.length === 0 ? (
            <div className="py-12 text-center text-muted text-sm">Belum ada pesanan.</div>
          ) : (
            <table className="table-base">
              <thead>
                <tr>
                  <th>No. Struk</th>
                  <th>Pelanggan</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Pembayaran</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td className="font-mono text-xs">{o.receiptNumber}</td>
                    <td>
                      <p className="font-medium text-sm">{o.customer.name}</p>
                      <p className="text-xs text-muted">{o.customer.phone}</p>
                    </td>
                    <td className="font-semibold text-sm">{formatCurrency(o.finalPrice)}</td>
                    <td>
                      <span className="status-chip" style={{
                        background: o.status === "done" || o.status === "delivered" ? "#D1FAE5" : "#FEF3C7",
                        color: o.status === "done" || o.status === "delivered" ? "#065F46" : "#92400E",
                      }}>
                        {o.status === "done" ? "Selesai" : o.status === "delivered" ? "Diantar" : "Proses"}
                      </span>
                    </td>
                    <td>
                      <span className="status-chip" style={{
                        background: o.paymentStatus === "paid" ? "#D1FAE5" : "#FEE2E2",
                        color: o.paymentStatus === "paid" ? "#065F46" : "#991B1B",
                      }}>
                        {o.paymentStatus === "paid" ? "Lunas" : "Belum Lunas"}
                      </span>
                    </td>
                    <td>
                      <a 
                        href={`https://wa.me/${o.customer.phone.replace(/[^0-9]/g, "")}`} 
                        target="_blank" 
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors flex items-center justify-center"
                        title="Hubungi via WhatsApp"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.27-2.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Mobile List View */}
        <div className="md:hidden divide-y divide-gray-100">
          {recentOrders.map((o) => (
            <div key={o.id} className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-mono text-primary font-bold">{o.receiptNumber}</p>
                  <p className="text-sm font-bold mt-0.5">{o.customer.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{formatCurrency(o.finalPrice)}</p>
                  <a href={`https://wa.me/${o.customer.phone.replace(/[^0-9]/g, "")}`} className="text-[10px] text-green-600 font-bold">WHATSAPP</a>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="status-chip" style={{
                  background: o.status === "done" || o.status === "delivered" ? "#D1FAE5" : "#FEF3C7",
                  color: o.status === "done" || o.status === "delivered" ? "#065F46" : "#92400E",
                }}>
                  {o.status === "done" ? "Selesai" : "Proses"}
                </span>
                <span className="status-chip" style={{
                  background: o.paymentStatus === "paid" ? "#D1FAE5" : "#FEE2E2",
                  color: o.paymentStatus === "paid" ? "#065F46" : "#991B1B",
                }}>
                  {o.paymentStatus === "paid" ? "Lunas" : "Belum Lunas"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
