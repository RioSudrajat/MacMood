# PRD — MacMood POS

**Status:** Draft produk untuk dibahas sebelum implementasi  
**Bahasa produk:** Bahasa Indonesia  
**Target rilis:** MVP satu outlet, dengan rancangan yang dapat diperluas ke beberapa outlet

## 1. Ringkasan Produk

MacMood adalah brand FnB UMKM yang saat ini berfokus pada mac and cheese. Menu yang ada mencakup makaroni, chicken katsu, dan kentang sebagai bagian atau pendamping produk; komposisi dan varian tiap menu dikelola sebagai data katalog dan perlu dikonfirmasi oleh owner.

MacMood POS adalah aplikasi kasir dan pengelolaan operasional untuk brand tersebut. Kasir menggunakan aplikasi dari HP, tablet, atau laptop untuk mencatat pesanan, menerima pembayaran, dan menjalankan shift. Owner/admin menggunakan perangkat yang sama untuk mengelola menu, ketersediaan dan stok sederhana, pengguna, serta melihat performa penjualan.

Produk harus tetap dapat menerima transaksi ketika internet outlet terputus. Transaksi offline disimpan di perangkat kasir sebagai antrean lokal, ditandai dengan jelas, lalu disinkronkan setelah koneksi pulih. MVP mencatat pembayaran tunai dan QRIS; status QRIS dikonfirmasi manual oleh kasir dan tidak dianggap diverifikasi otomatis.

## 2. Masalah dan Peluang

Pencatatan penjualan secara manual menyulitkan usaha kecil untuk mengetahui total penjualan, produk terlaris, dan transaksi per shift. Saat ramai, kasir juga memerlukan cara cepat untuk memilih menu dan menyelesaikan pembayaran. MacMood POS menggabungkan alur transaksi sederhana dengan ringkasan operasional yang dapat dibuka owner dari perangkat berbeda.

## 3. Tujuan dan Bukan Tujuan

### Tujuan MVP

- Memungkinkan kasir menyelesaikan transaksi secara konsisten di HP, tablet, dan laptop.
- Menyimpan riwayat penjualan yang dapat ditelusuri, termasuk saat transaksi dibuat offline.
- Membantu owner melihat ringkasan penjualan, mengelola katalog menu, ketersediaan, stok sederhana, dan akses staf.
- Menggunakan identitas MacMood secara konsisten tanpa mengorbankan keterbacaan dan kecepatan kerja.

### Bukan tujuan MVP

- Akuntansi penuh, rekonsiliasi bank, penggajian, atau pengelolaan pajak otomatis.
- Verifikasi otomatis transaksi QRIS atau integrasi payment gateway.
- Pengurangan bahan baku otomatis menurut resep.
- Pengelolaan banyak cabang, pemesanan publik, marketplace, atau program loyalti.

## 4. Pengguna dan Hak Akses

| Peran | Kebutuhan utama | Akses MVP |
|---|---|---|
| Kasir | Melayani pesanan dengan cepat, melihat total dan kembalian, serta mengetahui transaksi yang sudah tersimpan atau masih menunggu sinkronisasi. | Membuka/menutup shift, melihat menu aktif, membuat transaksi, memilih metode pembayaran, melihat transaksi pada perangkat/shift yang diizinkan. Tidak dapat mengubah harga atau menghapus transaksi selesai. |
| Owner/Admin | Memantau penjualan dan mengatur operasional outlet. | Semua akses admin: katalog, kategori, harga, foto, ketersediaan, stok sederhana, staf dan peran, laporan, pengaturan outlet, serta peninjauan transaksi. |

Owner/Admin dapat menggunakan aplikasi dari HP maupun desktop/laptop. MVP hanya memiliki satu outlet; setiap transaksi dan pengaturan tetap memiliki konteks outlet agar ekspansi cabang kelak tidak memerlukan perubahan konsep utama.

## 5. Alur Utama

1. Staf masuk menggunakan akun masing-masing. Kasir memulai shift dengan mengisi saldo kas awal bila fitur kas awal diaktifkan oleh owner.
2. Kasir mencari atau memilih menu dari kategori, mengatur kuantitas, menambahkan catatan item atau pesanan, lalu memeriksa keranjang.
3. Kasir meninjau subtotal dan potongan yang diizinkan. Pajak dan biaya layanan mengikuti konfigurasi outlet; nilainya tidak diasumsikan sebelum dikonfigurasi.
4. Kasir memilih Tunai atau QRIS. Untuk Tunai, kasir memasukkan nominal diterima dan aplikasi menghitung kembalian. Untuk QRIS, kasir melakukan pengecekan di kanal QRIS yang dipakai outlet dan secara manual menandai pembayaran sudah diterima.
5. Kasir menyelesaikan transaksi. Aplikasi membuat nomor transaksi dan ringkasan/bukti yang dapat ditampilkan serta dibagikan; pencetakan struk menjadi kemampuan opsional setelah perangkat printer dikonfirmasi.
6. Jika offline, transaksi mendapat status **Menunggu sinkronisasi** dan masuk antrean lokal. Setelah jaringan pulih, aplikasi mengirimnya satu kali secara aman dan memperbarui status menjadi **Tersinkron**.
7. Owner melihat transaksi dan ringkasan laporan, memperbarui katalog, ketersediaan, stok, atau akun staf sesuai hak akses.
8. Kasir menutup shift. Sistem merangkum jumlah transaksi dan metode pembayaran; selisih kas dapat dicatat sebagai informasi untuk pemeriksaan owner.

## 6. Kebutuhan Fungsional MVP

Katalog awal harus dapat merepresentasikan menu mac and cheese MacMood serta produk/komponen menu yang saat ini ditawarkan, termasuk makaroni, chicken katsu, dan kentang sesuai susunan menu yang dikonfirmasi owner. PRD ini tidak menetapkan bahwa setiap varian selalu berisi ketiganya, dan tidak mengarang nama, harga, atau resep produk.

| ID | Prioritas | Kebutuhan | Kriteria penerimaan |
|---|---|---|---|
| FR-01 | P0 | Akun staf dan kontrol akses berbasis peran. | Kasir tidak dapat membuka halaman atau menjalankan tindakan khusus admin; identitas pelaku tercatat pada perubahan penting. |
| FR-02 | P0 | Mulai dan tutup shift kasir. | Kasir dapat memulai shift, mencatat saldo awal jika diaktifkan, dan melihat ringkasan transaksi shift sebelum menutupnya. |
| FR-03 | P0 | Katalog menu dengan kategori, harga, foto, dan status tersedia/tidak tersedia. | Admin dapat menambah, mengubah, menonaktifkan menu dan memasang foto; perubahan ketersediaan tercermin pada layar kasir setelah tersinkron. |
| FR-04 | P0 | Pencarian menu dan keranjang pesanan. | Kasir dapat mencari menu, mengubah jumlah, menghapus item sebelum pembayaran, menambahkan catatan, serta melihat subtotal dan total dengan jelas. |
| FR-05 | P0 | Pembayaran tunai dan QRIS. | Pembayaran tunai menghitung kembalian; QRIS memerlukan konfirmasi manual. Metode dan nominal pembayaran tercatat pada transaksi. |
| FR-06 | P0 | Bukti transaksi dan riwayat penjualan. | Setelah transaksi selesai, bukti menunjukkan nomor, waktu, item, jumlah, total, metode pembayaran, dan status sinkronisasi bila relevan. Transaksi tersimpan dapat dicari oleh pengguna berizin. |
| FR-07 | P0 | Ringkasan penjualan owner. | Owner dapat memilih rentang tanggal dan melihat total penjualan, jumlah transaksi, nilai rata-rata transaksi, rincian metode pembayaran, serta menu terlaris. |
| FR-08 | P0 | Pencatatan stok dan ketersediaan sederhana. | Admin dapat melihat stok tercatat, mencatat penambahan/pengurangan dengan alasan, dan menandai menu tidak tersedia. MVP tidak mengurangi stok bahan berdasarkan resep secara otomatis. |
| FR-09 | P0 | Transaksi offline dan sinkronisasi antrean. | Kasir dapat menyelesaikan penjualan offline; setiap transaksi tampak berstatus menunggu sinkronisasi dan tetap ada setelah aplikasi ditutup/dibuka kembali. |
| FR-10 | P1 | Pengaturan outlet dan staf. | Admin dapat mengatur nama outlet, zona waktu, mata uang, komponen pajak/layanan bila berlaku, akun staf, dan perannya. Perubahan yang berdampak pada transaksi baru tidak mengubah transaksi yang sudah selesai. |
| FR-11 | P1 | Pembatalan, koreksi, atau pengembalian dana yang terkendali. | Transaksi selesai tidak dapat dihapus diam-diam; tindakan koreksi memerlukan alasan, hak akses admin/supervisor, dan tercatat di riwayat audit. Rincian kebijakan refund dikonfirmasi sebelum implementasi. |

P0 merupakan kebutuhan untuk operasi MVP. P1 dapat masuk MVP bila kapasitas memungkinkan, tetapi tidak boleh melemahkan keamanan atau jejak transaksi.

## 7. Laporan dan Definisi Angka

- **Penjualan kotor:** jumlah nilai item sebelum potongan, pajak, atau biaya layanan.
- **Penjualan bersih:** nilai akhir transaksi setelah potongan dan komponen yang dikonfigurasi; setiap komponen ditampilkan terpisah agar owner dapat menafsirkan angka dengan benar.
- **Jumlah transaksi:** transaksi berhasil, dengan refund/pembatalan dilaporkan terpisah.
- **Rata-rata transaksi:** penjualan bersih dibagi jumlah transaksi berhasil pada periode yang dipilih.
- **Menu terlaris:** diurutkan berdasarkan jumlah item terjual; sediakan nilai penjualan sebagai tampilan sekunder.
- Semua angka menggunakan format Rupiah dan zona waktu outlet. Laporan offline menandai data yang belum tersinkron agar owner tidak menyangka laporan sudah lengkap.

## 8. Perilaku Offline dan Integritas Data

- Katalog terakhir yang sudah berhasil dimuat tersedia untuk transaksi offline. Kasir melihat indikator offline dan waktu pembaruan data katalog.
- Transaksi selesai offline disimpan di penyimpanan lokal persisten, disertai ID unik transaksi/perangkat, waktu lokal, salinan harga dan nama item saat transaksi, rincian pembayaran, serta status sinkronisasi.
- Pengiriman ulang menggunakan ID transaksi yang sama. Server harus mengenali pengiriman berulang sebagai transaksi yang sama, bukan membuat penjualan kedua.
- Status transaksi yang ditampilkan: **Tersimpan di perangkat**, **Menunggu sinkronisasi**, **Tersinkron**, atau **Perlu perhatian**. Jangan tampilkan sukses sinkronisasi sebelum server mengonfirmasinya.
- Transaksi yang sudah selesai mempertahankan harga, nama, dan total pada saat penjualan walau katalog kemudian berubah. Perubahan katalog berlaku untuk transaksi baru setelah diterima perangkat.
- Jika sinkronisasi gagal, transaksi tetap ada dan dapat dicoba lagi; tampilkan alasan yang dapat ditindaklanjuti tanpa menghapus antrean.
- QRIS tetap perlu verifikasi manual kasir saat offline. Aplikasi tidak menyamakan catatan QRIS yang belum diverifikasi dengan pembayaran yang dipastikan diterima.
- Pembatalan atau refund transaksi tersinkron memerlukan otorisasi dan alasan. Refund offline tidak tersedia pada MVP. Transaksi offline hanya boleh dikoreksi sesuai kebijakan yang disepakati sebelum implementasi.
- Jika akun/perangkat dipakai lebih dari satu kasir atau antrean lokal menghadapi konflik, sistem mempertahankan catatan asli dan meminta tindak lanjut admin; jangan menimpa atau menggandakan penjualan secara diam-diam.

## 9. Kebutuhan Nonfungsional

- Antarmuka responsif dan dapat digunakan dengan sentuhan maupun mouse/keyboard pada lebar layar kecil hingga desktop.
- Alur utama memilih item dan menyiapkan keranjang harus tetap ringkas; layar kasir mengutamakan keterbacaan harga, total, dan status transaksi.
- Pemformatan lokal: Bahasa Indonesia, Rupiah, serta waktu outlet yang dapat dikonfigurasi.
- Data transaksi dan perubahan penting memiliki riwayat yang dapat ditelusuri berdasarkan pengguna dan waktu.
- Informasi pembayaran, pelanggan (bila kelak ada), dan kredensial tidak ditampilkan kepada peran yang tidak berwenang.
- Antarmuka menyediakan fokus keyboard yang terlihat, label yang terbaca pembaca layar, serta kontras teks yang memadai.

## 10. Metrik Keberhasilan Awal

Target berikut adalah hipotesis awal untuk diuji saat pilot, bukan baseline MacMood yang sudah terukur:

- Sedikitnya 95% transaksi harian tercatat di POS selama pilot, berdasarkan perbandingan catatan outlet dengan laporan aplikasi.
- Kasir baru dapat menyelesaikan transaksi simulasi dasar tanpa bantuan setelah orientasi singkat.
- Transaksi normal dari pemilihan item sampai konfirmasi pembayaran dapat diselesaikan dalam median kurang dari 60 detik setelah kasir memahami alur.
- Tidak ada kehilangan atau penggandaan transaksi offline dalam uji pemutusan dan pemulihan jaringan.
- Owner dapat menemukan ringkasan penjualan dan menu terlaris untuk tanggal yang dipilih tanpa bantuan teknis.

## 11. Roadmap Rekomendasi

### MVP — Operasional satu outlet

Transaksi kasir, shift, tunai/QRIS dengan verifikasi manual, katalog dan foto menu, ketersediaan, stok sederhana, laporan dasar, manajemen akun, dan penjualan offline dengan sinkronisasi yang aman.

### Fase berikutnya — Operasional lebih lengkap

Inventori bahan berbasis resep, pemasok dan pembelian, histori penyesuaian stok yang lebih lengkap, promo/discount dengan aturan persetujuan, pengelolaan pelanggan, loyalti, ekspor laporan, dan analitik periode.

### Fase lanjutan — Pertumbuhan usaha

Multi-outlet dan perbandingan performa cabang, integrasi payment gateway/rekonsiliasi QRIS, pemesanan online, integrasi kanal penjualan, serta kontrol operasional lintas outlet.

## 12. Risiko, Ketergantungan, dan Keputusan Sebelum Implementasi

- **Konflik saat offline:** perlu uji pemulihan koneksi dan idempotensi untuk memastikan penjualan tidak hilang atau terduplikasi.
- **Konfirmasi QRIS:** prosedur manual perlu disepakati dengan staf; aplikasi tidak punya bukti otomatis dari penyedia QRIS pada MVP.
- **Stok sederhana:** pencatatan menu/bahan belum menjamin jumlah stok sama dengan kondisi fisik; resep dan satuan harus dirancang bila masuk fase berikutnya.
- **Pajak, biaya layanan, dan refund:** owner perlu mengonfirmasi aturan outlet sebelum konfigurasi dipakai pada penjualan nyata.
- **Struk dan jenis pesanan:** kemampuan printer termal, dine-in/takeaway, dan alur meja belum dikonfirmasi; jangan menganggap semuanya wajib MVP.
- **Aset merek:** logo gambar ketiga menjadi referensi identitas utama dan gambar menu pada gambar pertama menjadi referensi foto katalog. File gambar final, crop yang disetujui, serta hak penggunaan perlu tersedia sebagai aset proyek sebelum UI produksi dibuat. Nama menu dan harga tidak ditetapkan hanya dari poster.

## 13. Skenario Penerimaan Utama

1. Kasir memilih beberapa menu, mengubah jumlah, menambah catatan, menerima tunai, dan bukti menunjukkan total serta kembalian yang benar.
2. Kasir memilih QRIS, mengonfirmasi pembayaran manual, dan transaksi mencatat metode QRIS serta pengguna yang menyelesaikan transaksi.
3. Koneksi terputus setelah katalog dimuat; kasir menyelesaikan penjualan, menutup lalu membuka aplikasi, dan melihat transaksi tetap menunggu sinkronisasi.
4. Koneksi pulih dan sistem mengirim ulang transaksi yang sama; hanya satu transaksi muncul di laporan dan status perangkat menjadi tersinkron.
5. Owner mengubah harga dan ketersediaan; transaksi lama mempertahankan harga saat dibeli, sementara transaksi baru memakai harga/ketersediaan terbaru setelah perangkat menerimanya.
6. Kasir mencoba mengakses manajemen pengguna atau menghapus transaksi selesai; akses ditolak dan tindakan berisiko memerlukan peran yang sesuai.
7. Owner memilih rentang tanggal; total, jumlah transaksi, rata-rata, metode pembayaran, dan menu terlaris konsisten dengan transaksi berhasil pada rentang dan zona waktu outlet.
8. Pengguna menavigasi alur inti dengan layar sempit dan lebar; tombol utama tidak tertutup, teks penting terbaca, dan indikator offline/sinkronisasi selalu terlihat.
