# Dokumen produk

Ringkasan keputusan produk KENNETH dan alasannya. Dokumen strategi lengkap milik tim ada di luar repo ini.
Yang ditulis di sini adalah bagian yang kelihatan di app, supaya siapa pun yang membaca kodenya paham
kenapa sebuah layar dibuat seperti itu.

## Untuk siapa

Pengunjung mall di Jakarta yang bawa mobil, di akhir pekan. Mulainya sengaja sempit: enam mall di
Jakarta Barat (Central Park, Neo Soho, Taman Anggrek, Mal Ciputra, Lippo Mall Puri, Puri Indah Mall),
ditambah Grand Indonesia sebagai contoh mall besar dengan rute ke tenant.

Kenapa sempit? Data parkir baru berguna kalau cakupannya rapat. Empat sampai enam mall yang saling
berdekatan lebih cepat terasa manfaatnya daripada lima puluh mall yang berjauhan.

## Janjinya

Keputusan yang paling mahal diambil sebelum berangkat: mau ke mana, jam berapa, lewat gerbang mana.
KENNETH menjawab itu dalam satu layar yang bisa dibaca dalam 3 detik.

Tiga hal yang menentukan produk ini hidup atau mati, urut dari yang paling penting:

1. Akurasi data. Sekali app bilang lega padahal penuh, orang menghapusnya.
2. Terbaca sekilas. Angka besar, satu warna status, tanpa grafik yang harus dipelajari dulu.
3. Kepadatan cakupan. Rekomendasi alternatif cuma berguna kalau mall sebelahnya juga tercakup.

## Navigasi (keputusan tim, 22 Sep 2026)

Tiga tab: Aktivitas di kiri, logo K (Parkir) di tengah, Akun di kanan. Masukan tim atas versi 0.2: pemisahan
tab kurang jelas, tab yang cuma berisi riwayat terasa boros, dan fitur sebaiknya diakses dari dalam fitur lain.

- **Satu layar utama untuk semua hal.** Parkir biasa, Zona KENNETH, valet runner, dan charger EV memakai layar yang
  sama: peta besar, search, dan dropdown "Mau ngapain?". Yang berubah hanya angka di pin dan satu tombol utama.
  Pengguna tidak perlu belajar layar baru untuk tiap layanan. Karena semua layanan berbayar ada di balik
  dropdown itu, pengguna baru sekali ditunjukkan tip di bawah tombolnya, dan onboarding menyebut letaknya.
- **Satu tab satu tugas.** Parkir untuk memutuskan, Aktivitas untuk yang sudah dipesan, Akun untuk diri sendiri.
- **Riwayat bukan arsip.** Tiap baris punya tombol "Lagi", karena kebanyakan orang parkir di tempat yang sama
  berulang kali.
- **Batal selalu kelihatan.** Booking yang masih bisa dibatalkan punya tombol "Batalkan" di kartunya, dua langkah,
  dengan aturannya tertulis. Yang dibatalkan tetap tercatat di Riwayat supaya tidak ada uang atau pesanan yang
  terasa hilang.
- **App tidak pernah pindah tab sendiri.** Yang lagi berjalan muncul sebagai satu baris di atas kartu tab Parkir.

## Yang dijual, dan yang sengaja tidak

**Keputusan 24 Sep 2026: KENNETH dinilai sebagai ide, bukan harus realistis hari ini.** Versi 0.3 menjual
giliran masuk lewat jalur prioritas. Masalahnya dua: banyak gedung parkir cuma punya satu lajur masuk, dan
mobil biasa jadi menunggu lebih lama. Versi 0.4 menggantinya dengan konsep yang lebih gampang dibayangkan.

**Zona KENNETH.** Sama seperti zona parkir khusus Lexus atau BMW di beberapa mall, tapi mereknya KENNETH.
Gedung menyisihkan sebagian petak di lantai parkir pertama, dekat lobi lift utama, khusus pengguna KENNETH.

- Pengguna memilih hari dan jam datang (per 30 menit), lalu dapat nomor petak, misalnya K-07.
- Masuk lewat gerbang yang punya kamera pelat KENNETH. Palang membaca pelat, QR di tiket hanya cadangan.
- Tanda hijau Zona KENNETH menuntun ke petak. Petak ditahan 30 menit dari jam datang.
- Setelah masuk, parkir selama apa pun dengan tarif gedung biasa. Biaya booking Rp15.000 sampai Rp30.000,
  ikut keramaian.
- Ukuran zona di data demo: sekitar satu dari seratus petak, minimal 12 dan maksimal 40.
- Petak lain tetap untuk semua orang, dan antrian gerbang biasa tidak ditahan untuk siapa pun.

Aturan lain yang tetap:

- Booking dibayar per pakai, bukan bagian dari langganan. Lihat tulisan "habis" sebelum bayar itu
  kecewa biasa. Lihatnya setelah bayar langganan itu merasa ditipu.
- Booking bisa dibatalkan sampai jam datang dengan dana kembali penuh.
- Booking charger mobil listrik tetap seperti sebelumnya. Chargernya sendiri jadi sensor sekaligus
  penegak aturan.

**Valet pakai armada runner KENNETH.** Versi 0.3 memakai valet milik gedung. Sekarang KENNETH punya armada
runner sendiri berseragam hijau:

- Pesan runner: pilih lobi dan jam datang, bayar di app, dapat kode booking dan nama runner.
- Runner mencocokkan kode dengan pelat, ambil kunci, lalu parkir mobilnya di Zona KENNETH.
- Tekan "Siapkan mobil" sebelum turun ke lobi. Karena mobil ada di zona dekat lobi, baliknya 4 sampai 10 menit.
- Face ID dari mockup awal tetap tidak dipakai. Kode dan pelat sudah cukup, dan data biometrik tidak perlu dikumpulkan.

**Kampus tidak menjual apa pun.** Di kampus BINUS app hanya menunjukkan seberapa penuh gedung parkir dan
ke mana kalau penuh (kampus lain atau tempat yang bisa dijalan kaki). Motor dan mobil dihitung terpisah,
karena di kampus porsi motor jauh lebih besar.

**Sengaja tidak dibuat:**

| Ide | Kenapa tidak |
|---|---|
| Bayar denda kalau kelamaan di Zona KENNETH | Bikin pengguna belanja sambil lihat jam. Petak cuma ditahan sampai 30 menit setelah jam datang, setelah masuk bebas |
| Bayar parkir di app | Sudah dikerjakan operator parkir. Kami masuk sebelum mereka, bukan menggantikan |
| Poin, lencana, gamifikasi | Tidak menjawab masalah. Diganti laporan dampak bulanan dengan rumus terbuka |
| Face ID untuk serah terima kunci (ada di mockup awal) | Data biometrik tidak perlu. Runner cukup mencocokkan kode dan pelat |

## Harga

Semua angka di bawah masih perkiraan dan belum divalidasi ke pengelola gedung mana pun.

**Untuk pengguna**

| Paket | Harga | Isi |
|---|---|---|
| Gratis | Rp0 | Okupansi dan antrian semua lokasi, rekomendasi alternatif, gerbang paling lancar, simpan lokasi mobil, rute ke tenant. Booking Zona KENNETH maksimal 2 jam sebelumnya dengan harga normal |
| Zona KENNETH | Rp15.000 sampai Rp30.000 per booking | Harga ikut keramaian. Sabtu siang mahal, Selasa pagi murah |
| Valet runner | Rp40.000 sampai Rp75.000 per pakai (data demo) | Bayar di app, mobil diparkir di Zona KENNETH |
| Premium | Rp29.000 per bulan | Booking sampai 7 hari sebelumnya, diskon 40% tiap booking, notifikasi jam lega lokasi favorit, notifikasi duluan kalau ada yang batal, pola kebiasaan pribadi |

Prinsip Premium: yang dijual hanya hal yang tidak pernah habis stoknya. Premium tidak menjamin dapat petak.

**Untuk pengelola gedung**

| Pelanggan | Perkiraan harga | Yang didapat |
|---|---|---|
| Mall sepi | Rp10 juta sampai Rp15 juta per bulan | Muncul sebagai rekomendasi saat lokasi lain penuh. Pengunjungnya sudah di jalan, sudah bawa mobil, sudah niat belanja |
| Mall ramai | Bagi hasil booking | Sewa petak untuk Zona KENNETH dan valet runner, pengingat yang menahan pengunjung supaya datang nanti daripada batal, pemerataan antrian antar gerbang |
| Semua lokasi | Rp5 juta sampai Rp10 juta per bulan | Dashboard: berapa orang batal datang karena lihat penuh, larinya ke mana, jam berapa kehilangan pengunjung |

Halaman `/mitra` di app adalah contoh dashboard itu, dengan angka simulasi.

## Risiko dan jawabannya di app

Sebelas risiko ini dari daftar risiko tim. Kolom terakhir menunjukkan di mana jawabannya kelihatan.

| # | Risiko | Jawaban | Di app |
|---|---|---|---|
| 1 | Orang booking lalu tidak keluar-keluar | Tidak jual petak, jual giliran masuk | Teks pembuka di layar booking |
| 2 | Slot sedikit, peminat banyak | Bayar per pakai, jual 24 dari 30 | Sisa giliran di tiap jendela, label "Habis" |
| 3 | Mall ramai tidak mau kerja sama | Produk berbeda untuk mall ramai, pengalihan ke properti satu grup dulu | Dashboard mitra, bagian "Ke mana mereka pergi" |
| 4 | Pengelola belum tentu mau bayar | Prototipe tidak bergantung pada mereka. Data simulasi sah untuk tahap ini | Label "Estimasi" dan keterangan simulasi |
| 5 | Data salah, pengguna kabur | Jujur soal sumber, uji toleransi meleset di booth | Label "Data palang" atau "Estimasi" di tiap lokasi, pertanyaan 3 di `/booth` |
| 6 | Ayam dan telur | Mulai dari area sempit, laporan pengguna | Tombol "Kondisi di lokasi beda?" |
| 7 | Google bisa bikin ini | Akuisisi jalan keluar yang sah. Yang harus dibangun komunitas dan hubungan dengan pengelola | Tidak ada di app |
| 8 | Hanya terasa di akhir pekan | Visi jangka panjang: kantor, rumah sakit, kampus | Tidak ada di app. Pilot sengaja mall dulu |
| 9 | Yang tidak bayar menunggu lebih lama | Mirip fast track bandara, dan fitur gratis ikut mengurangi antrian | "Kenapa ini adil" di layar booking |
| 10 | Parkiran penuh total | Diakui di depan | Peringatan "hampir penuh total" di layar booking |
| 11 | Privasi data lokasi | Yang dijual ke pengelola hanya agregat dan anonim | Profil, Privasi dan data. Semua data prototipe tinggal di HP |

## Yang diuji di BINUS Festival

Halaman `/booth` dipakai di stan. Satu pengunjung mengisi satu kali, jawabannya tersimpan di perangkat
dan bisa diunduh sebagai CSV atau JSON.

Pertanyaannya, dengan nomor yang sama seperti di layar:

1. Kapan terakhir muter nyari parkir di mall.
2. Waktu itu kira-kira berapa lama.
3. Kalau app kadang meleset 10 sampai 15 persen, masih mau pakai? Ini menguji risiko 5.
4. Dua fitur yang paling dibutuhkan, dari 11 fitur.
5. Mau bayar Rp15.000 sampai Rp30.000 buat petak pasti dekat lobi? Ini menguji harga Zona KENNETH.

Setelah itu feedback grid: yang disuka, yang diharapkan, yang masih bikin bingung, ide.

Kontak untuk follow up opsional dan hanya diisi dengan izin.

## Yang belum ada di prototipe

Supaya tidak ada yang mengira ini sudah jalan sungguhan:

- Angka okupansi, antrian, dan tarif semuanya simulasi. Belum ada palang yang terhubung.
- Pembayaran hanya simulasi. Tidak ada uang yang ditarik.
- Notifikasi duluan kalau ada yang batal (Premium) baru tertulis di halaman paket.
- Laporan kondisi dari pengguna tersimpan di HP, belum dikirim ke server mana pun.
- Login Google sudah ada, tapi data belum disinkronkan antar perangkat. Pindah HP berarti riwayat dan tiket
  mulai dari awal. Ini disengaja selama prototipe, supaya data pribadi tidak tersimpan di server.
- Zona KENNETH dan armada runner masih ide. Belum ada gedung yang menyisihkan petak dan belum ada runner. Nama runner di app contoh.
- Ganjil-genap belum menghitung hari libur nasional.
- Denah basement, lantai tenant, dan jumlah charger adalah data demo.
