// === Konfigurasi Supabase ===
const supabaseUrl = 'https://nsbbipgztnqhyucftjjt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zYmJpcGd6dG5xaHl1Y2Z0amp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NTc5ODUsImV4cCI6MjA2NzAzMzk4NX0.74lnjRTG28EYbf6ui8mnBksJVL9BU3C8sXOYbl-m-tU';
const client = supabase.createClient(supabaseUrl, supabaseKey);

// === Update waktu realtime ===
setInterval(() => {
    const now = new Date();
    const datetimeEl = document.getElementById('datetime');
    if (datetimeEl) {
        datetimeEl.innerText = now.toLocaleString();
    }
}, 1000);

// === Fungsi notifikasi visual ===
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

// === Fungsi Absen Masuk ===
const absenMasukBtn = document.getElementById('absenMasuk');
if (absenMasukBtn) {
    absenMasukBtn.addEventListener('click', async () => {
        const namaInput = document.getElementById('namaAnnouncer');
        const nama = namaInput ? namaInput.value.trim() : '';
        if (!nama) {
            showNotification('Silakan masukkan nama Anda terlebih dahulu.', false);
            return;
        }

        // Validasi apakah announcer terdaftar
        const { data: announcerData, error: announcerError } = await client
            .from('announcer')
            .select('*')
            .eq('nama', nama);

        if (announcerError) {
            console.error('Supabase Error:', announcerError);
            showNotification('Terjadi kesalahan, coba lagi.', false);
            return;
        }

        if (!announcerData || announcerData.length === 0) {
            showNotification('Nama tidak terdaftar sebagai announcer.', false);
            return;
        }

        // Insert absen masuk
        const tanggalHariIni = new Date().toISOString().split('T')[0];
        const jamSekarang = new Date().toLocaleTimeString('en-GB', { hour12: false });

        const { error } = await client.from('absensi_announcer').insert({
            nama: nama,
            tanggal: tanggalHariIni,
            jam_masuk: jamSekarang,
            catatan: 'Absen Masuk'
        });

        if (error) {
            console.error('Supabase Error:', error);
            showNotification('Gagal absen masuk: ' + error.message, false);
        } else {
            showNotification('Absen Masuk berhasil!');
            localStorage.setItem('announcerName', nama);
            setTimeout(() => {
                window.location.href = 'standby.html';
            }, 2000);
        }
    });
}

// === Fungsi Absen Pulang ===
const absenPulangBtn = document.getElementById('absenPulang');
if (absenPulangBtn) {
    absenPulangBtn.addEventListener('click', async () => {
        let nama = '';

        const namaInput = document.getElementById('namaAnnouncer');
        if (namaInput) {
            nama = namaInput.value.trim();
        } else {
            nama = localStorage.getItem('announcerName') || '';
        }

        if (!nama) {
            showNotification('Nama announcer tidak ditemukan.', false);
            return;
        }

        const tanggalHariIni = new Date().toISOString().split('T')[0];
        const jamSekarang = new Date().toLocaleTimeString('en-GB', { hour12: false });

        const { error } = await client
            .from('absensi_announcer')
            .update({
                jam_keluar: jamSekarang,
                catatan: 'Absen Pulang'
            })
            .eq('nama', nama)
            .eq('tanggal', tanggalHariIni);

        if (error) {
            console.error('Supabase Error:', error);
            showNotification('Gagal absen pulang: ' + error.message, false);
        } else {
            showNotification('Absen Pulang berhasil!');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        }
    });
}
