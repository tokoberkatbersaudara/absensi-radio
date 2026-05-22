// ==============================
// Konfigurasi Supabase
// ==============================
const SUPABASE_URL = 'https://nsbbipgztnqhyucftjjt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zYmJpcGd6dG5xaHl1Y2Z0amp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NTc5ODUsImV4cCI6MjA2NzAzMzk4NX0.74lnjRTG28EYbf6ui8mnBksJVL9BU3C8sXOYbl-m-tU';
const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ==============================
// Timezone WITA (Asia/Makassar)
// ==============================
const TZ = "Asia/Makassar";

function witaDate() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: TZ }); // YYYY-MM-DD
}

function witaTime() {
  return new Date().toLocaleTimeString("it-IT", { timeZone: TZ }); // HH:mm:ss
}
function hariWITA() {
  return new Date().toLocaleDateString("id-ID", { timeZone: TZ, weekday: "long" });
}

// ==============================
// Helper Pembulatan Jam
// ==============================
function floorPerJam(hms) {
  const [h] = hms.split(":").map(Number);
  return `${String(h).padStart(2, "0")}:00:00`;
}

// Aturan khusus jam istirahat
function applyBreakRule(hms) {
  const [h] = hms.split(":").map(Number);
  if (h === 18) return "19:00:00";
  return floorPerJam(hms);
}

// Max time (string compare aman utk HH:MM:SS)
function maxTime(a, b) {
  return (a && b) ? (a > b ? a : b) : (a || b);
}

// ==============================
// Ambil Jadwal Announcer
// ==============================
// asumsi ada tabel jadwal_announcer(nama, hari, jam_mulai, jam_selesai)
async function getJadwalMulai(nama) {
  const { data, error } = await client
    .from("jadwal_announcer")
    .select("jam_mulai")
    .eq("nama", nama)
    .eq("hari", hariWITA());
  if (error || !data || !data[0]) return null;

  let jm = data[0].jam_mulai;
  return jm.length === 5 ? `${jm}:00` : jm; // "07:00" → "07:00:00"
}

// ==============================
// Update Datetime & Jam Realtime
// ==============================
function updateDatetime() {
  const dateEl = document.getElementById("datetime");
  if (!dateEl) return; // element belum ada
  
  const hari = hariWITA();
  const tanggal = witaDate();
  const jam = witaTime();
  
  // Format: Senin, 22 Mei 2026 - 14:30:45
  const tglIndo = new Date(`${tanggal}T${jam}`).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  
  dateEl.textContent = `${tglIndo} - ${jam}`;
}

// Update setiap detik
setInterval(updateDatetime, 1000);
// Update langsung saat load
document.addEventListener("DOMContentLoaded", updateDatetime);

// ==============================
// Notifikasi
// ==============================
function showNotification(msg, success = true) {
  const notif = document.createElement("div");
  notif.className = `fixed top-4 right-4 px-4 py-2 rounded shadow text-white ${success ? "bg-green-500" : "bg-red-500"}`;
  notif.textContent = msg;
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 3000);
}

// ==============================
// Load Dropdown Announcer dari Database
// ==============================
async function loadAnnouncerDropdown() {
  try {
    console.log("Loading announcer dropdown...");
    
    const { data, error } = await client
      .from("jadwal_announcer")
      .select("nama")
      .order("nama", { ascending: true });

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    console.log("Data announcer:", data);

    const uniqueNames = [...new Set(data.map(d => d.nama))];
    console.log("Unique names:", uniqueNames);
    
    const dropdown = document.getElementById("namaAnnouncer");
    if (!dropdown) {
      console.error("Dropdown element not found!");
      return;
    }
    
    // Clear existing options (except placeholder)
    const existingOptions = dropdown.querySelectorAll("option:not(:first-child)");
    existingOptions.forEach(opt => opt.remove());
    
    // Add new options
    uniqueNames.forEach(nama => {
      const option = document.createElement("option");
      option.value = nama;
      option.textContent = nama;
      dropdown.appendChild(option);
    });
    
    console.log("Dropdown loaded successfully!");
  } catch (err) {
    console.error("Error loading announcer:", err);
    showNotification("Gagal memuat data announcer: " + err.message, false);
  }
}

// Load saat page load (pastikan DOM ready)
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadAnnouncerDropdown);
} else {
  // Jika DOM sudah ready
  loadAnnouncerDropdown();
}

// ==============================
// Absen Masuk
// ==============================
document.getElementById("absenMasuk").addEventListener("click", async () => {
  const nama = document.getElementById("namaAnnouncer").value;
  if (!nama) return showNotification("Silakan pilih nama Anda terlebih dahulu.", false);

  const tanggal = witaDate();
  const jamNow = witaTime();

  // baseline: pembulatan + aturan istirahat
  let jamEfektif = applyBreakRule(jamNow);

  // cek jadwal
  const jadwalMulai = await getJadwalMulai(nama);
  if (jadwalMulai) jamEfektif = maxTime(jadwalMulai, jamEfektif);

  try {
    const { error } = await client.from("absensi_announcer").insert({
      nama,
      tanggal,
      jam_masuk: jamNow,
      jam_mulai_efektif: jamEfektif,
      catatan: "Absen Masuk"
    });

    if (error) return showNotification("Gagal absen masuk: " + error.message, false);
    showNotification("Absen Masuk berhasil!");
    localStorage.setItem("announcerName", nama);
    setTimeout(() => (window.location.href = "standby.html"), 1200);
  } catch (err) {
    showNotification("Error: " + err.message, false);
  }
});

// ==============================
// Absen Pulang
// ==============================
document.getElementById("absenPulang").addEventListener("click", async () => {
  const nama = localStorage.getItem("announcerName");
  if (!nama) return showNotification("Nama announcer tidak ditemukan.", false);

  const tanggal = witaDate();
  const jamNow = witaTime();
  const jamEfektif = floorPerJam(jamNow);

  try {
    const { error } = await client.from("absensi_announcer").update({
      jam_keluar: jamNow,
      jam_keluar_efektif: jamEfektif,
      catatan: "Absen Pulang"
    })
      .eq("nama", nama)
      .eq("tanggal", tanggal);

    if (error) return showNotification("Gagal absen pulang: " + error.message, false);
    showNotification("Absen Pulang berhasil!");
    localStorage.removeItem("announcerName");
    setTimeout(() => (window.location.href = "index.html"), 1200);
  } catch (err) {
    showNotification("Error: " + err.message, false);
  }
});
