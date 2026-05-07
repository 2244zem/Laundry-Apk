"use client";

import React, { useState } from "react";
import { Order, OrderStatus, STATUS_CONFIG } from "@/lib/types";
import { formatCurrency, formatDate, updateOrder } from "@/lib/storage";
import Receipt from "./Receipt";

const STATUS_FLOW: OrderStatus[] = ["pending", "washing", "drying", "ironing", "done", "delivered"];

interface OrderListProps {
  orders: Order[];
  onOrdersChange: () => void;
  isAdmin?: boolean;
}

export default function OrderList({ orders, onOrdersChange, isAdmin = false }: OrderListProps) {
  const [printOrder, setPrintOrder] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "all">("all");

  const advanceStatus = (order: Order) => {
    const idx = STATUS_FLOW.indexOf(order.status);
    if (idx < STATUS_FLOW.length - 1) {
      updateOrder(order.id, { status: STATUS_FLOW[idx + 1] });
      onOrdersChange();
    }
  };

  const togglePayment = (order: Order) => {
    updateOrder(order.id, { paymentStatus: order.paymentStatus === "paid" ? "unpaid" : "paid" });
    onOrdersChange();
  };

  const sendWhatsApp = (order: Order) => {
    const msg = encodeURIComponent(`Halo ${order.customer.name}, Laundry Anda (${order.receiptNumber}) sudah selesai dan siap diantar/diambil. Total: ${formatCurrency(order.finalPrice)}. Terima kasih.`);
    const phone = order.customer.phone.replace(/\D/g, "").replace(/^0/, "62");
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  };

  const handlePrint = (order: Order) => {
    setPrintOrder(order);
    setTimeout(() => window.print(), 300);
  };

  const filtered = orders.filter(o => filterStatus === "all" || o.status === filterStatus);
  const counts: Record<string, number> = {};
  STATUS_FLOW.forEach(s => { counts[s] = orders.filter(o => o.status === s).length; });

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Status Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {STATUS_FLOW.map(s => {
          const cfg = STATUS_CONFIG[s];
          return (
            <button key={s} onClick={() => setFilterStatus(filterStatus === s ? "all" : s)}
              className={`card p-3 text-center transition-all ${filterStatus === s ? "ring-2 ring-primary-500" : ""}`}>
              <p className="text-lg font-bold text-gray-900">{counts[s]}</p>
              <p className="text-[10px] text-gray-500">{cfg.label}</p>
            </button>
          );
        })}
      </div>

      {/* Print hidden */}
      {printOrder && <div className="hidden print:block"><Receipt order={printOrder} /></div>}

      {/* Orders */}
      <div className="space-y-3 no-print">
        {filtered.length === 0 && (
          <div className="card-muted p-8 text-center"><p className="text-sm text-gray-400">Belum ada pesanan</p></div>
        )}
        {filtered.map(order => {
          const st = STATUS_CONFIG[order.status];
          const isPaid = order.paymentStatus === "paid";
          return (
            <div key={order.id} className="card p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-semibold text-gray-900">{order.customer.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full text-white font-medium ${st.color}`}>{st.label}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${isPaid ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-600 border-red-200"}`}>
                      {isPaid ? "Lunas" : "Belum Bayar"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-mono">{order.receiptNumber}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(order.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary-700">{formatCurrency(order.finalPrice)}</p>
                  <p className="text-[10px] text-gray-500">{order.totalWeight} kg</p>
                </div>
              </div>

              {/* Items */}
              <div className="flex flex-wrap gap-1">
                {order.items.map((item, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                    {item.weight}kg — {item.service.replace(/_/g, " ")}
                  </span>
                ))}
              </div>

              {/* Progress */}
              <div className="flex gap-1">
                {STATUS_FLOW.map((s, i) => (
                  <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${STATUS_FLOW.indexOf(order.status) >= i ? st.color : "bg-gray-200"}`} />
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                {isAdmin && order.status !== "delivered" && (
                  <button onClick={() => advanceStatus(order)} className="btn-primary text-xs py-2">
                    Lanjut: {STATUS_CONFIG[STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1]]?.label}
                  </button>
                )}
                {isAdmin && (
                  <button onClick={() => togglePayment(order)} className={`text-xs py-2 rounded-xl px-4 font-medium transition-all ${isPaid ? "btn-ghost" : "btn-success"}`}>
                    {isPaid ? "Batalkan Lunas" : "Konfirmasi Lunas"}
                  </button>
                )}
                {isAdmin && order.status === "done" && order.customer.phone && (
                  <button onClick={() => sendWhatsApp(order)} className="btn-whatsapp text-xs py-2">WhatsApp</button>
                )}
                <button onClick={() => handlePrint(order)} className="btn-ghost text-xs py-2">Cetak Struk</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
