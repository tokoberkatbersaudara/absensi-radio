// Konfigurasi Supabase
const supabaseUrl = 'https://nsbbipgztnqhyucftjjt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zYmJpcGd6dG5xaHl1Y2Z0amp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NTc5ODUsImV4cCI6MjA2NzAzMzk4NX0.74lnjRTG28EYbf6ui8mnBksJVL9BU3C8sXOYbl-m-tU';
const client = supabase.createClient(supabaseUrl, supabaseKey);

const rekapBody = document.getElementById('rekapBody');
const totalHonorEl = document.getElementById('totalHonor');
const searchInput = document.getElementById('searchInput');
const exportBtn = document.getElementById('exportBtn');

let allData = []; // untuk penyimpanan data global agar search dan export berjalan stabil

// Fungsi untuk fetch data
async function fetchData() {
    const { data, error } = await client.from('absensi_announcer').select('*').order('tanggal', { ascending: false });
    if (error) {
        console.error('Supabase Error:', error);
        return;
    }
    allData = data;
    displayData(data);
}

// Fungsi hitung durasi
function calculateDuration(jamMasuk, jamKeluar) {
    if (!jamMasuk || !jamKeluar) return 0;
    const [h1, m1, s1] = jamMasuk.split(':').map(Number);
    const [h2, m2, s2] = jamKeluar.split(':').map(Number);
    const t1 = h1 * 3600 + m1 * 60 + s1;
    const t2 = h2 * 3600 + m2 * 60 + s2;
    const diff = t2 - t1;
    return diff > 0 ? (diff / 3600).toFixed(2) : 0;
}

// Fungsi untuk display data
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

// Event filter pencarian
searchInput.addEventListener('input', () => {
    const keyword = searchInput.value.toLowerCase();
    const filtered = allData.filter(row =>
        row.nama.toLowerCase().includes(keyword) ||
        row.tanggal.toLowerCase().includes(keyword)
    );
    displayData(filtered);
});

// Event Export ke Excel
exportBtn.addEventListener('click', () => {
    if (allData.length === 0) {
        alert('Tidak ada data untuk diexport.');
        return;
    }
    const exportData = allData.map(row => ({
        Nama: row.nama,
        Tanggal: row.tanggal,
        'Jam Masuk': row.jam_masuk,
        'Jam Pulang': row.jam_keluar,
        'Durasi (Jam)': calculateDuration(row.jam_masuk, row.jam_keluar),
        Honor: 'Rp ' + (calculateDuration(row.jam_masuk, row.jam_keluar) > 0 ? '10.000' : '0')
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap Absensi");
    XLSX.writeFile(workbook, "Rekap_Absensi_Announcer.xlsx");
});

// Load data saat halaman dibuka
fetchData();
