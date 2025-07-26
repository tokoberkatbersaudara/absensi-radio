// admin.js FINAL FIX STABIL
// Menampilkan jam sesuai jadwal_announcer, hitung honor 10rb/jam
// Potong 1 jam jika melewati 18:00–19:00

const supabaseUrl = 'https://nsbbipgztnqhyucftjjt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zYmJpcGd6dG5xaHl1Y2Z0amp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NTc5ODUsImV4cCI6MjA2NzAzMzk4NX0.74lnjRTG28EYbf6ui8mnBksJVL9BU3C8sXOYbl-m-tU';
const client = supabase.createClient(supabaseUrl, supabaseKey);

const tableBody = document.getElementById('rekapBody');
const totalHonorEl = document.getElementById('totalHonor');
const searchInput = document.getElementById('searchInput');
const monthFilter = document.getElementById('monthFilter');
const exportBtn = document.getElementById('exportBtn');

async function loadData() {
    const { data: absensi, error: errorAbsensi } = await client.from('absensi_announcer').select('*');
    const { data: jadwal, error: errorJadwal } = await client.from('jadwal_announcer').select('*');

    if (errorAbsensi) {
        console.error('Error loading absensi:', errorAbsensi);
        return;
    }
    if (errorJadwal) {
        console.error('Error loading jadwal:', errorJadwal);
        return;
    }

    renderTable(absensi, jadwal);
}

function renderTable(absensi, jadwal) {
    tableBody.innerHTML = '';
    let totalHonor = 0;
    const searchQuery = searchInput.value.toLowerCase();
    const selectedMonth = monthFilter.value; // format YYYY-MM

    // Group absensi agar tidak double
    const grouped = {};
    absensi.forEach(item => {
        if (!item.nama || !item.tanggal) return;
        const key = `${item.nama}-${item.tanggal}`;
        grouped[key] = { nama: item.nama, tanggal: item.tanggal };
    });

    Object.values(grouped).forEach(item => {
        const nama = item.nama;
        const tanggal = item.tanggal;
        const itemDate = new Date(tanggal);

        if (selectedMonth) {
            const [year, month] = selectedMonth.split('-');
            if (
                itemDate.getFullYear().toString() !== year ||
                (itemDate.getMonth() + 1).toString().padStart(2, '0') !== month
            ) {
                return;
            }
        }

        if (searchQuery && !nama.toLowerCase().includes(searchQuery) && !tanggal.includes(searchQuery)) {
            return;
        }

        const dayName = itemDate.toLocaleDateString('id-ID', { weekday: 'long' });

        const jadwalHari = jadwal.find(j =>
            j.nama.trim().toLowerCase() === nama.trim().toLowerCase() &&
            j.hari.trim().toLowerCase() === dayName.trim().toLowerCase()
        );

        if (!jadwalHari) {
            console.log(`Tidak ditemukan jadwal untuk ${nama} pada ${dayName}`);
            return;
        }

        const jadwalMulai = new Date(`${tanggal}T${jadwalHari.jam_mulai}`);
        const jadwalSelesai = new Date(`${tanggal}T${jadwalHari.jam_selesai}`);

        let duration = (jadwalSelesai - jadwalMulai) / (1000 * 60 * 60);

        const breakStart = new Date(`${tanggal}T18:00:00`);
        const breakEnd = new Date(`${tanggal}T19:00:00`);
        if (jadwalMulai < breakEnd && jadwalSelesai > breakStart) {
            duration -= 1;
        }

        duration = Math.max(duration, 0);
        const honor = duration * 10000;
        totalHonor += honor;

        const row = document.createElement('tr');
        row.className = 'border-b';
        row.innerHTML = `
            <td class="px-4 py-2">${nama}</td>
            <td class="px-4 py-2">${tanggal}</td>
            <td class="px-4 py-2">${jadwalHari.jam_mulai}</td>
            <td class="px-4 py-2">${jadwalHari.jam_selesai}</td>
            <td class="px-4 py-2">${duration.toFixed(2)}</td>
            <td class="px-4 py-2">Rp ${honor.toLocaleString()}</td>
        `;
        tableBody.appendChild(row);
    });

    totalHonorEl.innerText = `Rp ${totalHonor.toLocaleString()}`;
}

function exportToExcel() {
    const wb = XLSX.utils.table_to_book(document.getElementById('rekapTable'), { sheet: "Rekap" });
    XLSX.writeFile(wb, `Rekap_Absensi_${new Date().toISOString().split('T')[0]}.xlsx`);
}

searchInput.addEventListener('input', loadData);
monthFilter.addEventListener('change', loadData);
exportBtn.addEventListener('click', () => exportToExcel());
document.addEventListener('DOMContentLoaded', loadData);
