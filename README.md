# Ungu Laundry

Sistem Manajemen Laundry Modern dengan Next.js, Tailwind CSS, dan PHP Backend.

## Fitur
- 🧾 **Kasir & Struk** — Generate struk thermal (58mm/80mm) langsung dari browser
- 📦 **Tracking Pesanan** — Status pengerjaan real-time dengan progress bar
- 📋 **To-Do List** — Manajemen tugas operasional outlet
- 🚚 **Antaran** — Tracking jemput-antar pakaian
- ⭐ **Loyalty Points** — Gamifikasi: setiap 10kg = 1 poin, 5 poin = gratis 1kg
- 📲 **WhatsApp Notifikasi** — Kirim notif otomatis ke pelanggan

- ☁️ **Sync ke Server** — Backup data ke MySQL via PHP API

## Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Buka http://localhost:3000

## PHP Backend (Opsional)

1. Setup MySQL database `laundry_suite`
2. Letakkan `api/api.php` di web server PHP (XAMPP/Laragon)
3. Tabel akan dibuat otomatis saat pertama kali sync
