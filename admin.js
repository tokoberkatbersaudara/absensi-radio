<<<<<<< HEAD
// === Konfigurasi Supabase ===
const supabaseUrl = 'https://nsbbipgztnqhyucftjjt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zYmJpcGd6dG5xaHl1Y2Z0amp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NTc5ODUsImV4cCI6MjA2NzAzMzk4NX0.74lnjRTG28EYbf6ui8mnBksJVL9BU3C8sXOYbl-m-tU';
const client = supabase.createClient(supabaseUrl, supabaseKey);

const rekapBody = document.getElementById('rekapBody');
const filterNama = document.getElementById('filterNama');
const filterBulan = document.getElementById('filterBulan');
const downloadCSV = document.getElementById('downloadCSV');
const refreshData = document.getElementById('refreshData');

async function loadData() {
    let { data, error } = await client.from('absensi_announcer').select('*').order('tanggal', { ascending: false });

    if (error) {
        console.error('Supabase Error:', error);
        rekapBody.innerHTML = `<tr><td colspan="5" class="text-center text-red-500 p-2">Gagal memuat data</td></tr>`;
        return;
    }

    const namaFilter = filterNama.value.trim().toLowerCase();
    const bulanFilter = filterBulan.value;

    const filteredData = data.filter(item => {
        const cocokNama = namaFilter === '' || (item.nama && item.nama.toLowerCase().includes(namaFilter));
        const cocokBulan = bulanFilter === '' || (item.tanggal && item.tanggal.startsWith(bulanFilter));
        return cocokNama && cocokBulan;
    });

    rekapBody.innerHTML = '';
    filteredData.forEach(item => {
        const catatan = item.jam_keluar ? 'Selesai Siaran' : (item.catatan ?? '');
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="border px-2 py-1">${item.nama ?? ''}</td>
            <td class="border px-2 py-1">${item.tanggal ?? ''}</td>
            <td class="border px-2 py-1">${item.jam_masuk ?? ''}</td>
            <td class="border px-2 py-1">${item.jam_keluar ?? ''}</td>
            <td class="border px-2 py-1">${catatan}</td>
        `;
        rekapBody.appendChild(row);
    });

    if (filteredData.length === 0) {
        rekapBody.innerHTML = `<tr><td colspan="5" class="text-center text-gray-500 p-2">Tidak ada data</td></tr>`;
    }
}

// Refresh data saat buka halaman
window.addEventListener('load', loadData);

// Refresh data manual
refreshData.addEventListener('click', loadData);

// Download CSV
downloadCSV.addEventListener('click', async () => {
    let { data, error } = await client.from('absensi_announcer').select('*').order('tanggal', { ascending: false });

    if (error) {
        console.error('Supabase Error:', error);
        alert('Gagal mengunduh CSV');
        return;
    }

    const namaFilter = filterNama.value.trim().toLowerCase();
    const bulanFilter = filterBulan.value;

    const filteredData = data.filter(item => {
        const cocokNama = namaFilter === '' || (item.nama && item.nama.toLowerCase().includes(namaFilter));
        const cocokBulan = bulanFilter === '' || (item.tanggal && item.tanggal.startsWith(bulanFilter));
        return cocokNama && cocokBulan;
    });

    // Tambahkan penyesuaian catatan pada CSV juga
    const csvData = filteredData.map(item => ({
        nama: item.nama ?? '',
        tanggal: item.tanggal ?? '',
        jam_masuk: item.jam_masuk ?? '',
        jam_keluar: item.jam_keluar ?? '',
        catatan: item.jam_keluar ? 'Selesai Siaran' : (item.catatan ?? '')
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rekap_absensi_announcer.csv';
    a.click();
    URL.revokeObjectURL(url);
});
=======
// === Konfigurasi Supabase ===
const supabaseUrl = 'https://nsbbipgztnqhyucftjjt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zYmJpcGd6dG5xaHl1Y2Z0amp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NTc5ODUsImV4cCI6MjA2NzAzMzk4NX0.74lnjRTG28EYbf6ui8mnBksJVL9BU3C8sXOYbl-m-tU';
const client = supabase.createClient(supabaseUrl, supabaseKey);

const rekapBody = document.getElementById('rekapBody');
const filterNama = document.getElementById('filterNama');
const filterBulan = document.getElementById('filterBulan');
const downloadCSV = document.getElementById('downloadCSV');
const refreshData = document.getElementById('refreshData');

async function loadData() {
    let { data, error } = await client.from('absensi_announcer').select('*').order('tanggal', { ascending: false });

    if (error) {
        console.error('Supabase Error:', error);
        rekapBody.innerHTML = `<tr><td colspan="5" class="text-center text-red-500 p-2">Gagal memuat data</td></tr>`;
        return;
    }

    const namaFilter = filterNama.value.trim().toLowerCase();
    const bulanFilter = filterBulan.value;

    const filteredData = data.filter(item => {
        const cocokNama = namaFilter === '' || (item.nama && item.nama.toLowerCase().includes(namaFilter));
        const cocokBulan = bulanFilter === '' || (item.tanggal && item.tanggal.startsWith(bulanFilter));
        return cocokNama && cocokBulan;
    });

    rekapBody.innerHTML = '';
    filteredData.forEach(item => {
        const catatan = item.jam_keluar ? 'Selesai Siaran' : (item.catatan ?? '');
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="border px-2 py-1">${item.nama ?? ''}</td>
            <td class="border px-2 py-1">${item.tanggal ?? ''}</td>
            <td class="border px-2 py-1">${item.jam_masuk ?? ''}</td>
            <td class="border px-2 py-1">${item.jam_keluar ?? ''}</td>
            <td class="border px-2 py-1">${catatan}</td>
        `;
        rekapBody.appendChild(row);
    });

    if (filteredData.length === 0) {
        rekapBody.innerHTML = `<tr><td colspan="5" class="text-center text-gray-500 p-2">Tidak ada data</td></tr>`;
    }
}

// Refresh data saat buka halaman
window.addEventListener('load', loadData);

// Refresh data manual
refreshData.addEventListener('click', loadData);

// Download CSV
downloadCSV.addEventListener('click', async () => {
    let { data, error } = await client.from('absensi_announcer').select('*').order('tanggal', { ascending: false });

    if (error) {
        console.error('Supabase Error:', error);
        alert('Gagal mengunduh CSV');
        return;
    }

    const namaFilter = filterNama.value.trim().toLowerCase();
    const bulanFilter = filterBulan.value;

    const filteredData = data.filter(item => {
        const cocokNama = namaFilter === '' || (item.nama && item.nama.toLowerCase().includes(namaFilter));
        const cocokBulan = bulanFilter === '' || (item.tanggal && item.tanggal.startsWith(bulanFilter));
        return cocokNama && cocokBulan;
    });

    // Tambahkan penyesuaian catatan pada CSV juga
    const csvData = filteredData.map(item => ({
        nama: item.nama ?? '',
        tanggal: item.tanggal ?? '',
        jam_masuk: item.jam_masuk ?? '',
        jam_keluar: item.jam_keluar ?? '',
        catatan: item.jam_keluar ? 'Selesai Siaran' : (item.catatan ?? '')
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rekap_absensi_announcer.csv';
    a.click();
    URL.revokeObjectURL(url);
});
>>>>>>> 17e8e13728ea010011f4b7df45df70ce8ccfd4e5
