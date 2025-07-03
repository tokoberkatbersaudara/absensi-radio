// admin.js final dengan filter jam break 18:00–19:00

const supabaseUrl = 'https://nsbbipgztnqhyucftjjt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // ganti dengan keymu
const client = supabase.createClient(supabaseUrl, supabaseKey);

const tableBody = document.getElementById('rekapBody');
const totalHonorEl = document.getElementById('totalHonor');
const searchInput = document.getElementById('searchInput');
const monthFilter = document.getElementById('monthFilter');
const exportBtn = document.getElementById('exportBtn');

async function loadData() {
    const { data, error } = await client.from('absensi_announcer').select('*');
    if (error) {
        console.error(error);
        return;
    }
    renderTable(data);
}

function renderTable(data) {
    tableBody.innerHTML = '';
    let totalHonor = 0;
    const searchQuery = searchInput.value.toLowerCase();
    const selectedMonth = monthFilter.value;

    data.forEach(item => {
        const nama = item.nama || '-';
        const tanggal = item.tanggal;
        const jamMasuk = item.jam_masuk;
        const jamKeluar = item.jam_keluar;
        
        if (!jamMasuk || !jamKeluar) return;

        const itemDate = new Date(`${tanggal}T${jamMasuk}`);
        if (selectedMonth && (itemDate.getMonth() + 1).toString().padStart(2, '0') !== selectedMonth) return;

        if (searchQuery && !nama.toLowerCase().includes(searchQuery) && !tanggal.includes(searchQuery)) return;

        const dayName = itemDate.toLocaleDateString('id-ID', { weekday: 'long' });

        const jamMasukDate = new Date(`${tanggal}T${jamMasuk}`);
        const jamKeluarDate = new Date(`${tanggal}T${jamKeluar}`);

        // Ambil jadwal penyiar dari jadwal_announcer
        const duration = calculateFilteredDuration(nama, dayName, jamMasukDate, jamKeluarDate);

        const honor = duration > 0 ? 10000 : 0;
        totalHonor += honor;

        const row = document.createElement('tr');
        row.className = 'border-b';
        row.innerHTML = `
            <td class="px-4 py-2">${nama}</td>
            <td class="px-4 py-2">${tanggal}</td>
            <td class="px-4 py-2">${jamMasuk}</td>
            <td class="px-4 py-2">${jamKeluar}</td>
            <td class="px-4 py-2">${duration.toFixed(2)}</td>
            <td class="px-4 py-2">Rp ${honor.toLocaleString()}</td>
        `;
        tableBody.appendChild(row);
    });

    totalHonorEl.innerText = `Rp ${totalHonor.toLocaleString()}`;
}

function calculateFilteredDuration(nama, dayName, jamMasukDate, jamKeluarDate) {
    // default full duration in hours
    let totalDuration = (jamKeluarDate - jamMasukDate) / (1000 * 60 * 60);

    // Break 18:00–19:00 filter
    const breakStart = new Date(jamMasukDate);
    breakStart.setHours(18, 0, 0, 0);
    const breakEnd = new Date(jamMasukDate);
    breakEnd.setHours(19, 0, 0, 0);

    if (jamMasukDate < breakEnd && jamKeluarDate > breakStart) {
        const overlapStart = jamMasukDate > breakStart ? jamMasukDate : breakStart;
        const overlapEnd = jamKeluarDate < breakEnd ? jamKeluarDate : breakEnd;
        const overlap = (overlapEnd - overlapStart) / (1000 * 60 * 60);
        if (overlap > 0) {
            totalDuration -= overlap;
        }
    }

    // Clamp if negative
    return Math.max(totalDuration, 0);
}

searchInput.addEventListener('input', loadData);
monthFilter.addEventListener('change', loadData);
exportBtn.addEventListener('click', () => exportToExcel());

function exportToExcel() {
    const wb = XLSX.utils.table_to_book(document.getElementById('rekapTable'), { sheet: "Rekap" });
    XLSX.writeFile(wb, `Rekap_Absensi_${new Date().toISOString().split('T')[0]}.xlsx`);
}

document.addEventListener('DOMContentLoaded', loadData);
