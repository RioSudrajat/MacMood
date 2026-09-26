# Design System — MacMood POS

**Versi:** 0.1 — fondasi visual untuk MVP  
**Tema awal:** terang  
**Bahasa antarmuka:** Bahasa Indonesia

## 1. Arah Visual

MacMood menggabungkan kesan hangat dan menyenangkan dari makanan dengan ketegasan alat operasional. Identitas utama merujuk logo pada gambar ketiga: hijau tua sebagai bidang merek, kuning pada tulisan “MAC”, krem pada “MOOD”, dan ikon maskot. Poster pada gambar pertama menjadi referensi suasana produk serta sumber foto menu setelah aset final tersedia.

Antarmuka POS harus tenang dan mudah dipindai saat outlet ramai. Warna cerah dipakai untuk penekanan, bukan sebagai bidang penuh di belakang teks panjang. Foto makanan membantu kasir mengenali menu, tetapi tidak boleh mengurangi keterbacaan nama dan harga.

## 2. Token Warna

Nilai HEX di bawah adalah titik awal visual yang diturunkan dari gambar referensi, bukan hasil ekstraksi dari file logo final. Validasi dan sesuaikan dengan aset master saat tersedia.

| Token              | Nilai awal | Peran                                                                                |
| ------------------ | ---------- | ------------------------------------------------------------------------------------ |
| `brand.green.700`  | `#245842`  | Hijau utama logo, header atau navigasi terpilih, tombol utama dengan teks terang.    |
| `brand.green.800`  | `#194735`  | Hover/pressed hijau dan teks bermerek pada bidang terang.                            |
| `brand.green.100`  | `#E4EEE7`  | Latar lembut untuk pilihan aktif atau panel informasi merek.                         |
| `brand.cream.100`  | `#F5F4E8`  | Latar hangat atau bidang sekunder.                                                   |
| `brand.cream.200`  | `#E8EBD5`  | Krem logo; aksen bidang ilustrasi, bukan teks kecil tanpa pengecekan kontras.        |
| `brand.yellow.500` | `#F4BE55`  | Kuning hangat logo, sorotan, badge, atau ikon. Gunakan teks hijau tua untuk kontras. |
| `brand.coral.600`  | `#D94143`  | Aksen merah dari materi poster; untuk penekanan terbatas, bukan status sukses.       |
| `neutral.0`        | `#FFFFFF`  | Permukaan kartu dan bidang utama.                                                    |
| `neutral.50`       | `#F7F8F5`  | Latar aplikasi terang.                                                               |
| `neutral.100`      | `#ECEFEA`  | Batas, pemisah, bidang nonaktif.                                                     |
| `neutral.600`      | `#59645D`  | Teks sekunder.                                                                       |
| `neutral.900`      | `#202923`  | Teks utama.                                                                          |
| `semantic.success` | `#24734D`  | Transaksi berhasil dan sinkronisasi selesai.                                         |
| `semantic.warning` | `#9A5A00`  | Perlu perhatian, stok menipis, atau koneksi terganggu.                               |
| `semantic.danger`  | `#B4232F`  | Gagal, pembatalan, atau tindakan destruktif.                                         |
| `semantic.info`    | `#23658A`  | Informasi dan status netral.                                                         |

### Perilaku Warna

- Warna status selalu didampingi label atau ikon; jangan mengandalkan warna saja.
- Hijau merek menandakan tindakan utama/seleksi, dan hijau sukses hanya dipakai saat tindakan benar-benar berhasil.
- Kuning menyorot elemen penting seperti penawaran atau perhatian ringan. Jangan gunakan kuning sebagai teks isi kecil di atas putih/krem.
- Merah koral merupakan aksen merek yang terbatas; gunakan token `semantic.danger` untuk pesan gagal atau tindakan destruktif.
- Status transaksi offline harus eksplisit: ikon koneksi dan tulisan **Offline**, **Menunggu sinkronisasi**, **Tersinkron**, atau **Perlu perhatian**.
- Teks normal menargetkan rasio kontras WCAG 2.2 AA minimal 4.5:1; teks besar dan komponen grafis minimal 3:1. Verifikasi lagi setelah warna diselaraskan dengan logo master.

## 3. Tipografi

- **Keluarga huruf antarmuka:** Inter; fallback `system-ui`, `-apple-system`, `Segoe UI`, sans-serif.
- **Logo:** gunakan file logo asli. Jangan mengetik ulang atau mengganti lettering pada logo dengan font UI.
- **Bobot:** 400 untuk isi, 500 untuk label/angka tabel, 600 untuk heading kecil dan tombol, 700 untuk judul dan total transaksi.
- **Ukuran desktop:** judul halaman 28–32 px, heading seksi 20–24 px, isi 14–16 px, label 12–14 px.
- **Ukuran kasir/mobile:** isi dan label penting minimal 14 px; total dan nilai yang perlu segera dikenali minimal 20 px.
- Gunakan format angka lokal konsisten, misalnya `Rp25.000`; cegah pemotongan total atau harga di layar sempit.
- Gunakan kapitalisasi kalimat Bahasa Indonesia. Hindari teks kapital penuh untuk label panjang.

## 4. Spasi, Bentuk, dan Elevasi

- Skala dasar 4 px: `space-1` 4, `space-2` 8, `space-3` 12, `space-4` 16, `space-6` 24, `space-8` 32, `space-12` 48.
- Padding kartu umum 16–24 px; layar kasir boleh lebih rapat pada katalog, tetapi area sentuh tetap lega.
- Radius: 6 px untuk kontrol ringkas, 10 px untuk tombol dan input, 14 px untuk kartu/panel, 999 px untuk chip dan badge kapsul.
- Gunakan garis batas netral tipis sebagai pemisah utama. Bayangan ringan hanya untuk panel yang mengambang, dialog, dan drawer keranjang.
- Grid owner memakai kolom yang menyesuaikan ruang; konten utama dibatasi lebar baca agar tabel dan ringkasan tidak melebar tanpa kebutuhan.

## 5. Komponen dan Status

- **Tombol:** primer hijau tua dengan label terang; sekunder berbidang putih/terang dengan batas; destruktif memakai token bahaya. Sediakan hover, fokus, pressed, disabled, dan loading.
- **Input:** label tetap terlihat, placeholder hanya contoh, kesalahan tampil dekat kolom dan disertai petunjuk perbaikan.
- **Kartu menu:** foto konsisten, nama dan harga mudah dibaca, penanda tidak tersedia jelas. Seluruh kartu bisa dipilih, dengan indikator fokus keyboard.
- **Keranjang:** tampilkan kuantitas, nama item, catatan, subtotal, dan total; tindakan **Bayar** selalu mudah dijangkau.
- **Badge:** teks pendek dengan latar lembut; selalu gabungkan warna dan kata status.
- **Dialog konfirmasi:** untuk menutup shift atau tindakan transaksi yang tidak dapat dibatalkan; ringkas konsekuensi dan sediakan tindakan batal yang jelas.
- **Notifikasi:** konfirmasi keberhasilan, kegagalan, atau sinkronisasi tertunda; jangan mengandalkan toast sesaat untuk status transaksi yang masih tertunda.
- **Data kosong:** jelaskan apa yang belum tersedia dan tindakan berikutnya, contohnya menambahkan menu atau memilih periode laporan.

## 6. Layout Responsif

Gunakan breakpoint awal berikut sebagai token layout, lalu verifikasi pada perangkat kasir aktual:

| Lebar viewport  | Tata letak                                                                                                                                                                             |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Di bawah 600 px | Satu kolom. Katalog dan pencarian menjadi area utama; keranjang/bayar memakai panel atau sheet yang dapat dibuka tanpa menutupi status dan aksi penting. Kontrol utama ramah sentuhan. |
| 600–1023 px     | Tablet: katalog dan keranjang dua panel bila orientasi memungkinkan. Pada layar sempit/portrait, keranjang berpindah ke drawer atau panel bawah.                                       |
| 1024 px ke atas | Laptop/desktop: layar kasir memakai katalog dan keranjang berdampingan. Dashboard owner dapat memakai navigasi samping, kartu ringkasan, dan tabel yang dapat difilter.                |

### Kasir

- Prioritaskan pencarian menu, kategori, harga, jumlah item, total, dan tombol bayar.
- Pada laptop/tablet landscape, pertahankan keranjang terlihat saat memilih produk. Pada HP, tampilkan jumlah item dan total pada bar tindakan yang menetap, lalu buka keranjang sebagai panel/sheet.
- Status online/offline dan antrean sinkronisasi terlihat selama sesi, tanpa mendesak informasi jumlah dan total.
- Hindari hover sebagai satu-satunya cara menemukan aksi; seluruh tindakan juga dapat disentuh atau diakses melalui keyboard.

### Owner/Admin

- Desktop menampilkan navigasi samping dan konten utama yang terstruktur.
- HP menampilkan navigasi ringkas/drawer, kartu ringkasan bertumpuk, dan tabel sebagai daftar responsif atau tampilan gulir horizontal dengan identitas kolom yang tetap jelas.
- Filter tanggal, status, dan pencarian berada dekat hasil yang difilter.

## 7. Interaksi dan Aksesibilitas

- Target sentuh minimal 44 × 44 CSS px untuk aksi utama dan kontrol yang sering dipakai.
- Fokus keyboard harus terlihat jelas dan tidak ditutupi panel menetap. Urutan tab mengikuti urutan baca.
- Semua kontrol memiliki nama/label aksesibel; ikon tanpa teks membutuhkan nama aksesibel dan tooltip bila perlu.
- Kesalahan menjelaskan masalah serta langkah pemulihan. Saat koneksi hilang, jangan tampilkan pesan sukses sinkronisasi palsu.
- Perubahan state penting, seperti pembayaran berhasil, item habis, atau antrean tertunda, diumumkan melalui teks yang dapat dibaca teknologi bantu.
- Hormati pengaturan pengurangan gerak sistem; animasi tidak boleh menghambat checkout.
- Grafik laporan menyertakan label atau ringkasan angka; informasi tidak hanya disampaikan lewat warna.

## 8. Aset Merek dan Foto Menu

- **Logo utama:** gunakan gambar ketiga sebagai acuan. Untuk aplikasi, minta/simpan versi final resolusi tinggi dengan latar transparan bila tersedia. Tempatkan pada latar hijau yang sesuai dengan varian logo; jangan meregangkan, memotong maskot, menambahkan efek, atau mengganti warnanya tanpa versi brand yang disetujui.
- **Foto menu:** gambar pertama adalah referensi visual menu. Pisahkan/crop foto tiap produk hanya dari sumber resolusi penuh yang layak; jangan memakai screenshot/poster beresolusi kecil sebagai thumbnail akhir bila tersedia foto asli.
- Foto katalog sebaiknya memakai rasio konsisten 1:1, subjek di tengah dengan ruang potong, kompresi web yang wajar, dan teks nama/harga tetap berupa teks UI, bukan bagian dari gambar.
- Folder aset yang disarankan: `public/brand/macmood-logo.*` dan `public/menu/<slug-menu>.*`. Path ini adalah konvensi usulan, bukan file yang sudah tersedia.
- Sediakan fallback berupa inisial/placeholder warna krem ketika foto belum ada atau gagal dimuat. Foto dekoratif memiliki teks alternatif kosong; foto yang membantu identifikasi menu memakai nama menu sebagai teks alternatif.
- Referensi visual tidak cukup untuk menetapkan katalog resmi. Owner perlu mengonfirmasi nama, harga, varian, ketersediaan, dan foto final sebelum data dimasukkan.

## 9. Checklist Implementasi Desain

- Uji kontras seluruh pasangan teks/latar setelah token final diselaraskan dengan logo master.
- Uji layar kasir pada HP kecil, tablet portrait/landscape, dan laptop; pastikan total dan tombol bayar tidak tertutup.
- Uji status online, offline, sinkronisasi, sukses, kosong, gagal, disabled, dan loading.
- Uji input sentuh, keyboard, fokus terlihat, pembaca layar, serta pembesaran teks.
- Pastikan logo tidak berubah proporsi dan foto menu memiliki placeholder yang konsisten.
