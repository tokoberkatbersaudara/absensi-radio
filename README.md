# 📻 Aplikasi Absensi Announcer Radio Khana 98.4 FM

Sistem absensi digital untuk announcer radio dengan tracking durasi kerja, perhitungan honor otomatis, dan export laporan.

---

## 🎯 Fitur Utama

### 1️⃣ **Absen Masuk** (`index.html`)
- Pilih nama announcer dari dropdown
- Rekam jam masuk & jam mulai efektif (sesuai jadwal)
- Redirect ke halaman standby setelah berhasil

### 2️⃣ **Standby/Siaran** (`standby.html`)
- Tampil jam realtime (WITA)
- Tombol absen pulang
- Auto-redirect ke halaman utama jika tidak login

### 3️⃣ **Rekap Absensi Admin** (`ADMIN/admin.html`)
- Tabel lengkap dengan jadwal vs aktual
- Filter per bulan & search nama
- Hitung durasi kerja & honor otomatis (Rp 10.000/jam)
- Export ke Excel

---

## 📊 Logika Perhitungan Durasi

**Rule yang berlaku:**
```
START = max(jam_jadwal_mulai, jam_masuk_actual)
  → Ambil yang lebih besar (tidak bayar lebih kalau datang lebih awal)

END = min(jam_jadwal_selesai, jam_pulang_actual)
  → Ambil yang lebih kecil (tidak bayar overtime)

DURASI = END - START (dalam jam)
  → Pembulatan ke jam terdekat
```

**Contoh Konkret:**
```
Jadwal: 07:00 - 12:00 (5 jam standar)

Skenario A: Datang 06:45, Pulang 12:00
├─ START = max(07:00, 06:45) = 07:00 (ambil jadwal)
├─ END = min(12:00, 12:00) = 12:00
└─ DURASI = 5 jam ✅ → Fee = Rp 50.000

Skenario B: Datang 06:45, Pulang 12:30 (overtime)
├─ START = max(07:00, 06:45) = 07:00
├─ END = min(12:00, 12:30) = 12:00 (tidak bayar overtime)
└─ DURASI = 5 jam ✅ → Fee = Rp 50.000

Skenario C: Datang 07:15 (telat), Pulang 12:00
├─ START = max(07:00, 07:15) = 07:15 (hitung dari datang)
├─ END = min(12:00, 12:00) = 12:00
├─ DURASI = 4 jam 45 menit ≈ 5 jam (pembulatan)
└─ DURASI = 5 jam ✅ → Fee = Rp 50.000
```

---

## 🗄️ Struktur Database

### Tabel: `jadwal_announcer`
```sql
- nama (string)          → Nama announcer
- hari (string)          → Hari (Senin, Selasa, dll)
- jam_mulai (time)       → Jam mulai kerja (07:00:00)
- jam_selesai (time)     → Jam selesai kerja (12:00:00)
```

### Tabel: `absensi_announcer`
```sql
- nama (string)              → Nama announcer
- tanggal (date)             → Tanggal WITA (YYYY-MM-DD)
- jam_masuk (time)           → Jam masuk actual
- jam_keluar (time)          → Jam pulang actual
- jam_mulai_efektif (time)   → Jam mulai untuk perhitungan (sesuai rule)
- jam_keluar_efektif (time)  → Jam keluar untuk perhitungan
- catatan (string)           → Catatan absen
```

---

## 🌍 Timezone & Waktu

**Timezone yang dipakai: WITA (Asia/Makassar)**
- Semua tanggal & jam disimpan dalam format WITA
- Tidak ada konversi, konsisten di semua halaman
- Referensi: UTC+8

**Format Waktu:**
- Tanggal: `YYYY-MM-DD` (ISO 8601)
- Waktu: `HH:mm:ss` (24-hour format)
- Display: Indonesia locale (Senin, 22 Mei 2026, 14:30:45)

---

## 🚀 Cara Penggunaan

### **Untuk Announcer:**
1. Buka `index.html`
2. Pilih nama dari dropdown
3. Klik "Absen Masuk" → akan redirect ke `standby.html`
4. Saat akan pulang, klik "Absen Pulang" di halaman standby
5. Sistem akan kembali ke halaman login

### **Untuk Admin:**
1. Buka `/ADMIN/admin.html`
2. Lihat rekap absensi (default bulan berjalan)
3. Filter:
   - **Month**: Pilih bulan & tahun
   - **Search**: Cari nama atau tanggal
4. Export: Klik tombol "Export Excel" untuk download laporan

---

## 📝 Catatan Teknis

### Setup Awal
1. Clone/download repository
2. Pastikan Supabase sudah setup dengan tabel di atas
3. Update `SUPABASE_URL` & `SUPABASE_KEY` di:
   - `script.js` (main form)
   - `standby.html` (standby page)
   - `ADMIN/admin.js` (admin panel)

### Dependencies
- **Frontend**: Tailwind CSS 2.2.19 (CDN)
- **Backend**: Supabase (PostgreSQL + realtime)
- **Export**: SheetJS (XLSX)

### Browser Support
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile (responsive dengan Tailwind)

---

## 🔒 Security Notes

⚠️ **API Key terekspos di client-side** — untuk production:
1. Pindahkan API calls ke backend server
2. Gunakan Row Level Security (RLS) di Supabase
3. Implement authentication proper (OAuth2, JWT)

---

## 📦 File Structure

```
absensi-radio/
├── index.html              → Halaman login/absen masuk
├── script.js               → Logic absen masuk + dropdown load
├── standby.html            → Halaman standby dengan jam realtime
├── ADMIN/
│   ├── admin.html          → Rekap absensi + filter
│   └── admin.js            → Logic perhitungan & render tabel
├── CHANGELOG.md            → History perubahan
└── README.md               → File ini
```

---

## 📞 Troubleshooting

### **Dropdown announcer kosong**
- Cek tabel `jadwal_announcer` di Supabase
- Pastikan ada data dengan kolom `nama`
- Check browser console untuk error

### **Absen tidak masuk database**
- Verify SUPABASE_URL & SUPABASE_KEY benar
- Check network tab di DevTools
- Lihat error di browser console

### **Waktu tidak sesuai**
- Timezone lokal PC harus WITA (UTC+8)
- Jika berbeda, sesuaikan `TZ` di code

### **Honor calculation salah**
- Pastikan `jam_mulai` & `jam_selesai` di tabel jadwal sudah benar
- Cek format: `HH:mm:ss` atau `HH:mm` (harus konsisten)

---

## 📌 Changelog Terbaru

**v1.1.0 (22 May 2026):**
- ✅ Fix button ID absenKeluar → absenPulang
- ✅ Fix timezone inconsistency di standby.html
- ✅ Rewrite hitungDurasi logic (max-min intersection)
- ✅ Auto-load dropdown announcer dari database
- ✅ Improve error handling & add try-catch
- ✅ Fix typo "Jadwal Maulai" → "Jadwal Mulai"

Lihat `CHANGELOG.md` untuk detail lebih lanjut.

---

**Developed for**: Radio Khana 98.4 FM  
**Last Updated**: 22 May 2026
