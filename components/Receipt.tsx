"use client";

import React from "react";
import { Order } from "@/lib/types";
import { formatCurrency, formatDate, getServiceOptions } from "@/lib/storage";

interface ReceiptProps {
  order: Order;
  outletName?: string;
  outletAddress?: string;
  outletPhone?: string;
}

export default function Receipt({
  order,
  outletName = "Ungu Setrika Dan Laundry",
  outletAddress = "Bandung",
  outletPhone = "083823223372",
}: ReceiptProps) {
  return (
    <div className="receipt-container p-4 bg-white text-gray-800 font-mono text-[11px]" id={`receipt-${order.id}`} style={{ width: "300px", margin: "0 auto" }}>
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-sm font-bold uppercase">{outletName}</h2>
        <p>{outletAddress}</p>
        <p>{outletPhone}</p>
      </div>

      {/* Order Info */}
      <div className="space-y-0.5 mb-2">
        <p className="font-bold">{order.receiptNumber}</p>
        <div className="flex justify-between"><span>Kasir</span><span>: {order.createdBy || "Manajer"}</span></div>
        <div className="flex justify-between"><span>Pelanggan</span><span>: {order.customer.name}</span></div>
        <div className="flex justify-between"><span>No Handphone</span><span>: {order.customer.phone}</span></div>
        <div className="flex justify-between"><span>Alamat</span><span className="text-right truncate ml-2">: {order.customer.address || "-"}</span></div>
        <div className="flex justify-between"><span>Masuk</span><span>: {formatDate(order.createdAt)}</span></div>
        <div className="flex justify-between font-bold"><span>Est Selesai</span><span>: {formatDate(order.estimatedDone)}</span></div>
      </div>

      <p className="text-center mb-1">----------------------------------------</p>
      <p className="font-bold mb-1 uppercase text-center">Layanan</p>
      <div className="space-y-1 mb-2">
        {order.items.map((item, idx) => {
          const pl = getServiceOptions();
          const label = pl[item.service]?.label ?? item.service.replace(/_/g, " ");
          return (
            <div key={idx}>
              <p className="font-bold">{label}</p>
              <div className="flex justify-between">
                <span>{item.weight} kg x {formatCurrency(item.pricePerKg)}</span>
                <span>{formatCurrency(item.subtotal)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-center mb-1">----------------------------------------</p>
      <div className="space-y-0.5 mb-2">
        <div className="flex justify-between"><span>Catatan</span><span>: {order.notes || "-"}</span></div>
        <div className="flex justify-between"><span>Parfum</span><span>: Sakura</span></div>
        <div className="flex justify-between"><span>Antar-Jemput</span><span>: Ya</span></div>
      </div>

      <p className="text-center mb-1">----------------------------------------</p>
      <div className="space-y-0.5 mb-2">
        <div className="flex justify-between"><span>Total Layanan</span><span>: {formatCurrency(order.totalPrice)}</span></div>
        <div className="flex justify-between"><span>Antar-Jemput</span><span>: Rp 0</span></div>
      </div>

      <p className="text-center mb-1">----------------------------------------</p>
      <p className="font-bold mb-1 uppercase text-center">Pembayaran</p>
      <div className="space-y-0.5 mb-3">
        <div className="flex justify-between text-sm font-bold">
          <span>Harga Akhir</span>
          <span>: {formatCurrency(order.finalPrice)}</span>
        </div>
        <div className="flex justify-between">
          <span>Status</span>
          <span className="font-bold">: {order.paymentStatus === "paid" ? "Lunas" : "Belum Bayar"}</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-dashed border-gray-300">
        <p className="font-bold mb-1">KETENTUAN</p>
        <ol className="list-decimal pl-4 space-y-1 text-[9px] text-gray-600 leading-tight">
          <li>Pengaduan Komplain max 1x24 jam.</li>
          <li>Kerusakan luntur, susut dan berkerut akibat proses pencucian bukan tanggung jawab kami.</li>
          <li>Jumlah pakaian yang tidak dihitung oleh pelanggan bukan tanggung jawab kami dan hitungan kami yang di anggap benar.</li>
          <li>Kami tidak bertanggung jawab apabila terjadi keadaan memaksa/Force Majeur (Banjir,Kebakaran,Gempa Bumi,dan Huru Hara).</li>
        </ol>
      </div>

      <div className="mt-6 text-center text-[9px] text-gray-400">
        <p>*** TERIMA KASIH ***</p>
        <p>Ungu Laundry - Professional Care</p>
      </div>
    </div>
  );
}
