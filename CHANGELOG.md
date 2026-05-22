# Changelog — Absensi Radio Khana 98.4 FM

## v1.1.0 — 22 May 2026 (Perbaikan & Fix)

### 🐛 Bug Fixes
1. **script.js — Line 104**
   - ✅ Fixed: Button ID `absenKeluar` → `absenPulang` (sesuai HTML)
   - **Impact**: Absen pulang di halaman utama sekarang jalan dengan benar

2. **standby.html — Timezone Inconsistent**
   - ✅ Fixed: Tanggal & jam sekarang dihitung pakai timezone WITA (Asia/Makassar) secara konsisten
   - **Before**: UTC untuk tanggal, local time untuk jam → bisa beda zona
   - **After**: Semua pakai WITA

3. **admin.html — Line 32**
   - ✅ Fixed: Typo "Jadwal Maulai" → "Jadwal Mulai"

4. **admin.js — Core Logic (hitungDurasi)**
   - ✅ **PENTING**: Rewrite logic perhitungan durasi kerja
   - **Rule baru**:
     ```
     START = max(jam_jadwal_mulai, jam_masuk_actual)
     END   = min(jam_jadwal_selesai, jam_pulang_actual)
     DURASI = END - START (dalam jam)
     ```
   - **Contoh**:
     - Jadwal: 07:00-12:00, Datang: 06:45, Pulang: 12:30 → **5 jam** ✅
     - Jadwal: 07:00-12:00, Datang: 07:15, Pulang: 12:00 → **4 jam 45 menit ≈ 5 jam** ✅
   - **Impact**: Perhitungan fee tidak berantakan lagi

### ✨ Improvements
1. **Load Announcer Dropdown dari Database**
   - ✅ Dropdown di index.html sekarang auto-load daftar announcer dari tabel `jadwal_announcer`
   - Tidak perlu hardcoded lagi

2. **Error Handling**
   - ✅ Semua async functions sekarang punya try-catch
   - ✅ Network errors & Supabase errors ditampilkan dengan pesan yang jelas
   - ✅ Console logging untuk debugging

3. **Code Cleanup**
   - ✅ Remove unused constant `TOLERANSI_MIN` (tidak dipakai lagi)
   - ✅ Better comments & documentation

### 📋 Summary
- **Total Files Changed**: 5 (script.js, standby.html, admin.html, admin.js, CHANGELOG.md)
- **Bugs Fixed**: 4
- **Features Added**: 1 (auto-load dropdown)
- **Improvements**: 3

---

## v1.0.0 — Initial Release
- Absen Masuk/Pulang
- Jadwal Announcer (hardcoded di DB)
- Rekap Absensi + Export Excel
- Admin Panel dengan filter bulan & search
