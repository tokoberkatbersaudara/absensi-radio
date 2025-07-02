const supabaseUrl = 'https://nsbbipgztnqhyucftjjt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zYmJpcGd6dG5xaHl1Y2Z0amp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NTc5ODUsImV4cCI6MjA2NzAzMzk4NX0.74lnjRTG28EYbf6ui8mnBksJVL9BU3C8sXOYbl-m-tU';
const client = supabase.createClient(supabaseUrl, supabaseKey);

async function loadRekap() {
    const { data, error } = await client
        .from('absensi_announcer')
        .select('*')
        .order('tanggal', { ascending: false });

    if (error) {
        console.error(error);
        alert('Gagal memuat data.');
        return;
    }

    const tbody = document.getElementById('rekapBody');
    const totalHonorEl = document.getElementById('totalHonor');
    let totalHonor = 0;

    tbody.innerHTML = '';

    data.forEach(item => {
        const jamMasuk = item.jam_masuk;
        const jamKeluar = item.jam_keluar;

        let durasiJam = 0;

        if (jamMasuk && jamKeluar) {
            const masuk = new Date(`1970-01-01T${jamMasuk}Z`);
            const keluar = new Date(`1970-01-01T${jamKeluar}Z`);
            const selisihMs = keluar - masuk;
            durasiJam = selisihMs > 0 ? selisihMs / (1000 * 60 * 60) : 0;
            durasiJam = Math.round(durasiJam * 100) / 100; // 2 decimal
        }

        const honor = Math.ceil(durasiJam) * 10000;
        totalHonor += honor;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="border px-4 py-2">${item.nama}</td>
            <td class="border px-4 py-2">${item.tanggal}</td>
            <td class="border px-4 py-2">${jamMasuk || '-'}</td>
            <td class="border px-4 py-2">${jamKeluar || '-'}</td>
            <td class="border px-4 py-2 text-center">${durasiJam}</td>
            <td class="border px-4 py-2 text-right">Rp ${honor.toLocaleString('id-ID')}</td>
        `;
        tbody.appendChild(tr);
    });

    totalHonorEl.innerText = `Rp ${totalHonor.toLocaleString('id-ID')}`;
}

loadRekap();
