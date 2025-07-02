// Konfigurasi Supabase
const supabaseUrl = 'https://nsbbipgztnqhyucftjjt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zYmJpcGd6dG5xaHl1Y2Z0amp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NTc5ODUsImV4cCI6MjA2NzAzMzk4NX0.74lnjRTG28EYbf6ui8mnBksJVL9BU3C8sXOYbl-m-tU';
const client = supabase.createClient(supabaseUrl, supabaseKey);

const rekapBody = document.getElementById('rekapBody');
const totalHonorEl = document.getElementById('totalHonor');
const searchInput = document.getElementById('searchInput');
const exportBtn = document.getElementById('exportBtn');
const monthFilter = document.getElementById('monthFilter');

let allData = [];

// Fetch data dari Supabase
async function fetchData() {
    const { data, error } = await client.from('absensi_announcer').select('*').order('tanggal', { ascending: false });
    if (error) {
        console.error('Supabase Error:', error);
        return;
    }
    allData = data;
    applyFilters();
}

// Hitung durasi jam siaran
function calculateDuration(jamMasuk, jamKeluar) {
    if (!jamMasuk || !jamKeluar) return 0;
    const [h1, m1, s1] = jamMasuk.split(':').map(Number);
    const [h2, m2, s2] = jamKeluar.split(':').map(Number);
    const t1 = h1 * 3600 + m1 * 60 + s1;
    const t2 = h2 * 3600 + m2 * 60 + s2;
    const diff = t2 - t1;
    return diff > 0 ? (diff / 3600).toFixed(2) : 0;
}

// Tampilkan data ke tabel
function displayData(data) {
    rekapBody.innerHTML = '';
    let totalHonor = 0;

    data.forEach(row => {
        const durasi = calculateDuration(row.jam_masuk, row.jam_keluar);
        const honor = durasi > 0 ? 10000 : 0;
        totalHonor += honor;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="border px-4 py-2">${row.nama}</td>
            <td class="border px-4 py-2">${row.tanggal}</td>
            <td class="border px-4 py-2">${row.jam_masuk || '-'}</td>
            <td class="border px-4 py-2">${row.jam_keluar || '-'}</td>
            <td class="border px-4 py-2 text-center">${durasi}</td>
            <td class="border px-4 py-2">Rp ${honor.toLocaleString('id-ID')}</td>
        `;
        rekapBody.appendChild(tr);
    });

    totalHonorEl.innerText = `Rp ${totalHonor.toLocaleString('id-ID')}`;
}

// Filter nama/tanggal dan filter bulan
function applyFilters() {
    const keyword = searchInput.value.toLowerCase();
    const monthValue = monthFilter.value; // yyyy-mm

    const filtered = allData.filter(row => {
        const matchKeyword =
            row.nama.toLowerCase().includes(keyword) ||
            row.tanggal.toLowerCase().includes(keyword);
        const matchMonth =
            !monthValue || row.tanggal.startsWith(monthValue);
        return matchKeyword && matchMonth;
    });

    displayData(filtered);
}

// Event listeners
searchInput.addEventListener('input', applyFilters);
monthFilter.addEventListener('change', applyFilters);

exportBtn.addEventListener('click', () => {
    const table = document.getElementById('rekapTable');
    const workbook = XLSX.utils.table_to_book(table, { sheet: "Rekap Absensi" });
    XLSX.writeFile(workbook, "Rekap_Absensi_Announcer.xlsx");
});

// Jalankan pertama kali
fetchData();
