// ==============================
// admin.js — Laporan dgn Jadwal + Toleransi (JOIN jadwal_announcer)
// ==============================

// Konfigurasi Supabase
const SUPABASE_URL = 'https://nsbbipgztnqhyucftjjt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zYmJpcGd6dG5xaHl1Y2Z0amp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NTc5ODUsImV4cCI6MjA2NzAzMzk4NX0.74lnjRTG28EYbf6ui8mnBksJVL9BU3C8sXOYbl-m-tU';
const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Elemen UI
const bodyEl   = document.getElementById('rekapBody');
const totalEl  = document.getElementById('totalHonor');
const searchEl = document.getElementById('searchInput');
const monthEl  = document.getElementById('monthFilter');
const exportBtn= document.getElementById('exportBtn');

// Konstanta
const FEE_PER_HOUR   = 10000; // Rp 10.000/jam
const TZ             = 'Asia/Makassar';

// Utils
const rupiah = n => `Rp ${Math.round(n).toLocaleString('id-ID')}`;
function formatTanggalIndo(isoDate){
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'});
}
function toDayNameID(isoDate){
  // pastikan pakai WITA
  return new Intl.DateTimeFormat('id-ID',{weekday:'long', timeZone: TZ})
    .format(new Date(`${isoDate}T12:00:00`));
}
function parseHMS(hms){
  if(!hms) return null;
  const [h,m,s='0']=hms.split(':').map(Number);
  if([h,m,s].some(Number.isNaN)) return null;
  return new Date(2000,0,1,h,m,s);
}
function diffHoursFloor(a,b){
  if(!a||!b) return 0;
  const ms=b-a;
  if(ms<=0) return 0;
  return Math.floor(ms/3600000);
}

// Hitung durasi berdasar irisan jadwal vs aktual
// Rule: ambil yang lebih dalam = max(jam_jadwal_mulai, jam_masuk_actual) hingga min(jam_jadwal_selesai, jam_pulang_actual)
function hitungDurasi(jMulaiStr, jSelesaiStr, masukStr, pulangStr){
  const jMulai  = parseHMS(jMulaiStr);
  const jSelesai= parseHMS(jSelesaiStr);
  const masuk   = parseHMS(masukStr);
  const pulang  = parseHMS(pulangStr);
  if(!jMulai || !jSelesai || !masuk || !pulang) return 0;

  // START: ambil yang lebih besar (max) antara jadwal mulai vs jam masuk actual
  let start = masuk > jMulai ? masuk : jMulai;

  // END: ambil yang lebih kecil (min) antara jadwal selesai vs jam pulang actual
  let end = pulang < jSelesai ? pulang : jSelesai;

  // Jika end <= start, durasi 0
  if(end <= start) return 0;

  // Hitung jam, tetap sesuai pembulatan jadwal (per jam)
  const durationMs = end - start;
  return Math.round(durationMs / 3600000); // bulatkan ke jam terdekat
}

// Load & Render
async function loadData(){
  try {
    // tarik absensi
    const { data: absensi, error: errA } = await client
      .from('absensi_announcer')
      .select('nama,tanggal,jam_masuk,jam_keluar')
      .order('tanggal',{ascending:true})
      .order('jam_masuk',{ascending:true});
    if(errA) throw errA;

    // tarik jadwal (nama, hari -> jam_mulai, jam_selesai)
    const { data: jadwal, error: errJ } = await client
      .from('jadwal_announcer')
      .select('nama,hari,jam_mulai,jam_selesai');
    if(errJ) throw errJ;

    // indeks jadwal: key = nama__hari
    const jadwalMap = new Map();
    for(const j of jadwal){
      const key = `${j.nama}__${j.hari}`;
      jadwalMap.set(key, { jam_mulai: j.jam_mulai, jam_selesai: j.jam_selesai });
    }

    renderTable(absensi || [], jadwalMap);
  } catch(err) {
    bodyEl.innerHTML = `<tr><td colspan="8" class="px-4 py-3 text-red-600">Error: ${err.message}</td></tr>`;
    totalEl.textContent = rupiah(0);
    console.error('LoadData Error:', err);
  }
}

function renderTable(absensi, jadwalMap){
  bodyEl.innerHTML = '';
  let totalHonor = 0;

  const q  = (searchEl.value || '').toLowerCase();
  const ym = monthEl.value; // YYYY-MM

  // dedup per nama+tanggal: ambil record dengan jam_keluar paling akhir
  const lastByDay = new Map();
  for(const r of absensi){
    const key = `${r.nama}__${r.tanggal}`;
    const curr = lastByDay.get(key);
    if(!curr) { lastByDay.set(key, r); continue; }
    if((r.jam_keluar||'') > (curr.jam_keluar||'')) lastByDay.set(key, r);
  }

  const rows = Array.from(lastByDay.values()).filter(r=>{
    if(ym){
      const [Y,M]=ym.split('-');
      const d=new Date(`${r.tanggal}T12:00:00`);
      if(d.getFullYear()!==+Y || (d.getMonth()+1)!==+M) return false;
    }
    if(q && !r.nama.toLowerCase().includes(q) && !String(r.tanggal).includes(q)) return false;
    return true;
  });

  for(const r of rows){
    const hari = toDayNameID(r.tanggal); // contoh: "Senin"
    const sched = jadwalMap.get(`${r.nama}__${hari}`);
    const jadwalMulai   = sched?.jam_mulai   || '-';
    const jadwalSelesai = sched?.jam_selesai || '-';
    const jamMasuk  = r.jam_masuk || '-';
    const jamKeluar = r.jam_keluar|| '-';

    let durasi = 0;
    if(sched && jamMasuk!=='-' && jamKeluar!=='-'){
      durasi = hitungDurasi(jadwalMulai, jadwalSelesai, jamMasuk, jamKeluar);
    }
    const honor = durasi * FEE_PER_HOUR;
    totalHonor += honor;

    const tr = document.createElement('tr');
    tr.className = 'border-b hover:bg-gray-50';
    tr.innerHTML = `
      <td class="px-4 py-3">${r.nama}</td>
      <td class="px-4 py-3">${formatTanggalIndo(r.tanggal)}</td>
      <td class="px-4 py-3">${jadwalMulai}</td>
      <td class="px-4 py-3">${jadwalSelesai}</td>
      <td class="px-4 py-3">${jamMasuk}</td>
      <td class="px-4 py-3">${jamKeluar}</td>
      <td class="px-4 py-3 text-right">${durasi}</td>
      <td class="px-4 py-3 text-right">${rupiah(honor)}</td>
    `;
    bodyEl.appendChild(tr);
  }

  totalEl.textContent = rupiah(totalHonor);
}

// Export Excel
function exportToExcel(){
  const wb = XLSX.utils.table_to_book(document.getElementById('rekapTable'), { sheet: 'Rekap' });
  XLSX.writeFile(wb, `Rekap_Absensi_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// Events
document.addEventListener('DOMContentLoaded', ()=>{
  // default ke bulan berjalan
  const now=new Date();
  const ym=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  monthEl.value = ym;
  loadData();
});
searchEl.addEventListener('input', loadData);
monthEl.addEventListener('change', loadData);
exportBtn.addEventListener('click', exportToExcel);
