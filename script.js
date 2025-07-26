// Konfigurasi Supabase
const supabaseUrl = 'https://nsbbipgztnqhyucftjjt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zYmJpcGd6dG5xaHl1Y2Z0amp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NTc5ODUsImV4cCI6MjA2NzAzMzk4NX0.74lnjRTG28EYbf6ui8mnBksJVL9BU3C8sXOYbl-m-tU';
const client = supabase.createClient(supabaseUrl, supabaseKey);

// Fungsi untuk waktu lokal WITA
function getLocalWITADateTime() {
    const now = new Date();
    const offset = 8 * 60; // GMT+8 (WITA)
    const witaTime = new Date(now.getTime() + (offset - now.getTimezoneOffset()) * 60000);
    const tanggal = witaTime.toISOString().split('T')[0];
    const jam = witaTime.toTimeString().split(' ')[0];
    return { tanggal, jam, full: witaTime };
}

// Update realtime tanggal di halaman
setInterval(() => {
    const datetimeEl = document.getElementById('datetime');
    if (datetimeEl) {
        const { full } = getLocalWITADateTime();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        datetimeEl.innerText = full.toLocaleDateString('id-ID', options);
    }
}, 1000);

// Notifikasi
function showNotification(message, success = true) {
    const notif = document.getElementById('notification');
    if (!notif) return;
    notif.innerText = message;
    notif.className = `fixed top-4 right-4 px-4 py-2 rounded shadow-md text-white ${success ? 'bg-green-500' : 'bg-red-500'}`;
    notif.style.display = 'block';
    setTimeout(() => {
        notif.style.display = 'none';
    }, 3000);
}

// Load nama announcer
async function loadAnnouncerList() {
    const { data, error } = await client.from('announcer').select('nama').order('nama', { ascending: true });
    const select = document.getElementById('namaAnnouncer');
    if (error) {
        console.error('Supabase Error:', error);
        showNotification('Gagal memuat daftar announcer.', false);
        return;
    }
    if (data.length === 0) {
        showNotification('Belum ada announcer terdaftar.', false);
        return;
    }
    data.forEach(item => {
        const option = document.createElement('option');
        option.value = item.nama;
        option.textContent = item.nama;
        select.appendChild(option);
    });
}

// Absen Masuk
document.getElementById('absenMasuk').addEventListener('click', async () => {
    const nama = document.getElementById('namaAnnouncer').value;
    if (!nama) {
        showNotification('Silakan pilih nama Anda terlebih dahulu.', false);
        return;
    }

    const { tanggal, jam } = getLocalWITADateTime();

    const { error } = await client.from('absensi_announcer').insert({
        nama,
        tanggal,
        jam_masuk: jam,
        catatan: 'Absen Masuk'
    });

    if (error) {
        console.error('Supabase Error:', error);
        showNotification('Gagal absen masuk: ' + error.message, false);
    } else {
        showNotification('Absen Masuk berhasil!');
        localStorage.setItem('announcerName', nama);
        setTimeout(() => window.location.href = 'standby.html', 1500);
    }
});

// Absen Pulang
document.getElementById('absenPulang').addEventListener('click', async () => {
    const nama = document.getElementById('namaAnnouncer').value || localStorage.getItem('announcerName');
    if (!nama) {
        showNotification('Nama announcer tidak ditemukan.', false);
        return;
    }

    const { tanggal, jam } = getLocalWITADateTime();

    const { data, error } = await client
        .from('absensi_announcer')
        .update({
            jam_keluar: jam,
            catatan: 'Absen Pulang'
        })
        .eq('nama', nama)
        .eq('tanggal', tanggal)
        .select();

    if (error || data.length === 0) {
        console.error('Supabase Error:', error || 'Data tidak ditemukan');
        showNotification('Gagal absen pulang: Data tidak ditemukan.', false);
    } else {
        showNotification('Absen Pulang berhasil!');
        localStorage.removeItem('announcerName');
        setTimeout(() => window.location.href = 'index.html', 1500);
    }
});

// Jalankan saat load
loadAnnouncerList();
