"use client";

import React from "react";
import { Order, SERVICE_OPTIONS } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/storage";

interface ReceiptProps {
  order: Order;
  outletName?: string;
  outletAddress?: string;
  outletPhone?: string;
}

export default function Receipt({
  order,
  outletName = "UNGU LAUNDRY",
  outletAddress = "Jl. Merdeka No. 123, Jakarta",
  outletPhone = "0812-3456-7890",
}: ReceiptProps) {
  return (
    <div className="receipt-container" id={`receipt-${order.id}`}>
      {/* Header */}
      <div className="receipt-header text-center pb-3 border-b border-dashed border-gray-300">
        <h2 className="text-base font-bold tracking-wide text-gray-900">{outletName}</h2>
        <p className="text-[11px] text-gray-500 mt-0.5">{outletAddress}</p>
        <p className="text-[11px] text-gray-500">Telp: {outletPhone}</p>
      </div>

      <hr className="receipt-divider my-2.5 border-gray-200 border-dashed" />

      {/* Receipt Info */}
      <div className="space-y-1 text-xs">
        <div className="flex justify-between"><span className="text-gray-500">No. Struk:</span><span className="font-mono font-semibold text-primary-700">{order.receiptNumber}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Tanggal:</span><span>{formatDate(order.createdAt)}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Est. Selesai:</span><span className="text-green-700">{formatDate(order.estimatedDone)}</span></div>
      </div>

      <hr className="receipt-divider my-2.5 border-gray-200 border-dashed" />

      {/* Customer */}
      <div className="space-y-1 text-xs">
        <div className="flex justify-between"><span className="text-gray-500">Pelanggan:</span><span className="font-semibold">{order.customer.name}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Telepon:</span><span>{order.customer.phone}</span></div>
        {order.customer.address && (
          <div className="flex justify-between"><span className="text-gray-500">Alamat:</span><span className="text-right max-w-[60%]">{order.customer.address}</span></div>
        )}
      </div>

      <hr className="receipt-divider my-2.5 border-gray-200 border-dashed" />

      {/* Items */}
      <table className="receipt-table w-full text-xs">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-1 text-gray-500 font-medium">Layanan</th>
            <th className="text-center py-1 text-gray-500 font-medium">Kg</th>
            <th className="text-right py-1 text-gray-500 font-medium">Harga</th>
            <th className="text-right py-1 text-gray-500 font-medium price-col">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, idx) => {
            const svc = SERVICE_OPTIONS[item.service];
            return (
              <tr key={idx} className="border-b border-gray-100">
                <td className="py-1.5">{svc.label}</td>
                <td className="text-center py-1.5">{item.weight}</td>
                <td className="text-right py-1.5 text-gray-500">{formatCurrency(item.pricePerKg)}</td>
                <td className="text-right py-1.5 font-medium price-col">{formatCurrency(item.subtotal)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <hr className="receipt-divider my-2.5 border-gray-200 border-dashed" />

      {/* Totals */}
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between"><span className="text-gray-500">Total Berat:</span><span className="font-semibold">{order.totalWeight} kg</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Subtotal:</span><span>{formatCurrency(order.totalPrice)}</span></div>
        {order.discount > 0 && (
          <div className="flex justify-between text-green-700"><span>Diskon Loyalty:</span><span>-{formatCurrency(order.discount)}</span></div>
        )}
        <div className="receipt-total flex justify-between text-sm font-bold pt-2 border-t-2 border-gray-800">
          <span>TOTAL:</span>
          <span className="text-primary-700">{formatCurrency(order.finalPrice)}</span>
        </div>
      </div>

      <hr className="receipt-divider my-2.5 border-gray-200 border-dashed" />

      {/* Payment Info */}
      <div className="receipt-payment text-xs space-y-1">
        <p className="font-semibold text-gray-800">Pembayaran Transfer:</p>
        <p className="text-gray-600">Dana: 083823223372</p>
        <p className="text-gray-600">BCA: 4373160311</p>
      </div>

      {/* Footer */}
      <div className="receipt-footer text-center pt-2.5 mt-2.5 border-t border-dashed border-gray-300">
        <p className="text-[10px] text-gray-500">Terima kasih atas kepercayaan Anda.</p>
        <p className="text-[10px] text-gray-400 mt-0.5">Simpan struk ini sebagai bukti pengambilan.</p>
        {order.notes && <p className="text-[10px] text-gray-500 mt-1.5 italic">Catatan: {order.notes}</p>}
      </div>
    </div>
  );
}
