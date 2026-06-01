// ==============================
// Konfigurasi Supabase
// ==============================
const SUPABASE_URL = 'https://nsbbipgztnqhyucftjjt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zYmJpcGd6dG5xaHl1Y2Z0amp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NTc5ODUsImV4cCI6MjA2NzAzMzk4NX0.74lnjRTG28EYbf6ui8mnBksJVL9BU3C8sXOYbl-m-tU';
const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const TZ = "Asia/Makassar";

// ==============================
// Tab Switching
// ==============================
function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.className = 'tab-btn bg-gray-200 text-gray-700 px-5 py-2 rounded font-semibold shadow');
    document.querySelectorAll('.tab-content').forEach(c => c.className = 'tab-content');

    if (tab === 'absensi') {
        document.getElementById('tabAbsensi').className = 'tab-btn active bg-orange-500 text-white px-5 py-2 rounded font-semibold shadow';
        document.getElementById('tabAbsensiContent').className = 'tab-content active';
    } else {
        document.getElementById('tabIklan').className = 'tab-btn active bg-orange-500 text-white px-5 py-2 rounded font-semibold shadow';
        document.getElementById('tabIklanContent').className = 'tab-content active';
        loadIklanReport();
    }
}

// ==============================
// ABSENSI — existing code
// ==============================

function showNotification(msg, success = true) {
    const notif = document.createElement("div");
    notif.className = `fixed top-4 right-4 px-4 py-2 rounded shadow text-white ${success ? "bg-green-500" : "bg-red-500"}`;
    notif.textContent = msg;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 3000);
}

function witaDate() {
    return new Date().toLocaleDateString("sv-SE", { timeZone: TZ });
}

function hariWITA() {
    return new Date().toLocaleDateString("id-ID", { timeZone: TZ, weekday: "long" });
}

function maxTime(a, b) {
    return (a && b) ? (a > b ? a : b) : (a || b);
}

function floorPerJam(hms) {
    if (!hms) return null;
    const [h] = hms.split(":").map(Number);
    return `${String(h).padStart(2, "0")}:00:00`;
}

function formatTanggal(tanggalStr) {
    const date = new Date(tanggalStr + 'T00:00:00' + (TZ === 'Asia/Makassar' ? '+08:00' : '+07:00'));
    const options = { day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ };
    return date.toLocaleDateString('id-ID', options);
}

function loadAbsensi() {
    const monthInput = document.getElementById('monthFilter');
    const now = new Date();
    const defaultMonth = now.toISOString().slice(0, 7);
    if (!monthInput.value) monthInput.value = defaultMonth;

    const searchInput = document.getElementById('searchInput');

    async function fetchData() {
        const [year, month] = monthInput.value.split('-');
        const startDate = `${year}-${month}-01`;
        const endDateRaw = new Date(year, parseInt(month), 0).toISOString().slice(0, 10);

        const searchQuery = searchInput.value.trim().toLowerCase();

        let { data, error } = await client
            .from('absensi_announcer')
            .select('*')
            .gte('tanggal', startDate)
            .lte('tanggal', endDateRaw);

        if (error) {
            document.getElementById('rekapBody').innerHTML = `<tr><td colspan="8" class="px-4 py-3 text-red-500">Gagal memuat: ${error.message}</td></tr>`;
            return;
        }

        // Build map jadwal
        const jadwalMap = {};
        if (data && data.length) {
            const jadwalList = await client.from('jadwal_announcer').select('*');
            if (jadwalList.data) {
                jadwalList.data.forEach(j => {
                    const key = `${j.nama}|${j.hari}`;
                    jadwalMap[key] = { mulai: j.jam_mulai, selesai: j.jam_selesai };
                });
            }
        }

        let totalHonor = 0;
        let html = '';
        const dataAsc = (data || []).sort((a, b) => (a.tanggal + a.nama).localeCompare(b.tanggal + b.nama));

        dataAsc.forEach(row => {
            const hariNama = new Date(row.tanggal + 'T00:00:00' + (TZ === 'Asia/Makassar' ? '+08:00' : '+07:00'))
                .toLocaleDateString('id-ID', { timeZone: TZ, weekday: 'long' });
            const jadwalKey = `${row.nama}|${hariNama}`;
            const jadwal = jadwalMap[jadwalKey] || {};
            const jadwalMulai = jadwal.mulai || row.jam_masuk;
            const jadwalSelesai = jadwal.selesai;

            const masuk = row.jam_masuk ? row.jam_masuk.slice(0, 5) : '-';
            const keluar = row.jam_keluar ? row.jam_keluar.slice(0, 5) : '-';
            const jamMulai = row.jam_mulai_efektif || row.jam_masuk;
            const jamKeluar = row.jam_keluar_efektif || row.jam_keluar;

            let durasi = 0;
            if (jamMulai && jamKeluar) {
                const [hm, mm] = jamMulai.split(':').map(Number);
                const [hk, mk] = jamKeluar.split(':').map(Number);
                durasi = Math.max(0, (hk + mk / 60) - (hm + mm / 60));
                durasi = Math.round(durasi * 100) / 100;
            }

            const honor = Math.round(durasi * 10000);
            totalHonor += honor;

            // Filter
            if (searchQuery && !row.nama.toLowerCase().includes(searchQuery) && !row.tanggal.includes(searchQuery)) return;

            html += `<tr class="border-t hover:bg-gray-50">
                <td class="px-4 py-3">${row.nama}</td>
                <td class="px-4 py-3">${formatTanggal(row.tanggal)}</td>
                <td class="px-4 py-3">${jadwalMulai ? jadwalMulai.slice(0, 5) : '-'}</td>
                <td class="px-4 py-3">${jadwalSelesai ? jadwalSelesai.slice(0, 5) : '-'}</td>
                <td class="px-4 py-3">${masuk}</td>
                <td class="px-4 py-3">${keluar}</td>
                <td class="px-4 py-3 text-right">${durasi.toFixed(2)}</td>
                <td class="px-4 py-3 text-right">Rp ${honor.toLocaleString('id-ID')}</td>
            </tr>`;
        });

        document.getElementById('rekapBody').innerHTML = html || '<tr><td colspan="8" class="px-4 py-3 text-center text-gray-400">Tidak ada data</td></tr>';
        document.getElementById('totalHonor').innerText = `Rp ${totalHonor.toLocaleString('id-ID')}`;
    }

    monthInput.addEventListener('change', fetchData);
    searchInput.addEventListener('input', fetchData);
    fetchData();

    document.getElementById('exportBtn').addEventListener('click', async () => {
        // Trigger re-fetch for export
        const [year, month] = monthInput.value.split('-');
        const startDate = `${year}-${month}-01`;
        const endDateRaw = new Date(year, parseInt(month), 0).toISOString().slice(0, 10);

        let { data, error } = await client
            .from('absensi_announcer')
            .select('*')
            .gte('tanggal', startDate)
            .lte('tanggal', endDateRaw);

        if (error) return showNotification('Gagal export: ' + error.message, false);

        const jadwalList = await client.from('jadwal_announcer').select('*');
        const jadwalMap = {};
        (jadwalList.data || []).forEach(j => {
            jadwalMap[`${j.nama}|${j.hari}`] = { mulai: j.jam_mulai, selesai: j.jam_selesai };
        });

        const wsData = [['Nama', 'Tanggal', 'Hari', 'Jadwal Mulai', 'Jadwal Selesai', 'Jam Masuk', 'Jam Pulang', 'Durasi (Jam)', 'Honor']];
        let total = 0;

        (data || []).sort((a, b) => (a.tanggal + a.nama).localeCompare(b.tanggal + b.nama)).forEach(row => {
            const hariNama = new Date(row.tanggal + 'T00:00:00+08:00').toLocaleDateString('id-ID', { timeZone: TZ, weekday: 'long' });
            const jadwalKey = `${row.nama}|${hariNama}`;
            const jadwal = jadwalMap[jadwalKey] || {};
            const jamMulai = row.jam_mulai_efektif || row.jam_masuk;
            const jamKeluar = row.jam_keluar_efektif || row.jam_keluar;
            let durasi = 0;
            if (jamMulai && jamKeluar) {
                const [hm, mm] = jamMulai.split(':').map(Number);
                const [hk, mk] = jamKeluar.split(':').map(Number);
                durasi = Math.round(Math.max(0, (hk + mk / 60) - (hm + mm / 60)) * 100) / 100;
            }
            const honor = Math.round(durasi * 10000);
            total += honor;
            wsData.push([row.nama, row.tanggal, hariNama, (jadwal.mulai || row.jam_masuk || '').slice(0, 5), (jadwal.selesai || '').slice(0, 5), (row.jam_masuk || '').slice(0, 5), (row.jam_keluar || '').slice(0, 5), durasi, honor]);
        });

        wsData.push(['', '', '', '', '', '', 'TOTAL', '', total]);

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, 'Absensi');
        XLSX.writeFile(wb, `Absensi_${monthInput.value}.xlsx`);
        showNotification('Export berhasil!');
    });
}

// ==============================
// IKLAN AT LIPS — Report
// ==============================

function loadIklanReport() {
    const monthInput = document.getElementById('iklanMonthFilter');
    const now = new Date();
    const defaultMonth = now.toISOString().slice(0, 7);
    if (!monthInput.value) monthInput.value = defaultMonth;

    const searchInput = document.getElementById('iklanSearch');

    async function fetchIklan() {
        const [year, month] = monthInput.value.split('-');
        const startDate = `${year}-${month}-01`;
        const endDateRaw = new Date(year, parseInt(month), 0).toISOString().slice(0, 10);
        const searchQuery = searchInput.value.trim().toLowerCase();

        const { data, error } = await client
            .from('laporan_bacaan_iklan')
            .select('*')
            .gte('tanggal', startDate)
            .lte('tanggal', endDateRaw)
            .order('waktu_baca', { ascending: false });

        if (error) {
            document.getElementById('iklanBody').innerHTML = `<tr><td colspan="7" class="px-4 py-3 text-red-500">Gagal memuat: ${error.message}</td></tr>`;
            return;
        }

        let html = '';
        let total = 0;

        (data || []).forEach(row => {
            const waktuBaca = row.waktu_baca ? new Date(row.waktu_baca).toLocaleString('id-ID', { timeZone: TZ }) : '-';
            const tanggal = formatTanggal(row.tanggal);

            if (searchQuery && !row.nama_announcer.toLowerCase().includes(searchQuery) && !row.judul.toLowerCase().includes(searchQuery)) return;

            total++;
            html += `<tr class="border-t hover:bg-gray-50">
                <td class="px-4 py-3">${tanggal}</td>
                <td class="px-4 py-3">${row.hari}</td>
                <td class="px-4 py-3">${row.jam_tayang}</td>
                <td class="px-4 py-3 font-medium">${row.judul}</td>
                <td class="px-4 py-3">${row.nama_announcer}</td>
                <td class="px-4 py-3">${waktuBaca}</td>
                <td class="px-4 py-3"><span class="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold">${row.status}</span></td>
            </tr>`;
        });

        document.getElementById('iklanBody').innerHTML = html || '<tr><td colspan="7" class="px-4 py-3 text-center text-gray-400">Tidak ada data</td></tr>';
        document.getElementById('totalIklan').innerText = total.toString();
    }

    monthInput.addEventListener('change', fetchIklan);
    searchInput.addEventListener('input', fetchIklan);
    fetchIklan();

    document.getElementById('exportIklanBtn').addEventListener('click', async () => {
        const [year, month] = monthInput.value.split('-');
        const startDate = `${year}-${month}-01`;
        const endDateRaw = new Date(year, parseInt(month), 0).toISOString().slice(0, 10);

        const { data, error } = await client
            .from('laporan_bacaan_iklan')
            .select('*')
            .gte('tanggal', startDate)
            .lte('tanggal', endDateRaw);

        if (error) return showNotification('Gagal export: ' + error.message, false);

        const wsData = [['Tanggal', 'Hari', 'Jam', 'Script', 'Announcer', 'Waktu Baca', 'Status']];
        (data || []).forEach(row => {
            const waktuBaca = row.waktu_baca ? new Date(row.waktu_baca).toLocaleString('id-ID', { timeZone: TZ }) : '-';
            wsData.push([row.tanggal, row.hari, row.jam_tayang, row.judul, row.nama_announcer, waktuBaca, row.status]);
        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, 'IklanAtLips');
        XLSX.writeFile(wb, `IklanAtLips_${monthInput.value}.xlsx`);
        showNotification('Export iklan berhasil!');
    });
}

// ==============================
// Init
// ==============================
loadAbsensi();
